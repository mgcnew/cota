import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Trash2, Copy, Lock, Unlock, Layers, ArrowUp, ArrowDown,
  Type, RotateCw, FlipHorizontal, FlipVertical, Palette,
  Minus, Plus, ArrowUpToLine, ArrowDownToLine,
} from "lucide-react";
import type { BannerElement, BannerProject } from "./BannerCanvas";

const FONTS = [
  "Arial", "Impact", "Georgia", "Verdana", "Trebuchet MS",
  "Times New Roman", "Courier New", "Tahoma", "Helvetica",
];

const COLORS = [
  "#FFFFFF", "#000000", "#EF4444", "#F97316", "#EAB308",
  "#22C55E", "#3B82F6", "#8B5CF6", "#EC4899", "#14B8A6",
  "#1E293B", "#7C3AED", "#DC2626", "#059669", "#D97706",
];

interface Props {
  element: BannerElement;
  project: BannerProject;
  onUpdate: (id: string, updates: Partial<BannerElement>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onMoveLayer: (id: string, direction: "up" | "down" | "top" | "bottom") => void;
  onUpdateProject: (updates: Partial<BannerProject>) => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{title}</h4>
      {children}
    </div>
  );
}

function ColorRow({ value, onChange, label }: { value: string; onChange: (c: string) => void; label?: string }) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {label && <span className="text-[10px] text-muted-foreground mr-1">{label}</span>}
      {COLORS.map((c) => (
        <button
          key={c}
          className={cn(
            "w-5 h-5 rounded border-2 transition-all hover:scale-110",
            value === c ? "border-brand scale-110 shadow-sm" : "border-border/50"
          )}
          style={{ backgroundColor: c }}
          onClick={() => onChange(c)}
        />
      ))}
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-5 h-5 rounded cursor-pointer border-0 p-0"
      />
    </div>
  );
}

export function PropertiesPanel({
  element: el, project, onUpdate, onDelete, onDuplicate, onMoveLayer, onUpdateProject,
}: Props) {
  const u = (updates: Partial<BannerElement>) => onUpdate(el.id, updates);

  return (
    <div className="space-y-4 p-4 overflow-y-auto max-h-[40vh]">
      {/* Actions row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => u({ locked: !el.locked })} title={el.locked ? "Desbloquear" : "Bloquear"}>
            {el.locked ? <Lock className="h-3 w-3 text-amber-500" /> : <Unlock className="h-3 w-3" />}
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onDuplicate(el.id)} title="Duplicar">
            <Copy className="h-3 w-3" />
          </Button>
          <div className="w-px h-4 bg-border mx-1" />
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onMoveLayer(el.id, "top")} title="Trazer à frente">
            <ArrowUpToLine className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onMoveLayer(el.id, "up")} title="Para cima">
            <ArrowUp className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onMoveLayer(el.id, "down")} title="Para baixo">
            <ArrowDown className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onMoveLayer(el.id, "bottom")} title="Enviar ao fundo">
            <ArrowDownToLine className="h-3 w-3" />
          </Button>
        </div>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:bg-red-500/10" onClick={() => onDelete(el.id)}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Text-specific */}
      {el.type === "text" && (
        <>
          <Section title="Conteúdo">
            <Input
              value={el.content || ""}
              onChange={(e) => u({ content: e.target.value })}
              className="h-8 text-xs"
            />
          </Section>

          <Section title="Tipografia">
            <div className="grid grid-cols-2 gap-2">
              <Select value={el.fontFamily || "Arial"} onValueChange={(v) => u({ fontFamily: v })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FONTS.map((f) => (
                    <SelectItem key={f} value={f} className="text-xs" style={{ fontFamily: f }}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={el.fontSize || 32}
                  onChange={(e) => u({ fontSize: Number(e.target.value) })}
                  className="h-8 text-xs text-center w-full"
                />
              </div>
            </div>
            <div className="flex gap-1 mt-2">
              <Button
                variant="outline"
                size="sm"
                className={cn("h-7 w-7 p-0", el.fontWeight === "bold" && "bg-brand/10 border-brand")}
                onClick={() => u({ fontWeight: el.fontWeight === "bold" ? "normal" : "bold" })}
              >
                <Bold className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={cn("h-7 w-7 p-0", el.fontStyle === "italic" && "bg-brand/10 border-brand")}
                onClick={() => u({ fontStyle: el.fontStyle === "italic" ? "normal" : "italic" })}
              >
                <Italic className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={cn("h-7 w-7 p-0", el.textDecoration === "underline" && "bg-brand/10 border-brand")}
                onClick={() => u({ textDecoration: el.textDecoration === "underline" ? "none" : "underline" })}
              >
                <Underline className="h-3 w-3" />
              </Button>
              <div className="w-px h-4 bg-border mx-1 my-auto" />
              <Button
                variant="outline"
                size="sm"
                className={cn("h-7 w-7 p-0", el.textAlign === "left" && "bg-brand/10 border-brand")}
                onClick={() => u({ textAlign: "left" })}
              >
                <AlignLeft className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={cn("h-7 w-7 p-0", el.textAlign === "center" && "bg-brand/10 border-brand")}
                onClick={() => u({ textAlign: "center" })}
              >
                <AlignCenter className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={cn("h-7 w-7 p-0", el.textAlign === "right" && "bg-brand/10 border-brand")}
                onClick={() => u({ textAlign: "right" })}
              >
                <AlignRight className="h-3 w-3" />
              </Button>
            </div>
          </Section>

          <Section title="Cor">
            <ColorRow value={el.color || "#000000"} onChange={(c) => u({ color: c })} />
          </Section>

          <Section title="Sombra">
            <Select
              value={el.textShadow || "none"}
              onValueChange={(v) => u({ textShadow: v })}
            >
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem sombra</SelectItem>
                <SelectItem value="2px 2px 4px rgba(0,0,0,0.3)">Leve</SelectItem>
                <SelectItem value="3px 3px 6px rgba(0,0,0,0.5)">Média</SelectItem>
                <SelectItem value="4px 4px 8px rgba(0,0,0,0.7)">Forte</SelectItem>
                <SelectItem value="0 0 10px rgba(255,255,255,0.8)">Brilho branco</SelectItem>
                <SelectItem value="0 0 10px rgba(0,0,0,0.8)">Brilho escuro</SelectItem>
              </SelectContent>
            </Select>
          </Section>
        </>
      )}

      {/* Price-specific */}
      {el.type === "price" && (
        <>
          <Section title="Valor do Preço">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-muted-foreground">R$</span>
              <Input
                value={el.content || ""}
                onChange={(e) => u({ content: e.target.value })}
                placeholder="0,00"
                className="h-9 text-lg font-black bg-white/50 border-brand/20 focus-visible:ring-brand"
              />
            </div>
            <div className="grid grid-cols-3 gap-1 mt-2">
              {["9,90", "19,90", "24,90", "29,90", "39,90", "49,90"].map((p) => (
                <Button key={p} variant="outline" size="sm" className="h-6 text-[10px] px-1" onClick={() => u({ content: p })}>
                  {p}
                </Button>
              ))}
            </div>
            <p className="text-[9px] text-muted-foreground mt-2 px-1">Use vírgula para os centavos (ex: 10,90)</p>
          </Section>

          <Section title="Aparência">
            <div className="grid grid-cols-2 gap-2">
              <Select value={el.fontFamily || "Impact"} onValueChange={(v) => u({ fontFamily: v })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FONTS.map((f) => (
                    <SelectItem key={f} value={f} className="text-xs" style={{ fontFamily: f }}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={el.fontSize || 80}
                  onChange={(e) => u({ fontSize: Number(e.target.value) })}
                  className="h-8 text-xs text-center w-full"
                />
              </div>
            </div>
          </Section>

          <Section title="Cor">
            <ColorRow value={el.color || "#000000"} onChange={(c) => u({ color: c })} />
          </Section>
        </>
      )}

      {/* Image-specific */}
      {el.type === "image" && (
        <Section title="Ajuste da Imagem">
          <Select value={el.objectFit || "contain"} onValueChange={(v: "contain" | "cover" | "fill") => u({ objectFit: v })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="contain">Conter</SelectItem>
              <SelectItem value="cover">Cobrir</SelectItem>
              <SelectItem value="fill">Preencher</SelectItem>
            </SelectContent>
          </Select>
        </Section>
      )}

      {/* Shape-specific */}
      {el.type === "shape" && (
        <>
          <Section title="Preenchimento">
            <ColorRow value={el.fillColor || "#3B82F6"} onChange={(c) => u({ fillColor: c })} />
          </Section>
          <Section title="Borda">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={el.strokeWidth || 0}
                onChange={(e) => u({ strokeWidth: Number(e.target.value) })}
                className="h-8 text-xs w-16"
                min={0}
                max={20}
              />
              <ColorRow value={el.strokeColor || "#000"} onChange={(c) => u({ strokeColor: c })} />
            </div>
          </Section>
          {el.shapeType === "rect" && (
            <Section title="Arredondamento">
              <Slider
                value={[el.borderRadius || 0]}
                onValueChange={([v]) => u({ borderRadius: v })}
                min={0} max={100} step={1}
              />
            </Section>
          )}
        </>
      )}

      {/* Common: Position, Size, Rotation, Opacity */}
      <Section title="Posição & Tamanho">
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "X", key: "x" as const, val: el.x },
            { label: "Y", key: "y" as const, val: el.y },
            { label: "L", key: "width" as const, val: el.width },
            { label: "A", key: "height" as const, val: el.height },
          ].map(({ label, key, val }) => (
            <div key={key}>
              <span className="text-[9px] text-muted-foreground">{label}</span>
              <Input
                type="number"
                value={Math.round(val)}
                onChange={(e) => u({ [key]: Number(e.target.value) })}
                className="h-7 text-xs"
              />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Rotação & Opacidade">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center gap-1.5">
              <RotateCw className="h-3 w-3 text-muted-foreground" />
              <Input
                type="number"
                value={el.rotation}
                onChange={(e) => u({ rotation: Number(e.target.value) })}
                className="h-7 text-xs flex-1"
              />
              <span className="text-[10px] text-muted-foreground">°</span>
            </div>
            <div className="flex gap-1 mt-1">
              {[0, 90, 180, 270].map((deg) => (
                <Button key={deg} variant="outline" size="sm" className="h-6 text-[9px] px-1.5 flex-1" onClick={() => u({ rotation: deg })}>
                  {deg}°
                </Button>
              ))}
            </div>
          </div>
          <div>
            <span className="text-[9px] text-muted-foreground">Opacidade</span>
            <Slider
              value={[el.opacity * 100]}
              onValueChange={([v]) => u({ opacity: v / 100 })}
              min={5} max={100} step={5}
              className="mt-1.5"
            />
            <span className="text-[9px] text-muted-foreground text-right block">{Math.round(el.opacity * 100)}%</span>
          </div>
        </div>
      </Section>

      {/* Canvas background */}
      <div className="pt-3 border-t">
        <Section title="Fundo do Banner">
          <ColorRow value={project.bgColor} onChange={(c) => onUpdateProject({ bgColor: c })} />
        </Section>
      </div>
    </div>
  );
}
