import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Baby, Milk, Droplet, Trash2, BarChart3, X, Play, Pause, Timer, Sparkles, CalendarPlus } from "lucide-react";

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
  | { id: string; t: number; kind: "pump"; ml: number }
  | { id: string; t: number; kind: "diaper"; type: "pipi" | "popo" | "ambos" };

const KEY = "mi-bebe-registros";
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const hora = (t: number) => new Date(t).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });

function Index() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [modal, setModal] = useState<null | "bottle" | "breast" | "pump" | "chart" | "history">(null);
  const [past, setPast] = useState<null | "bottle" | "breast" | "pump">(null);
  const [pastT, setPastT] = useState<number>(0);
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
          <div className="col-span-2"><BigBtn small className="w-full bg-secondary text-secondary-foreground" onClick={() => setModal("pump")} icon={<span className="text-3xl">🫙</span>} label="Extracción" /></div>
        </div>
      </Section>

      <Section title="Pañales">
        <div className="grid grid-cols-2 gap-3">
          <BigBtn small className="bg-secondary text-secondary-foreground" onClick={() => diaper("pipi", "Pipí")} icon={<Droplet className="h-8 w-8" />} label="Pipí" />
          <BigBtn small className="bg-primary text-primary-foreground" onClick={() => diaper("ambos", "Ambos")} icon={<span className="text-3xl">💧💩</span>} label="Ambos" />
        </div>
      </Section>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-extrabold">Historial de hoy</h2>
          <div className="flex gap-2">
          <button onClick={() => setModal("history")} className="flex items-center gap-1.5 rounded-full bg-card px-4 py-2 text-sm font-bold shadow-sm active:scale-95">
            <CalendarPlus className="h-4 w-4" /> Pasado
          </button>
          <button onClick={() => setModal("chart")} className="flex items-center gap-1.5 rounded-full bg-card px-4 py-2 text-sm font-bold shadow-sm active:scale-95">
            <BarChart3 className="h-4 w-4" /> Gráfica
          </button>
          </div>
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
                <DelBtn onDel={() => setEntries((p) => p.filter((x) => x.id !== e.id))} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {modal === "bottle" && <BottleModal onClose={() => setModal(null)} onSave={(ml, milk) => { add({ id: uid(), t: Date.now(), kind: "bottle", ml, milk }, "Biberón registrado ✓"); setModal(null); }} />}
      {modal === "breast" && <BreastModal onClose={() => setModal(null)} onSave={(min) => { add({ id: uid(), t: Date.now(), kind: "breast", min }, "Toma de pecho registrada ✓"); setModal(null); }} />}
      {modal === "pump" && <PumpModal onClose={() => setModal(null)} onSave={(ml) => { add({ id: uid(), t: Date.now(), kind: "pump", ml }, "Extracción registrada ✓"); setModal(null); }} />}
      {modal === "chart" && <ChartModal entries={entries} onClose={() => setModal(null)} />}
      {modal === "history" && <HistoryModal entries={entries} onClose={() => setModal(null)}
        onDel={(id) => setEntries((p) => p.filter((x) => x.id !== id))}
        onAdd={(k, t) => { if (k === "pipi" || k === "ambos") add({ id: uid(), t, kind: "diaper", type: k }, "Pañal agregado ✓"); else { setPastT(t); setPast(k); } }} />}
      {past === "bottle" && <BottleModal onClose={() => setPast(null)} onSave={(ml, milk) => { add({ id: uid(), t: pastT, kind: "bottle", ml, milk }, "Biberón agregado ✓"); setPast(null); }} />}
      {past === "breast" && <BreastModal onClose={() => setPast(null)} onSave={(min) => { add({ id: uid(), t: pastT, kind: "breast", min }, "Toma de pecho agregada ✓"); setPast(null); }} />}
      {past === "pump" && <PumpModal onClose={() => setPast(null)} onSave={(ml) => { add({ id: uid(), t: pastT, kind: "pump", ml }, "Extracción agregada ✓"); setPast(null); }} />}

      {toast && <div className="fixed inset-x-0 bottom-6 z-[70] mx-auto w-fit rounded-full bg-foreground px-5 py-3 font-bold text-background shadow-lg">{toast}</div>}
    </main>
  );
}

const icon = (e: Entry) => e.kind === "bottle" ? "🍼" : e.kind === "breast" ? "🤱" : e.kind === "pump" ? "🫙" : e.type === "pipi" ? "💧" : e.type === "popo" ? "💩" : "🧷";
const desc = (e: Entry) =>
  e.kind === "bottle" ? `Biberón · ${e.ml} ml · ${e.milk === "formula" ? "Fórmula" : "Leche materna"}`
  : e.kind === "breast" ? `Pecho · ${e.min} min`
  : e.kind === "pump" ? `Extracción · ${e.ml} ml`
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
    <div className="fixed inset-0 z-50 flex items-end [&+&]:z-[60] justify-center bg-foreground/30" onClick={onClose}>
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

function useAmount() {
  const [unit, setUnit] = useState<"ml" | "oz">("ml");
  const [amount, setAmount] = useState(90);
  const changeUnit = (u: "ml" | "oz") => { if (u === unit) return; setAmount(u === "oz" ? Math.round(amount / 30) : amount * 30); setUnit(u); };
  const ml = unit === "ml" ? amount : Math.round(amount * 29.57);
  const ui = <>
    <Toggle value={unit} onChange={changeUnit} options={[["ml", "Mililitros"], ["oz", "Onzas"]]} />
    <Stepper value={amount} set={setAmount} step={unit === "ml" ? 10 : 0.5} unit={unit === "ml" ? "ml" : "oz"} />
  </>;
  return { ml, amount, ui };
}

function DelBtn({ onDel }: { onDel: () => void }) {
  return <button aria-label="Eliminar registro" onClick={() => confirm("¿Eliminar este registro?") && onDel()} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-destructive active:bg-muted"><Trash2 className="h-4 w-4" /></button>;
}

function PumpModal({ onClose, onSave }: { onClose: () => void; onSave: (ml: number) => void }) {
  const a = useAmount();
  return (
    <Sheet title="Extracción" onClose={onClose}>
      <div className="space-y-5">
        {a.ui}
        <button disabled={a.amount <= 0} onClick={() => onSave(a.ml)} className="h-16 w-full rounded-2xl bg-secondary text-lg font-extrabold text-secondary-foreground disabled:opacity-50">Guardar extracción</button>
      </div>
    </Sheet>
  );
}

const dayStart = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const toInput = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function HistoryModal({ entries, onClose, onAdd, onDel }: { entries: Entry[]; onClose: () => void; onAdd: (k: "bottle" | "breast" | "pump" | "pipi" | "ambos", t: number) => void; onDel: (id: string) => void }) {
  const y = new Date(); y.setDate(y.getDate() - 1);
  const [date, setDate] = useState(toInput(y));
  const [time, setTime] = useState("12:00");
  const [yy, mo, dd] = date.split("-").map(Number);
  const [hh, mi] = time.split(":").map(Number);
  const t = new Date(yy, mo - 1, dd, hh || 0, mi || 0).getTime();
  const s = new Date(yy, mo - 1, dd).getTime();
  const list = entries.filter((e) => e.t >= s && e.t < s + 86400000).sort((a, b) => a.t - b.t);
  const btn = "rounded-2xl py-4 font-extrabold active:scale-95";
  return (
    <Sheet title="Llenar historial pasado" onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm font-bold">Fecha<input type="date" max={toInput(new Date())} value={date} onChange={(e) => e.target.value && setDate(e.target.value)} className="mt-1 h-12 w-full rounded-xl bg-muted px-3 text-base" /></label>
        <label className="text-sm font-bold">Hora<input type="time" value={time} onChange={(e) => e.target.value && setTime(e.target.value)} className="mt-1 h-12 w-full rounded-xl bg-muted px-3 text-base" /></label>
      </div>
      <p className="mt-4 mb-2 text-sm font-extrabold uppercase tracking-wider text-muted-foreground">Agregar a esa hora</p>
      <div className="grid grid-cols-3 gap-2">
        <button onClick={() => onAdd("bottle", t)} className={`${btn} bg-primary text-primary-foreground`}>🍼 Biberón</button>
        <button onClick={() => onAdd("breast", t)} className={`${btn} bg-accent text-accent-foreground`}>🤱 Pecho</button>
        <button onClick={() => onAdd("pump", t)} className={`${btn} bg-secondary text-secondary-foreground`}>🫙 Extracción</button>
        <button onClick={() => onAdd("pipi", t)} className={`${btn} bg-muted`}>💧 Pipí</button>
        <button onClick={() => onAdd("ambos", t)} className={`${btn} bg-muted`}>🧷 Ambos</button>
      </div>
      <p className="mt-5 mb-2 text-sm font-extrabold uppercase tracking-wider text-muted-foreground">Registros de ese día</p>
      {list.length === 0 ? <p className="rounded-2xl bg-muted/50 p-4 text-center text-muted-foreground">Sin registros.</p> :
        <ul className="space-y-2">{list.map((e) => (
          <li key={e.id} className="flex items-center gap-3 rounded-2xl bg-muted/50 p-2">
            <span className="text-xl">{icon(e)}</span>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{desc(e)}</p><p className="text-xs text-muted-foreground">{hora(e.t)}</p></div>
            <DelBtn onDel={() => onDel(e.id)} />
          </li>))}</ul>}
    </Sheet>
  );
}

function BottleModal({ onClose, onSave }: { onClose: () => void; onSave: (ml: number, milk: "formula" | "materna") => void }) {
  const a = useAmount(); const { ml, amount } = a;
  const [milk, setMilk] = useState<"formula" | "materna">("formula");
  return (
    <Sheet title="Toma de Biberón" onClose={onClose}>
      <div className="space-y-5">
        {a.ui}
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

function summarize(list: Entry[]) {
  const r = { formula: 0, materna: 0, bottles: 0, breastMin: 0, breasts: 0, pump: 0, pumps: 0, pipi: 0, ambos: 0 };
  for (const e of list) {
    if (e.kind === "bottle") { r.bottles++; r[e.milk] += e.ml; }
    else if (e.kind === "breast") { r.breasts++; r.breastMin += e.min; }
    else if (e.kind === "pump") { r.pumps++; r.pump += e.ml; }
    else if (e.type === "pipi") r.pipi++; else r.ambos++;
  }
  return r;
}

function Stat({ label, value, sub, cls }: { label: string; value: string; sub?: string; cls: string }) {
  return <div className={`rounded-2xl p-3 ${cls}`}><div className="text-sm font-bold">{label}</div><div className="text-2xl font-extrabold">{value}</div>{sub && <div className="text-xs font-medium opacity-80">{sub}</div>}</div>;
}

function ChartModal({ entries, onClose }: { entries: Entry[]; onClose: () => void }) {
  const [mode, setMode] = useState<"day" | "week">("day");
  const [offset, setOffset] = useState(0);
  const f = (d: Date) => d.toLocaleDateString("es", { day: "numeric", month: "short" });
  const inRange = (a: number, b: number) => entries.filter((e) => e.t >= a && e.t < b);

  let start = dayStart(new Date()), len = 1, title = "";
  if (mode === "day") {
    start.setDate(start.getDate() - offset);
    title = offset === 0 ? "Hoy" : offset === 1 ? "Ayer" : start.toLocaleDateString("es", { weekday: "long" });
  } else {
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7) - offset * 7); len = 7;
    title = offset === 0 ? "Esta semana" : `Hace ${offset} sem.`;
  }
  const end = new Date(start); end.setDate(end.getDate() + len);
  const list = inRange(start.getTime(), end.getTime()).sort((a, b) => a.t - b.t);
  const sum = summarize(list);
  const last = new Date(end.getTime() - 1);

  // bars
  const bars = mode === "week"
    ? Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(d.getDate() + i); const s = summarize(inRange(d.getTime(), d.getTime() + 86400000)); return { label: d.toLocaleDateString("es", { weekday: "short" }).slice(0, 3), ...s }; })
    : Array.from({ length: 8 }, (_, i) => { const a = start.getTime() + i * 3 * 3600000; const s = summarize(inRange(a, a + 3 * 3600000)); return { label: `${i * 3}h`, ...s }; });
  const max = Math.max(60, ...bars.map((b) => Math.max(b.formula + b.materna, b.pump)));
  const maxD = Math.max(1, ...bars.map((b) => b.pipi + b.ambos));

  return (
    <Sheet title="Gráfica y detalle" onClose={onClose}>
      <div className="mb-4"><Toggle value={mode} onChange={(m) => { setMode(m); setOffset(0); }} options={[["day", "Por día"], ["week", "Por semana"]]} /></div>
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => setOffset(offset + 1)} className="h-11 w-11 rounded-full bg-muted text-xl font-extrabold">‹</button>
        <div className="text-center font-bold capitalize">{title}<div className="text-sm font-medium normal-case text-muted-foreground">{mode === "day" ? f(start) : `${f(start)} – ${f(last)}`}</div></div>
        <button disabled={offset === 0} onClick={() => setOffset(offset - 1)} className="h-11 w-11 rounded-full bg-muted text-xl font-extrabold disabled:opacity-30">›</button>
      </div>

      <div className="rounded-2xl bg-muted/50 p-3">
        <div className="flex h-40 items-end justify-between gap-1">
          {bars.map((d, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex h-32 items-end gap-0.5">
                <div className="flex w-2.5 flex-col justify-end overflow-hidden rounded-t-md" style={{ height: `${((d.formula + d.materna) / max) * 100}%` }}>
                  <div className="bg-secondary" style={{ height: `${d.formula + d.materna ? (d.materna / (d.formula + d.materna)) * 100 : 0}%` }} />
                  <div className="flex-1 bg-primary" />
                </div>
                <div className="w-2.5 rounded-t-md bg-accent" style={{ height: `${(d.pump / max) * 100}%` }} />
                <div className="w-2.5 rounded-t-md bg-foreground/25" style={{ height: `${((d.pipi + d.ambos) / maxD) * 100}%` }} />
              </div>
              <span className="text-[10px] font-bold capitalize text-muted-foreground">{d.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs font-bold text-muted-foreground">
          <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded bg-primary" />Fórmula</span>
          <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded bg-secondary" />Materna</span>
          <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded bg-accent" />Extracción</span>
          <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded bg-foreground/25" />Pañales</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Stat cls="bg-primary text-primary-foreground" label="🍼 Biberón" value={`${sum.formula + sum.materna} ml`} sub={`${sum.bottles} tomas · F ${sum.formula} / M ${sum.materna}`} />
        <Stat cls="bg-accent text-accent-foreground" label="🤱 Pecho" value={`${sum.breastMin} min`} sub={`${sum.breasts} tomas`} />
        <Stat cls="bg-secondary text-secondary-foreground" label="🫙 Extracción" value={`${sum.pump} ml`} sub={`${sum.pumps} extracciones`} />
        <Stat cls="bg-muted" label="🧷 Pañales" value={`${sum.pipi + sum.ambos}`} sub={`${sum.pipi} pipí · ${sum.ambos} ambos`} />
      </div>
      {mode === "week" && <p className="mt-2 text-center text-xs text-muted-foreground">Promedio diario biberón: {Math.round((sum.formula + sum.materna) / 7)} ml</p>}

      <h4 className="mt-5 mb-2 text-sm font-extrabold uppercase tracking-wider text-muted-foreground">Detalle</h4>
      {list.length === 0 ? <p className="rounded-2xl bg-muted/50 p-4 text-center text-muted-foreground">Sin registros.</p> :
        <ul className="space-y-1.5">{list.map((e) => (
          <li key={e.id} className="flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2">
            <span className="text-lg">{icon(e)}</span>
            <p className="min-w-0 flex-1 truncate text-sm font-bold">{desc(e)}</p>
            <span className="shrink-0 text-xs text-muted-foreground">{mode === "week" && new Date(e.t).toLocaleDateString("es", { weekday: "short" }) + " "}{hora(e.t)}</span>
          </li>))}</ul>}
    </Sheet>
  );
}
