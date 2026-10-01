import { useMemo, useState } from "react";
import { CalendarPlus } from "lucide-react";
import { toInput, uid } from "@/lib/baby";
import { useHealth } from "@/lib/use-health";
import { HealthSheet } from "./health-sheet";
import { Section, Stat, Toggle } from "./baby-ui";

// Medianas OMS 0–24 meses (aprox.)
const W = {
  m: [3.3, 4.5, 5.6, 6.4, 7.0, 7.5, 7.9, 8.3, 8.6, 8.9, 9.2, 9.4, 9.6, 9.9, 10.1, 10.3, 10.5, 10.7, 10.9, 11.1, 11.3, 11.5, 11.8, 12.0, 12.2],
  f: [3.2, 4.2, 5.1, 5.8, 6.4, 6.9, 7.3, 7.6, 7.9, 8.2, 8.5, 8.7, 8.9, 9.2, 9.4, 9.6, 9.8, 10.0, 10.2, 10.4, 10.6, 10.9, 11.1, 11.3, 11.5],
};
const H = {
  m: [49.9, 54.7, 58.4, 61.4, 63.9, 65.9, 67.6, 69.2, 70.6, 72.0, 73.3, 74.5, 75.7, 76.9, 78.0, 79.1, 80.2, 81.2, 82.3, 83.2, 84.2, 85.1, 86.0, 86.9, 87.8],
  f: [49.1, 53.7, 57.1, 59.8, 62.1, 64.0, 65.7, 67.3, 68.7, 70.1, 71.5, 72.8, 74.0, 75.2, 76.4, 77.5, 78.6, 79.7, 80.7, 81.7, 82.7, 83.7, 84.6, 85.5, 86.4],
};
const CV = { kg: 0.115, cm: 0.036 };
const MONTH = 30.4375 * 864e5;

const median = (tab: number[], age: number) => {
  const a = Math.max(0, Math.min(24, age)); const i = Math.min(23, Math.floor(a));
  return tab[i]! + (tab[i + 1]! - tab[i]!) * (a - i);
};
const erf = (x: number) => { const t = 1 / (1 + 0.3275911 * Math.abs(x)); const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; };
const pct = (v: number, m: number, cv: number) => Math.round(50 * (1 + erf((v / m - 1) / cv / Math.SQRT2)));

type Profile = { birth: string; sex: "m" | "f" };

export function GrowthView({ userId }: { userId: string | null }) {
  const { list, add } = useHealth(userId);
  const [sheet, setSheet] = useState(false);
  const [metric, setMetric] = useState<"kg" | "cm">("kg");
  const profRec = list.find((r) => r.kind === "profile");
  const profile: Profile | null = useMemo(() => { try { return profRec && profRec.kind === "profile" ? JSON.parse(profRec.note) : null; } catch { return null; } }, [profRec]);
  const [birth, setBirth] = useState(profile?.birth ?? "");
  const [sex, setSex] = useState<"m" | "f">(profile?.sex ?? "f");

  const measures = list.filter((r): r is Extract<typeof r, { kind: "measure" }> => r.kind === "measure").sort((a, b) => a.t - b.t);
  const weights = measures.filter((r) => r.kg != null);
  const birthT = profile ? new Date(profile.birth + "T00:00").getTime() : null;
  const ageOf = (t: number) => (birthT ? (t - birthT) / MONTH : 0);

  const last = weights.at(-1), prev = weights.at(-2), first = weights[0];
  const gain = (a?: typeof last, b?: typeof last) => a && b && a.t !== b.t ? ((a.kg! - b.kg!) * 1000) / ((a.t - b.t) / (7 * 864e5)) : null;
  const gLast = gain(last, prev), gAll = gain(last, first);
  const lastCm = [...measures].reverse().find((r) => r.cm != null);
  const tab = profile ? (metric === "kg" ? W : H)[profile.sex] : null;

  const saveProfile = () => {
    if (!birth) return;
    void add({ id: profRec?.id ?? uid(), t: Date.now(), kind: "profile", note: JSON.stringify({ birth, sex }) });
  };

  return (
    <div>
      <Section title="Datos del bebé">
        <div className="rounded-3xl bg-card p-4 shadow-sm">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm font-bold">Nacimiento<input type="date" max={toInput(new Date())} value={birth} onChange={(e) => setBirth(e.target.value)} className="mt-1 h-12 w-full rounded-xl bg-muted px-3 text-base" /></label>
            <div className="text-sm font-bold">Sexo<div className="mt-1"><Toggle value={sex} onChange={setSex} options={[["f", "Niña"], ["m", "Niño"]]} /></div></div>
          </div>
          {(birth !== (profile?.birth ?? "") || sex !== (profile?.sex ?? "f")) && (
            <button onClick={saveProfile} disabled={!birth} className="mt-3 h-12 w-full rounded-2xl bg-primary font-extrabold text-primary-foreground disabled:opacity-50">Guardar datos</button>
          )}
        </div>
      </Section>

      <Section title="Resumen">
        <div className="grid grid-cols-2 gap-3">
          <Stat cls="bg-primary text-primary-foreground" label="Peso actual" value={last ? `${last.kg} kg` : "—"}
            sub={last && profile ? `Percentil ≈ ${pct(last.kg!, median(W[profile.sex], ageOf(last.t)), CV.kg)}` : undefined} />
          <Stat cls="bg-accent text-accent-foreground" label="Talla actual" value={lastCm ? `${lastCm.cm} cm` : "—"}
            sub={lastCm && profile ? `Percentil ≈ ${pct(lastCm.cm!, median(H[profile.sex], ageOf(lastCm.t)), CV.cm)}` : undefined} />
          <Stat cls="bg-secondary text-secondary-foreground" label="Ganancia / semana" value={gLast != null ? `${gLast >= 0 ? "+" : ""}${Math.round(gLast)} g` : "—"} sub="Desde el pesaje anterior" />
          <Stat cls="bg-card shadow-sm" label="Promedio total" value={gAll != null ? `${gAll >= 0 ? "+" : ""}${Math.round(gAll)} g` : "—"} sub="Por semana, desde el 1er pesaje" />
        </div>
      </Section>

      <Section title="Gráfica de crecimiento">
        <div className="rounded-3xl bg-card p-4 shadow-sm">
          <Toggle value={metric} onChange={setMetric} options={[["kg", "⚖️ Peso"], ["cm", "📏 Talla"]]} />
          {!profile ? <p className="mt-4 text-center text-sm text-muted-foreground">Guarda la fecha de nacimiento y el sexo para ver las curvas de percentiles.</p>
            : <Chart points={measures.filter((r) => (metric === "kg" ? r.kg : r.cm) != null).map((r) => ({ x: ageOf(r.t), y: (metric === "kg" ? r.kg : r.cm)! }))} tab={tab!} cv={CV[metric]} unit={metric} />}
          <p className="mt-2 text-xs text-muted-foreground">Curvas de referencia OMS aproximadas (P15, P50, P85). Consulta siempre a tu pediatra.</p>
        </div>
      </Section>

      <button onClick={() => setSheet(true)} className="mt-4 flex h-16 w-full items-center justify-center gap-2 rounded-3xl bg-primary text-lg font-extrabold text-primary-foreground shadow-sm active:scale-95">
        <CalendarPlus className="h-6 w-6" /> Medidas y citas
      </button>
      {sheet && <HealthSheet userId={userId} onClose={() => setSheet(false)} />}
    </div>
  );
}

function Chart({ points, tab, cv, unit }: { points: { x: number; y: number }[]; tab: number[]; cv: number; unit: string }) {
  const W0 = 320, H0 = 200, pad = 28;
  const maxX = Math.min(24, Math.max(3, Math.ceil(Math.max(0, ...points.map((p) => p.x)) + 1)));
  const curve = (z: number) => Array.from({ length: maxX * 4 + 1 }, (_, i) => { const x = i / 4; return { x, y: median(tab, x) * (1 + z * cv) }; });
  const lines = [curve(-1.036), curve(0), curve(1.036)];
  const ys = [...lines.flat().map((p) => p.y), ...points.map((p) => p.y)];
  const minY = Math.floor(Math.min(...ys)), maxY = Math.ceil(Math.max(...ys));
  const sx = (x: number) => pad + (x / maxX) * (W0 - pad - 8);
  const sy = (y: number) => H0 - pad - ((y - minY) / (maxY - minY || 1)) * (H0 - pad - 8);
  const path = (l: { x: number; y: number }[]) => l.map((p, i) => `${i ? "L" : "M"}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W0} ${H0}`} className="mt-3 w-full">
      {[minY, (minY + maxY) / 2, maxY].map((y) => <text key={y} x={2} y={sy(y) + 4} fontSize="9" className="fill-muted-foreground">{Math.round(y)}</text>)}
      {[0, Math.round(maxX / 2), maxX].map((x) => <text key={x} x={sx(x) - 6} y={H0 - 10} fontSize="9" className="fill-muted-foreground">{x}m</text>)}
      {lines.map((l, i) => <path key={i} d={path(l)} fill="none" strokeWidth={i === 1 ? 2 : 1} strokeDasharray={i === 1 ? undefined : "4 3"} className="stroke-muted-foreground/50" />)}
      {points.length > 1 && <path d={path(points)} fill="none" strokeWidth={2.5} className="stroke-primary" />}
      {points.map((p, i) => <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={4} className="fill-primary" />)}
      <text x={W0 - 8} y={12} textAnchor="end" fontSize="9" className="fill-muted-foreground">{unit} · edad en meses</text>
    </svg>
  );
}
