import { BadgeCheck, LogOut, Monitor, Smartphone } from "lucide-react";
import { CROPS, useStore } from "@/lib/store";
import { useMandi, useMe } from "@/lib/data";

export function TopBar() {
  const { s, set, signOut } = useStore();
  const { data: me } = useMe();
  const { data: m } = useMandi(me?.profile?.state);
  const desktop = s.mode === "desktop";
  const live = m?.available && m.prices.length > 0;
  const ticker = live
    ? m!.prices.map((p) => `${CROPS.find((c) => c.key === p.crop)?.en}: ₹${p.modalPerKg}/kg (₹${p.minPerKg}–${p.maxPerKg}) · ${p.market} · ${p.date}`)
    : CROPS.map((c) => `${c.en}: ~₹${c.rate}/kg (indicative)`);
  const p = me?.profile;
  return (
    <div className="bg-primary text-primary-foreground">
      <div className="flex items-center overflow-hidden border-b border-gold/40 py-1.5 text-xs">
        <span className="z-10 shrink-0 bg-gold px-2 py-0.5 font-bold">{live ? "AGMARKNET LIVE" : "MANDI RATES"}</span>
        <div className="overflow-hidden"><div className="animate-marquee flex w-max gap-8 whitespace-nowrap pl-6">{[...ticker, ...ticker].map((x, i) => <span key={i}>{x}</span>)}</div></div>
      </div>
      <div className={`mx-auto flex flex-wrap items-center gap-2 px-3 py-2 text-xs ${desktop ? "max-w-6xl" : "max-w-lg"}`}>
        <div className="flex items-center gap-1 rounded-full border border-gold/60 px-1 py-0.5">
          <button aria-label="Decrease font" className="px-1.5 font-bold" onClick={() => set((x) => ({ ...x, scale: Math.max(13, x.scale - 1) }))}>A-</button>
          <button aria-label="Increase font" className="px-1.5 font-bold" onClick={() => set((x) => ({ ...x, scale: Math.min(21, x.scale + 1) }))}>A+</button>
        </div>
        <button className="rounded-full border border-gold/60 px-2 py-0.5 font-bold" onClick={() => set((x) => ({ ...x, lang: x.lang === "en" ? "hi" : "en" }))}>{s.lang === "en" ? "EN / हिंदी" : "हिंदी / EN"}</button>
        <button className="flex items-center gap-1 rounded-full border border-gold/60 px-2 py-0.5" onClick={() => set((x) => ({ ...x, mode: desktop ? "mobile" : "desktop" }))}>{desktop ? <Smartphone className="h-3.5 w-3.5" /> : <Monitor className="h-3.5 w-3.5" />}{desktop ? "Field App" : "Desktop"}</button>
        <div className="ml-auto flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-full bg-primary-2 px-2 py-0.5 font-semibold">
            {me?.role === "buyer" ? `${p?.org_name} • Buyer` : `${p?.full_name} • FPO ID: ${p?.fpo_id ?? "—"}`} <BadgeCheck className="h-3.5 w-3.5 text-gold-soft" />
          </span>
          <button aria-label="Logout" onClick={signOut} className="rounded-full p-1 hover:bg-primary-2"><LogOut className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
}
