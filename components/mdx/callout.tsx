import { Info, AlertTriangle, CheckCircle2, Lightbulb } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type CalloutType = "info" | "warning" | "success" | "tip";

const styles: Record<CalloutType, { icon: typeof Info; cls: string }> = {
  info: {
    icon: Info,
    cls: "border-blue-500/30 bg-blue-500/5 text-foreground",
  },
  warning: {
    icon: AlertTriangle,
    cls: "border-amber-500/30 bg-amber-500/5 text-foreground",
  },
  success: {
    icon: CheckCircle2,
    cls: "border-emerald-500/30 bg-emerald-500/5 text-foreground",
  },
  tip: {
    icon: Lightbulb,
    cls: "border-violet-500/30 bg-violet-500/5 text-foreground",
  },
};

export function Callout({
  type = "info",
  children,
}: {
  type?: CalloutType;
  children: ReactNode;
}) {
  const { icon: Icon, cls } = styles[type];
  return (
    <aside
      className={cn(
        "my-5 rounded-lg border px-4 py-3 text-sm leading-relaxed flex gap-3",
        cls,
      )}
    >
      <Icon aria-hidden className="size-4 mt-0.5 shrink-0" />
      <div className="flex-1 [&>p]:my-0 [&>p+p]:mt-2">{children}</div>
    </aside>
  );
}
