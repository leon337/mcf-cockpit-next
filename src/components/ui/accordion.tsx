import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export const Accordion = AccordionPrimitive.Root;

export function AccordionItem({ className, ...props }: AccordionPrimitive.AccordionItemProps) {
  return <AccordionPrimitive.Item className={cn("overflow-hidden rounded-3xl border border-white/10 bg-panel/85", className)} {...props} />;
}

export function AccordionTrigger({ className, children, ...props }: AccordionPrimitive.AccordionTriggerProps) {
  return (
    <AccordionPrimitive.Header>
      <AccordionPrimitive.Trigger
        className={cn("group flex w-full items-center gap-4 p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-400", className)}
        {...props}
      >
        {children}
        <ChevronDown className="size-5 shrink-0 text-slate-500 transition-transform group-data-[state=open]:rotate-180" aria-hidden="true" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

export function AccordionContent({ className, children, ...props }: AccordionPrimitive.AccordionContentProps) {
  return <AccordionPrimitive.Content className={cn("border-t border-white/10 px-5 pb-5", className)} {...props}>{children}</AccordionPrimitive.Content>;
}
