import { useRef, useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

export interface BannerElement {
  id: string;
  type: "text" | "image" | "shape" | "price";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  locked: boolean;
  // Text
  content?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  color?: string;
  textAlign?: "left" | "center" | "right";
  textDirection?: "horizontal" | "vertical";
  textDecoration?: string;
  letterSpacing?: number;
  lineHeight?: number;
  textShadow?: string;
  // Image
  src?: string;
  objectFit?: "contain" | "cover" | "fill";
  // Shape
  shapeType?: "rect" | "circle" | "line";
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  borderRadius?: number;
}

export interface BannerProject {
  id: string;
  name: string;
  preset: string;
  widthM: number;
  heightM: number;
  bgColor: string;
  bgImage?: string;
  elements: BannerElement[];
  createdAt: string;
}

interface Props {
  project: BannerProject;
  zoom: number;
  selectedId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<BannerElement>) => void;
  onDoubleClickElement?: (id: string) => void;
  canvasScale: number; // px per meter
}

type HandleType = "tl" | "tr" | "bl" | "br" | "t" | "b" | "l" | "r" | "rotate";

const HANDLE_SIZE = 8;
const ROTATE_OFFSET = 24;

export function BannerCanvas({
  project, zoom, selectedId, onSelectElement,
  onUpdateElement, onDoubleClickElement, canvasScale,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasW = project.widthM * canvasScale;
  const canvasH = project.heightM * canvasScale;

  // Drag state
  const dragState = useRef<{
    type: "move" | "resize" | "rotate";
    elId: string;
    startX: number;
    startY: number;
    startElX: number;
    startElY: number;
    startW: number;
    startH: number;
    startRot: number;
    handle?: HandleType;
    centerX?: number;
    centerY?: number;
  } | null>(null);

  const [isDragging, setIsDragging] = useState(false);

  const handlePointerDown = useCallback((e: React.PointerEvent, elId: string, action: "move" | "resize" | "rotate", handle?: HandleType) => {
    e.stopPropagation();
    e.preventDefault();
    const el = project.elements.find((el) => el.id === elId);
    if (!el || el.locked) return;
    onSelectElement(elId);
    setIsDragging(true);

    dragState.current = {
      type: action,
      elId,
      startX: e.clientX,
      startY: e.clientY,
      startElX: el.x,
      startElY: el.y,
      startW: el.width,
      startH: el.height,
      startRot: el.rotation,
      handle,
      centerX: el.x + el.width / 2,
      centerY: el.y + el.height / 2,
    };

    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [project.elements, onSelectElement]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragState.current) return;
    const ds = dragState.current;
    const scale = zoom;
    const dx = (e.clientX - ds.startX) / scale;
    const dy = (e.clientY - ds.startY) / scale;

    if (ds.type === "move") {
      onUpdateElement(ds.elId, {
        x: Math.round(ds.startElX + dx),
        y: Math.round(ds.startElY + dy),
      });
    } else if (ds.type === "resize" && ds.handle) {
      let newX = ds.startElX, newY = ds.startElY, newW = ds.startW, newH = ds.startH;
      const h = ds.handle;
      if (h.includes("r")) newW = Math.max(20, ds.startW + dx);
      if (h.includes("l")) { newW = Math.max(20, ds.startW - dx); newX = ds.startElX + dx; }
      if (h.includes("b")) newH = Math.max(10, ds.startH + dy);
      if (h.includes("t")) { newH = Math.max(10, ds.startH - dy); newY = ds.startElY + dy; }
      onUpdateElement(ds.elId, { x: Math.round(newX), y: Math.round(newY), width: Math.round(newW), height: Math.round(newH) });
    } else if (ds.type === "rotate") {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect || !ds.centerX || !ds.centerY) return;
      const cx = rect.left + ds.centerX * scale;
      const cy = rect.top + ds.centerY * scale;
      const angle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI) + 90;
      const snapped = e.shiftKey ? Math.round(angle / 15) * 15 : Math.round(angle);
      onUpdateElement(ds.elId, { rotation: snapped });
    }
  }, [zoom, onUpdateElement]);

  const handlePointerUp = useCallback(() => {
    dragState.current = null;
    setIsDragging(false);
  }, []);

  const selectedEl = project.elements.find((e) => e.id === selectedId);

  // Render handles for selected element
  const renderHandles = (el: BannerElement) => {
    if (el.locked) return null;
    const handles: { type: HandleType; x: number; y: number; cursor: string }[] = [
      { type: "tl", x: -HANDLE_SIZE / 2, y: -HANDLE_SIZE / 2, cursor: "nwse-resize" },
      { type: "tr", x: el.width * zoom - HANDLE_SIZE / 2, y: -HANDLE_SIZE / 2, cursor: "nesw-resize" },
      { type: "bl", x: -HANDLE_SIZE / 2, y: el.height * zoom - HANDLE_SIZE / 2, cursor: "nesw-resize" },
      { type: "br", x: el.width * zoom - HANDLE_SIZE / 2, y: el.height * zoom - HANDLE_SIZE / 2, cursor: "nwse-resize" },
      { type: "t", x: el.width * zoom / 2 - HANDLE_SIZE / 2, y: -HANDLE_SIZE / 2, cursor: "ns-resize" },
      { type: "b", x: el.width * zoom / 2 - HANDLE_SIZE / 2, y: el.height * zoom - HANDLE_SIZE / 2, cursor: "ns-resize" },
      { type: "l", x: -HANDLE_SIZE / 2, y: el.height * zoom / 2 - HANDLE_SIZE / 2, cursor: "ew-resize" },
      { type: "r", x: el.width * zoom - HANDLE_SIZE / 2, y: el.height * zoom / 2 - HANDLE_SIZE / 2, cursor: "ew-resize" },
    ];

    return (
      <>
        {handles.map((h) => (
          <div
            key={h.type}
            className="absolute bg-white border-2 border-brand rounded-sm z-20 hover:scale-125 transition-transform"
            style={{ left: h.x, top: h.y, width: HANDLE_SIZE, height: HANDLE_SIZE, cursor: h.cursor }}
            onPointerDown={(e) => handlePointerDown(e, el.id, "resize", h.type)}
          />
        ))}
        {/* Rotate handle */}
        <div
          className="absolute z-20 flex flex-col items-center"
          style={{ left: el.width * zoom / 2 - 6, top: -ROTATE_OFFSET - HANDLE_SIZE }}
        >
          <div
            className="w-3 h-3 rounded-full bg-brand border-2 border-white shadow cursor-grab hover:scale-125 transition-transform"
            onPointerDown={(e) => handlePointerDown(e, el.id, "rotate")}
          />
          <div className="w-px bg-brand/40" style={{ height: ROTATE_OFFSET - 6 }} />
        </div>
      </>
    );
  };

  const renderElement = (el: BannerElement) => {
    const isSelected = el.id === selectedId;
    const style: React.CSSProperties = {
      left: el.x * zoom,
      top: el.y * zoom,
      width: el.width * zoom,
      height: el.height * zoom,
      transform: `rotate(${el.rotation}deg)`,
      transformOrigin: "center center",
      opacity: el.opacity,
    };

    return (
      <div
        key={el.id}
        className={cn(
          "absolute group/el",
          el.locked ? "pointer-events-none" : "cursor-move",
          isSelected && "z-10"
        )}
        style={style}
        onPointerDown={(e) => !el.locked && handlePointerDown(e, el.id, "move")}
        onClick={(e) => { e.stopPropagation(); onSelectElement(el.id); }}
        onDoubleClick={(e) => { e.stopPropagation(); onDoubleClickElement?.(el.id); }}
      >
        {/* Selection border */}
        {isSelected && (
          <div className="absolute inset-0 border-2 border-brand rounded-sm pointer-events-none z-10" />
        )}
        {!isSelected && (
          <div className="absolute inset-0 border border-transparent group-hover/el:border-brand/30 rounded-sm pointer-events-none transition-colors" />
        )}

        {/* Content */}
        {el.type === "text" && (
          <div
            className="w-full h-full flex items-center overflow-hidden select-none"
            style={{
              fontSize: (el.fontSize || 32) * zoom,
              fontFamily: el.fontFamily || "Arial",
              fontWeight: el.fontWeight || "normal",
              fontStyle: el.fontStyle || "normal",
              color: el.color || "#000",
              textAlign: el.textAlign || "center",
              justifyContent: el.textAlign === "left" ? "flex-start" : el.textAlign === "right" ? "flex-end" : "center",
              lineHeight: el.lineHeight || 1.2,
              letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : undefined,
              textDecoration: el.textDecoration || "none",
              textShadow: el.textShadow || "none",
              writingMode: el.textDirection === "vertical" ? "vertical-rl" : "horizontal-tb",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              padding: `${4 * zoom}px`,
            }}
          >
            {el.content || "Texto"}
          </div>
        )}

        {el.type === "price" && (
          <div
            className="w-full h-full flex items-center justify-center overflow-hidden select-none"
            style={{
              fontFamily: el.fontFamily || "Impact",
              fontWeight: el.fontWeight || "bold",
              color: el.color || "#000",
              textShadow: el.textShadow || "2px 2px 0px rgba(0,0,0,0.1)",
              lineHeight: 1,
            }}
          >
            <div className="flex items-baseline leading-none">
              <span style={{ fontSize: (el.fontSize || 80) * 0.35 * zoom, fontWeight: 900, marginRight: 4 * zoom, transform: "translateY(-10%)" }}>R$</span>
              <span style={{ fontSize: (el.fontSize || 80) * zoom }}>{el.content?.split(",")[0] || "0"}</span>
              <div className="flex flex-col items-start leading-none ml-1">
                <span style={{ fontSize: (el.fontSize || 80) * 0.55 * zoom, borderBottom: `${2 * zoom}px solid ${el.color || "#000"}`, paddingBottom: 1 * zoom }}>
                  {el.content?.split(",")[1] || "00"}
                </span>
                <span style={{ fontSize: (el.fontSize || 80) * 0.15 * zoom, marginTop: 2 * zoom, opacity: 0.7 }}>CADA</span>
              </div>
            </div>
          </div>
        )}

        {el.type === "image" && el.src && (
          <img
            src={el.src}
            alt=""
            className="w-full h-full pointer-events-none"
            style={{ objectFit: el.objectFit || "contain" }}
            draggable={false}
          />
        )}

        {el.type === "shape" && (
          <div
            className="w-full h-full"
            style={{
              backgroundColor: el.fillColor || "transparent",
              border: el.strokeWidth ? `${el.strokeWidth * zoom}px solid ${el.strokeColor || "#000"}` : "none",
              borderRadius: el.shapeType === "circle" ? "50%" : (el.borderRadius || 0) * zoom,
            }}
          />
        )}

        {/* Resize & Rotate handles */}
        {isSelected && !isDragging && renderHandles(el)}
      </div>
    );
  };

  // Ruler marks
  const renderRulers = () => {
    const marks: React.ReactNode[] = [];
    for (let m = 0; m <= project.widthM; m += 0.5) {
      const isMeter = m % 1 === 0;
      marks.push(
        <div
          key={`rx-${m}`}
          className="absolute top-0 flex flex-col items-center"
          style={{ left: m * canvasScale * zoom }}
        >
          <div className={cn("w-px", isMeter ? "h-3 bg-zinc-400" : "h-1.5 bg-zinc-300")} />
          {isMeter && <span className="text-[7px] text-zinc-400 mt-0.5">{m}m</span>}
        </div>
      );
    }
    return <div className="absolute -top-5 left-0 w-full">{marks}</div>;
  };

  return (
    <div
      className="relative flex-1 overflow-hidden bg-zinc-200 dark:bg-zinc-950 border rounded-2xl flex items-center justify-center"
      style={{ minHeight: 300 }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Centered Scrollable Area */}
      <div className="absolute inset-0 overflow-auto flex items-center justify-center p-20">
        <div className="relative" ref={containerRef}>
          {renderRulers()}
          <div
            data-banner-canvas
            className="relative shadow-[0_0_50px_rgba(0,0,0,0.15)] bg-white border border-zinc-300"
            style={{
              width: canvasW * zoom,
              height: canvasH * zoom,
              backgroundColor: project.bgColor,
              backgroundImage: project.bgImage ? `url(${project.bgImage})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
            onClick={() => onSelectElement(null)}
          >
            {/* Grid overlay */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.03]"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(0,0,0,0.3) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(0,0,0,0.3) 1px, transparent 1px)
                `,
                backgroundSize: `${50 * zoom}px ${50 * zoom}px`,
              }}
            />
            {/* Center guides */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-brand/10 pointer-events-none" />
            <div className="absolute top-1/2 left-0 right-0 h-px bg-brand/10 pointer-events-none" />

            {/* Elements */}
            {project.elements.map(renderElement)}
          </div>
        </div>
      </div>
    </div>
  );
}
