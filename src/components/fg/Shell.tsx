import { Bot, IndianRupee, ScanLine, Snowflake, TrendingUp } from "lucide-react";
import { useStore, type Tab } from "@/lib/store";
import { Crest } from "./ui";
import { TopBar } from "./TopBar";
import { ScanTab } from "./ScanTab";
import { ColdTab } from "./ColdTab";
import { PayTab } from "./PayTab";
import { IncomeTab } from "./IncomeTab";
import { AssistTab } from "./AssistTab";

export function Shell() {
  const { s, set, t } = useStore();
  const tabs: { k: Tab; en: string; hi: string; I: typeof ScanLine }[] = [
    { k: "scan", en: "Scan Crate", hi: "क्रेट स्कैन", I: ScanLine },
    { k: "cold", en: "Cold Rooms", hi: "कोल्ड स्टोर", I: Snowflake },
    { k: "pay", en: "Payments & Khata", hi: "भुगतान और खाता", I: IndianRupee },
    { k: "income", en: "My Income", hi: "मेरी आय", I: TrendingUp },
    { k: "assist", en: "Kisan Assistant", hi: "किसान सहायक", I: Bot },
  ];
  const go = (k: Tab) => { set((x) => ({ ...x, tab: k })); window.scrollTo({ top: 0 }); };
  const desktop = s.mode === "desktop";
  return (
    <div className="min-h-screen">
      <TopBar />
      <div className={`mx-auto ${desktop ? "flex max-w-6xl gap-6 px-4 py-6" : "max-w-lg pb-24"}`}>
        {desktop && (
          <aside className="card-classic sticky top-4 h-fit w-60 shrink-0 p-3">
            <div className="mb-3 flex items-center gap-2 border-b border-gold/40 pb-3"><Crest size={40} /><div><p className="font-serif text-lg font-black text-primary">FreshGrid</p><p className="text-[0.6rem] tracking-widest text-gold">SCAN · STORE · SELL</p></div></div>
            {tabs.map(({ k, en, hi, I }) => <button key={k} onClick={() => go(k)} className={`mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold ${s.tab === k ? "bg-primary text-primary-foreground" : "text-primary hover:bg-secondary"}`}><I className="h-4 w-4 shrink-0" />{t(en, hi)}</button>)}
          </aside>
        )}
        <main className={`min-w-0 flex-1 ${desktop ? "" : "px-4 pt-4"}`}>
          {!desktop && <div className="mb-3 flex items-center gap-2"><Crest size={34} /><p className="font-serif text-xl font-black text-primary">FreshGrid</p><span className="text-[0.6rem] tracking-widest text-gold">SCAN · STORE · SELL</span></div>}
          {s.tab === "scan" && <ScanTab />}{s.tab === "cold" && <ColdTab />}{s.tab === "pay" && <PayTab />}{s.tab === "income" && <IncomeTab />}{s.tab === "assist" && <AssistTab />}
        </main>
      </div>
      {!desktop && (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-gold bg-background">
          <div className="mx-auto grid max-w-lg grid-cols-5">
            {tabs.map(({ k, en, hi, I }) => <button key={k} onClick={() => go(k)} className={`flex flex-col items-center gap-0.5 py-2 text-[0.62rem] font-semibold leading-tight ${s.tab === k ? "text-primary" : "text-muted-foreground"}`}><I className={`h-5 w-5 ${s.tab === k ? "text-gold" : ""}`} /><span>{s.lang === "hi" ? hi : en.split(" ")[0]}</span></button>)}
          </div>
        </nav>
      )}
    </div>
  );
}
