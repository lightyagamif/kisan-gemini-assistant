import type { ButtonHTMLAttributes, ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type V = "primary" | "gold" | "outline" | "ghost" | "danger";
const vs: Record<V, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary-2",
  gold: "bg-gold text-primary-foreground hover:bg-gold-soft hover:text-gold-foreground",
  outline: "border border-primary/40 text-primary hover:bg-secondary",
  ghost: "text-primary hover:bg-secondary",
  danger: "bg-destructive text-destructive-foreground hover:opacity-90",
};
export function Btn({ v = "primary", className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { v?: V }) {
  return <button {...p} className={cn("inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50", vs[v], className)} />;
}
export function Badge({ children, tone = "gold" }: { children: ReactNode; tone?: "gold" | "green" | "amber" | "red" | "muted" }) {
  const m = { gold: "border-gold text-gold", green: "border-success text-success", amber: "border-warning text-warning", red: "border-destructive text-destructive", muted: "border-border text-muted-foreground" };
  return <span className={cn("inline-flex items-center gap-1 rounded-full border bg-popover px-2 py-0.5 text-[0.7rem] font-semibold", m[tone])}>{children}</span>;
}
export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/50 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className={cn("max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-background p-5 shadow-2xl sm:rounded-2xl", wide ? "sm:max-w-2xl" : "sm:max-w-md")}>
        <div className="mb-4 flex items-center justify-between border-b border-gold/40 pb-3">
          <h3 className="text-lg font-bold text-primary">{title}</h3>
          <button aria-label="Close" onClick={onClose} className="rounded-full p-1 hover:bg-secondary"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="mb-1 block text-xs font-semibold text-muted-foreground">{label}</span>{children}</label>;
}
export const inputCls = "w-full rounded-lg border border-input bg-popover px-3 py-2.5 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-ring/30";
export function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return <div className="mb-4"><h2 className="text-2xl font-bold text-primary">{title}</h2>{sub && <p className="text-sm text-muted-foreground">{sub}</p>}</div>;
}
export function Crest({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <circle cx="32" cy="32" r="30" fill="none" stroke="currentColor" strokeWidth="2" className="text-gold" />
      <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeWidth="1" className="text-gold" strokeDasharray="2 3" />
      <g className="text-primary" fill="currentColor">
        <path d="M32 14 v34" stroke="currentColor" strokeWidth="2" />
        {[18, 24, 30, 36].map((y) => (<g key={y}><ellipse cx="27" cy={y} rx="5" ry="2.4" transform={`rotate(-35 27 ${y})`} /><ellipse cx="37" cy={y} rx="5" ry="2.4" transform={`rotate(35 37 ${y})`} /></g>))}
      </g>
    </svg>
  );
}
