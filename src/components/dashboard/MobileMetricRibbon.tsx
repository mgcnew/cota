import { memo, useCallback, useEffect, useState } from "react";
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

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi, onSelect]);

  return (
    <div className={cn("relative w-full", className)}>
      {/* Right gradient fade – hints at more content */}
      <div className="pointer-events-none absolute right-0 top-0 h-full w-12 z-10 bg-gradient-to-l from-background to-transparent" />

      {/* Embla viewport */}
      <div
        className="overflow-hidden cursor-grab active:cursor-grabbing"
        ref={emblaRef}
      >
        <div className="flex gap-3 pl-0 pr-14">
          {children}
        </div>
      </div>

      {/* Scroll dots indicator */}
      {scrollSnaps.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {scrollSnaps.map((_, idx) => (
            <button
              key={idx}
              onClick={() => emblaApi?.scrollTo(idx)}
              className={cn(
                "rounded-full transition-all duration-300",
                idx === selectedIndex
                  ? "w-4 h-1.5 bg-brand"
                  : "w-1.5 h-1.5 bg-zinc-300 dark:bg-zinc-600"
              )}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
});
