import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const tones = {
  canonical: "border-blue-400/25 bg-blue-400/10 text-blue-200",
  integrated: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
  referenced: "border-violet-400/25 bg-violet-400/10 text-violet-200",
  discovered: "border-amber-400/25 bg-amber-400/10 text-amber-200",
  neutral: "border-white/10 bg-white/[0.04] text-slate-300"
};

export function Badge({ tone = "neutral", className, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof tones }) {
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold", tones[tone], className)} {...props} />;
}
