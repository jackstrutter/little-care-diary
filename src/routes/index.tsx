import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Baby, Milk, Droplet, Trash2, BarChart3, X, Play, Pause, Timer, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mi Bebé — Control diario de tomas y pañales" },
      { name: "description", content: "Registra tomas de biberón, pecho y pañales de tu bebé con una sola mano." },
      { property: "og:title", content: "Mi Bebé — Control diario" },
      { property: "og:description", content: "Registro rápido de tomas y pañales para padres." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

type Entry =
  | { id: string; t: number; kind: "bottle"; ml: number; milk: "formula" | "materna" }
  | { id: string; t: number; kind: "breast"; min: number }
  | { id: string; t: number; kind: "diaper"; type: "pipi" | "popo" | "ambos" };

const KEY = "mi-bebe-registros";
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const hora = (t: number) => new Date(t).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });

function Index() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [modal, setModal] = useState<null | "bottle" | "breast" | "chart">(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) localStorage.setItem(KEY, JSON.stringify(entries)); }, [entries, loaded]);

  const add = (e: Entry, msg: string) => {
    setEntries((p) => [e, ...p]);
    setToast(msg);
    setTimeout(() => setToast(""), 1600);
  };

  const today = useMemo(() => {
    const s = new Date(); s.setHours(0, 0, 0, 0);
    return entries.filter((e) => e.t >= s.getTime()).sort((a, b) => b.t - a.t);
  }, [entries]);

  const diaper = (type: "pipi" | "popo" | "ambos", label: string) =>
    add({ id: uid(), t: Date.now(), kind: "diaper", type }, `Pañal: ${label} ✓`);

  return (
    <main className="mx-auto min-h-dvh max-w-md px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="mb-4 flex items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-secondary"><Baby className="h-6 w-6" /></div>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold">Mi Bebé</h1>
          <p className="text-sm capitalize text-muted-foreground">{new Date().toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" })}</p>
        </div>
      </header>

      <Section title="Tomas">
        <div className="grid grid-cols-2 gap-3">
          <BigBtn className="bg-primary text-primary-foreground" onClick={() => setModal("bottle")} icon={<Milk className="h-9 w-9" />} label="Toma de Biberón" />
          <BigBtn className="bg-accent text-accent-foreground" onClick={() => setModal("breast")} icon={<Sparkles className="h-9 w-9" />} label="Toma de Pecho" />
        </div>
      </Section>

      <Section title="Pañales">
        <div className="grid grid-cols-3 gap-3">
          <BigBtn small className="bg-secondary text-secondary-foreground" onClick={() => diaper("pipi", "Pipí")} icon={<Droplet className="h-8 w-8" />} label="Pipí" />
          <BigBtn small className="bg-accent text-accent-foreground" onClick={() => diaper("popo", "Popó")} icon={<span className="text-3xl">💩</span>} label="Popó" />
          <BigBtn small className="bg-primary text-primary-foreground" onClick={() => diaper("ambos", "Ambos")} icon={<span className="text-3xl">💧💩</span>} label="Ambos" />
        </div>
      </Section>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-extrabold">Historial de hoy</h2>
          <button onClick={() => setModal("chart")} className="flex items-center gap-1.5 rounded-full bg-card px-4 py-2 text-sm font-bold shadow-sm active:scale-95">
            <BarChart3 className="h-4 w-4" /> Gráfica
          </button>
        </div>
        {today.length === 0 ? (
          <p className="rounded-2xl bg-card p-6 text-center text-muted-foreground">Aún no hay registros hoy.</p>
        ) : (
          <ul className="space-y-2">
            {today.map((e) => (
              <li key={e.id} className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-sm">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-muted text-xl">{icon(e)}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{desc(e)}</p>
                  <p className="text-sm text-muted-foreground">{hora(e.t)}</p>
                </div>
                <button aria-label="Eliminar registro" onClick={() => confirm("¿Eliminar este registro?") && setEntries((p) => p.filter((x) => x.id !== e.id))} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-destructive active:bg-muted">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {modal === "bottle" && <BottleModal onClose={() => setModal(null)} onSave={(ml, milk) => { add({ id: uid(), t: Date.now(), kind: "bottle", ml, milk }, "Biberón registrado ✓"); setModal(null); }} />}
      {modal === "breast" && <BreastModal onClose={() => setModal(null)} onSave={(min) => { add({ id: uid(), t: Date.now(), kind: "breast", min }, "Toma de pecho registrada ✓"); setModal(null); }} />}
      {modal === "chart" && <ChartModal entries={entries} onClose={() => setModal(null)} />}

      {toast && <div className="fixed inset-x-0 bottom-6 mx-auto w-fit rounded-full bg-foreground px-5 py-3 font-bold text-background shadow-lg">{toast}</div>}
    </main>
  );
}

const icon = (e: Entry) => e.kind === "bottle" ? "🍼" : e.kind === "breast" ? "🤱" : e.type === "pipi" ? "💧" : e.type === "popo" ? "💩" : "🧷";
const desc = (e: Entry) =>
  e.kind === "bottle" ? `Biberón · ${e.ml} ml · ${e.milk === "formula" ? "Fórmula" : "Leche materna"}`
  : e.kind === "breast" ? `Pecho · ${e.min} min`
  : `Pañal · ${e.type === "pipi" ? "Pipí" : e.type === "popo" ? "Popó" : "Pipí y popó"}`;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="mt-4"><h2 className="mb-2 text-sm font-extrabold uppercase tracking-wider text-muted-foreground">{title}</h2>{children}</section>;
}

function BigBtn({ icon, label, onClick, className, small }: { icon: React.ReactNode; label: string; onClick: () => void; className: string; small?: boolean }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center gap-2 rounded-3xl font-extrabold shadow-sm transition active:scale-95 ${small ? "h-28 text-base" : "h-36 text-lg"} ${className}`}>
      {icon}<span className="leading-tight">{label}</span>
    </button>
  );
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30" onClick={onClose}>
      <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-card p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-extrabold">{title}</h3>
          <button aria-label="Cerrar" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-muted"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Toggle<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1">
      {options.map(([v, l]) => (
        <button key={v} onClick={() => onChange(v)} className={`rounded-xl py-3 font-bold ${value === v ? "bg-card shadow-sm" : "text-muted-foreground"}`}>{l}</button>
      ))}
    </div>
  );
}

function Stepper({ value, set, step, unit }: { value: number; set: (n: number) => void; step: number; unit: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <button onClick={() => set(Math.max(0, value - step))} className="h-16 w-16 rounded-2xl bg-muted text-3xl font-extrabold active:scale-95">−</button>
      <div className="text-center"><div className="text-5xl font-extrabold">{value}</div><div className="text-muted-foreground">{unit}</div></div>
      <button onClick={() => set(value + step)} className="h-16 w-16 rounded-2xl bg-muted text-3xl font-extrabold active:scale-95">+</button>
    </div>
  );
}

function BottleModal({ onClose, onSave }: { onClose: () => void; onSave: (ml: number, milk: "formula" | "materna") => void }) {
  const [unit, setUnit] = useState<"ml" | "oz">("ml");
  const [amount, setAmount] = useState(90);
  const [milk, setMilk] = useState<"formula" | "materna">("formula");
  const changeUnit = (u: "ml" | "oz") => { if (u === unit) return; setAmount(u === "oz" ? Math.round(amount / 30) : amount * 30); setUnit(u); };
  const ml = unit === "ml" ? amount : Math.round(amount * 29.57);
  return (
    <Sheet title="Toma de Biberón" onClose={onClose}>
      <div className="space-y-5">
        <Toggle value={unit} onChange={changeUnit} options={[["ml", "Mililitros"], ["oz", "Onzas"]]} />
        <Stepper value={amount} set={setAmount} step={unit === "ml" ? 10 : 0.5} unit={unit === "ml" ? "ml" : "oz"} />
        <Toggle value={milk} onChange={setMilk} options={[["formula", "🥛 Fórmula"], ["materna", "🤍 Leche materna"]]} />
        <button disabled={amount <= 0} onClick={() => onSave(ml, milk)} className="h-16 w-full rounded-2xl bg-primary text-lg font-extrabold text-primary-foreground disabled:opacity-50">Guardar toma</button>
      </div>
    </Sheet>
  );
}

function BreastModal({ onClose, onSave }: { onClose: () => void; onSave: (min: number) => void }) {
  const [mode, setMode] = useState<"timer" | "manual">("timer");
  const [secs, setSecs] = useState(0);
  const [running, setRunning] = useState(false);
  const [manual, setManual] = useState(10);
  const ref = useRef<number | null>(null);
  useEffect(() => {
    if (!running) return;
    const start = Date.now() - secs * 1000;
    ref.current = window.setInterval(() => setSecs(Math.floor((Date.now() - start) / 1000)), 500);
    return () => { if (ref.current) clearInterval(ref.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);
  const min = mode === "timer" ? Math.max(1, Math.round(secs / 60)) : manual;
  const mm = String(Math.floor(secs / 60)).padStart(2, "0"), ss = String(secs % 60).padStart(2, "0");
  return (
    <Sheet title="Toma de Pecho" onClose={onClose}>
      <div className="space-y-5">
        <Toggle value={mode} onChange={setMode} options={[["timer", "⏱ Cronómetro"], ["manual", "Minutos"]]} />
        {mode === "timer" ? (
          <div className="flex flex-col items-center gap-4">
            <div className="text-6xl font-extrabold tabular-nums">{mm}:{ss}</div>
            <div className="flex gap-3">
              <button onClick={() => setRunning(!running)} className="flex h-16 items-center gap-2 rounded-2xl bg-secondary px-8 text-lg font-extrabold text-secondary-foreground">
                {running ? <><Pause /> Pausar</> : <><Play /> {secs ? "Continuar" : "Iniciar"}</>}
              </button>
              {secs > 0 && !running && <button onClick={() => setSecs(0)} className="h-16 rounded-2xl bg-muted px-5 font-bold"><Timer className="inline h-5 w-5" /> Reiniciar</button>}
            </div>
          </div>
        ) : <Stepper value={manual} set={setManual} step={1} unit="minutos" />}
        <button disabled={(mode === "timer" && secs === 0) || (mode === "manual" && manual <= 0)} onClick={() => onSave(min)} className="h-16 w-full rounded-2xl bg-accent text-lg font-extrabold text-accent-foreground disabled:opacity-50">Guardar toma ({min} min)</button>
      </div>
    </Sheet>
  );
}

function ChartModal({ entries, onClose }: { entries: Entry[]; onClose: () => void }) {
  const [offset, setOffset] = useState(0);
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const dow = (start.getDay() + 6) % 7; // lunes = 0
  start.setDate(start.getDate() - dow - offset * 7);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start); d.setDate(d.getDate() + i);
    const end = d.getTime() + 86400000;
    const b = entries.filter((e): e is Extract<Entry, { kind: "bottle" }> => e.kind === "bottle" && e.t >= d.getTime() && e.t < end);
    return {
      label: d.toLocaleDateString("es", { weekday: "short" }).slice(0, 3),
      formula: b.filter((x) => x.milk === "formula").reduce((s, x) => s + x.ml, 0),
      materna: b.filter((x) => x.milk === "materna").reduce((s, x) => s + x.ml, 0),
    };
  });
  const max = Math.max(100, ...days.flatMap((d) => [d.formula, d.materna]));
  const totF = days.reduce((s, d) => s + d.formula, 0), totM = days.reduce((s, d) => s + d.materna, 0);
  const endDate = new Date(start); endDate.setDate(endDate.getDate() + 6);
  const f = (d: Date) => d.toLocaleDateString("es", { day: "numeric", month: "short" });
  return (
    <Sheet title="Tomas por semana" onClose={onClose}>
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => setOffset(offset + 1)} className="h-11 w-11 rounded-full bg-muted text-xl font-extrabold">‹</button>
        <div className="text-center font-bold">{offset === 0 ? "Esta semana" : `Hace ${offset} sem.`}<div className="text-sm font-medium text-muted-foreground">{f(start)} – {f(endDate)}</div></div>
        <button disabled={offset === 0} onClick={() => setOffset(offset - 1)} className="h-11 w-11 rounded-full bg-muted text-xl font-extrabold disabled:opacity-30">›</button>
      </div>
      <div className="flex h-48 items-end justify-between gap-1 rounded-2xl bg-muted/50 p-3">
        {days.map((d, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-36 items-end gap-0.5">
              <div className="w-3 rounded-t-md bg-primary" style={{ height: `${(d.formula / max) * 100}%` }} />
              <div className="w-3 rounded-t-md bg-secondary" style={{ height: `${(d.materna / max) * 100}%` }} />
            </div>
            <span className="text-xs font-bold capitalize text-muted-foreground">{d.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-primary p-3 text-primary-foreground"><div className="text-sm font-bold">🥛 Fórmula</div><div className="text-2xl font-extrabold">{totF} ml</div></div>
        <div className="rounded-2xl bg-secondary p-3 text-secondary-foreground"><div className="text-sm font-bold">🤍 Materna</div><div className="text-2xl font-extrabold">{totM} ml</div></div>
      </div>
    </Sheet>
  );
}
