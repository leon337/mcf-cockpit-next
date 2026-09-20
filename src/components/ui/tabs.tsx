import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/cn";

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: TabsPrimitive.TabsListProps) {
  return <TabsPrimitive.List className={cn("mb-6 flex w-full gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-panel p-1.5 sm:w-max", className)} {...props} />;
}

export function TabsTrigger({ className, ...props }: TabsPrimitive.TabsTriggerProps) {
  return <TabsPrimitive.Trigger className={cn("min-h-11 whitespace-nowrap rounded-xl px-4 text-sm font-semibold text-slate-500 transition hover:text-slate-300 data-[state=active]:bg-white/[0.07] data-[state=active]:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400", className)} {...props} />;
}

export function TabsContent({ className, ...props }: TabsPrimitive.TabsContentProps) {
  return <TabsPrimitive.Content className={cn("focus-visible:outline-none", className)} {...props} />;
}
