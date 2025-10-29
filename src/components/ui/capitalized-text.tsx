import { capitalize } from "@/lib/text-utils";
import { cn } from "@/lib/utils";

interface CapitalizedTextProps {
  children: string | null | undefined;
  className?: string;
  as?: "span" | "p" | "div" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

export function CapitalizedText({ 
  children, 
  className,
  as: Component = "span" 
}: CapitalizedTextProps) {
  return (
    <Component className={cn(className)}>
      {capitalize(children)}
    </Component>
  );
}
