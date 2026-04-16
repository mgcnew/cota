import { memo } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { cn } from "@/lib/utils";

interface MobileMetricRibbonProps {
  children: React.ReactNode;
  className?: string;
}

export const MobileMetricRibbon = memo(function MobileMetricRibbon({
  children,
  className,
}: MobileMetricRibbonProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    skipSnaps: false,
    dragFree: false,
  });

  return (
    <div className={cn("relative w-full", className)}>
      {/* Embla viewport */}
      <div
        className="overflow-hidden cursor-grab active:cursor-grabbing"
        ref={emblaRef}
      >
        <div className="flex gap-3 pl-0 pr-14">
          {children}
        </div>
      </div>
    </div>
  );
});
