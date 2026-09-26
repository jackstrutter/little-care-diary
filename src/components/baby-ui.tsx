import { useState } from "react";
import { Trash2, X } from "lucide-react";

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="mt-4"><h2 className="mb-2 text-sm font-extrabold uppercase tracking-wider text-muted-foreground">{title}</h2>{children}</section>;
}

export function BigBtn({ icon, label, onClick, className, small }: { icon: React.ReactNode; label: string; onClick: () => void; className: string; small?: boolean }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center gap-2 rounded-3xl font-extrabold shadow-sm transition active:scale-95 ${small ? "h-28 text-base" : "h-36 text-lg"} ${className}`}>
      {icon}<span className="leading-tight">{label}</span>
    </button>
  );
}

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
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

export function Toggle<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1">
      {options.map(([v, l]) => (
        <button key={v} onClick={() => onChange(v)} className={`rounded-xl py-3 font-bold ${value === v ? "bg-card shadow-sm" : "text-muted-foreground"}`}>{l}</button>
      ))}
    </div>
  );
}

export function Stepper({ value, set, step, unit }: { value: number; set: (n: number) => void; step: number; unit: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <button onClick={() => set(Math.max(0, value - step))} className="h-16 w-16 rounded-2xl bg-muted text-3xl font-extrabold active:scale-95">−</button>
      <div className="text-center"><div className="text-5xl font-extrabold">{value}</div><div className="text-muted-foreground">{unit}</div></div>
      <button onClick={() => set(value + step)} className="h-16 w-16 rounded-2xl bg-muted text-3xl font-extrabold active:scale-95">+</button>
    </div>
  );
}

export function useAmount() {
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

export function DelBtn({ onDel }: { onDel: () => void }) {
  return <button aria-label="Eliminar registro" onClick={() => confirm("¿Eliminar este registro?") && onDel()} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-destructive active:bg-muted"><Trash2 className="h-4 w-4" /></button>;
}

export function Stat({ label, value, sub, cls }: { label: string; value: string; sub?: string; cls: string }) {
  return <div className={`rounded-2xl p-3 ${cls}`}><div className="text-sm font-bold">{label}</div><div className="text-2xl font-extrabold">{value}</div>{sub && <div className="text-xs font-medium opacity-80">{sub}</div>}</div>;
}
