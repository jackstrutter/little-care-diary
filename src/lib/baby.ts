export type Entry =
  | { id: string; t: number; kind: "bottle"; ml: number; milk: "formula" | "materna" }
  | { id: string; t: number; kind: "breast"; min: number }
  | { id: string; t: number; kind: "pump"; ml: number }
  | { id: string; t: number; kind: "diaper"; type: "pipi" | "popo" | "ambos" };

export const KEY = "mi-bebe-registros";
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
export const hora = (t: number) => new Date(t).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
export const dayStart = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
export const toInput = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const icon = (e: Entry) =>
  e.kind === "bottle" ? "🍼" : e.kind === "breast" ? "🤱" : e.kind === "pump" ? "🫙"
  : e.type === "pipi" ? "💧" : e.type === "popo" ? "💩" : "🧷";

export const desc = (e: Entry) =>
  e.kind === "bottle" ? `Biberón · ${e.ml} ml · ${e.milk === "formula" ? "Fórmula" : "Leche materna"}`
  : e.kind === "breast" ? `Pecho · ${e.min} min`
  : e.kind === "pump" ? `Extracción · ${e.ml} ml`
  : `Pañal · ${e.type === "pipi" ? "Pipí" : e.type === "popo" ? "Popó" : "Pipí y popó"}`;

export function summarize(list: Entry[]) {
  const r = { formula: 0, materna: 0, bottles: 0, breastMin: 0, breasts: 0, pump: 0, pumps: 0, pipi: 0, ambos: 0 };
  for (const e of list) {
    if (e.kind === "bottle") { r.bottles++; r[e.milk] += e.ml; }
    else if (e.kind === "breast") { r.breasts++; r.breastMin += e.min; }
    else if (e.kind === "pump") { r.pumps++; r.pump += e.ml; }
    else if (e.type === "pipi") r.pipi++; else r.ambos++;
  }
  return r;
}

/* ---------- Importador de historial escrito a mano ---------- */

const ozToMl = (oz: number) => Math.round(oz * 29.57);

function amountMl(line: string): number | null {
  const m = line.match(/(\d+(?:[.,]\d+)?)\s*(oz\b|onz\w*|ml\b|mililitros)/i);
  if (!m || !m[1] || !m[2]) return null;
  const n = parseFloat(m[1].replace(",", "."));
  return /ml|mililitros/i.test(m[2]) ? Math.round(n) : ozToMl(n);
}

export function parseHistory(text: string, year: number): { entries: Entry[]; skipped: string[] } {
  const entries: Entry[] = [];
  const skipped: string[] = [];
  let dayA: [number, number] | null = null;
  let dayB: [number, number] | null = null;

  const dates = (line: string) => {
    const out: [number, number][] = [];
    for (const m of line.matchAll(/(\d{1,2})\s*[/\-.]\s*(\d{1,2})/g)) {
      out.push([Number(m[1]), Number(m[2])]);
    }
    return out;
  };

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const hasTime = /\d{1,2}\s*:\s*\d{2}/.test(line);
    const found = dates(line);

    if (!hasTime && found.length) {
      dayA = found[0] ?? null;
      dayB = found[1] ?? null;
      continue;
    }
    if (!hasTime) { skipped.push(line); continue; }
    if (!dayA) { skipped.push(line); continue; }

    const tm = line.match(/(\d{1,2})\s*:\s*(\d{2})\s*(a\.?\s?m\.?|p\.?\s?m\.?)?/i);
    if (!tm || !tm[1] || !tm[2]) { skipped.push(line); continue; }
    let h = Number(tm[1]);
    const mi = Number(tm[2]);
    const mer = (tm[3] || "").replace(/[.\s]/g, "").toLowerCase();
    if (mer === "pm") h = (h % 12) + 12;
    else if (mer === "am") h = h % 12;

    // Sin meridiano: las horas 1–11 se toman como madrugada/mañana del 2º día.
    const day = dayB && (mer ? mer === "pm" : h >= 12) ? dayA : (dayB ?? dayA);
    const t = new Date(year, (day[1] ?? 1) - 1, day[0] ?? 1, h, mi).getTime();

    const ml = amountMl(line);
    if (/pa[ñn]al/i.test(line)) {
      entries.push({ id: uid(), t, kind: "diaper", type: /ambos|popo|popó/i.test(line) ? "ambos" : "pipi" });
    } else if (/extra|saca|bomb/i.test(line)) {
      entries.push({ id: uid(), t, kind: "pump", ml: ml ?? 90 });
    } else if (/pecho|lactan|teta/i.test(line) && /(\d+)\s*min/i.test(line)) {
      entries.push({ id: uid(), t, kind: "breast", min: Number(line.match(/(\d+)\s*min/i)?.[1] ?? 10) });
    } else if (/toma|biber|f[oó]rmula|materna|oz|onz|ml/i.test(line)) {
      entries.push({ id: uid(), t, kind: "bottle", ml: ml ?? 90, milk: /materna|pecho/i.test(line) ? "materna" : "formula" });
    } else {
      skipped.push(line);
    }
  }
  return { entries: entries.sort((a, b) => a.t - b.t), skipped };
}
