import { useState, useCallback, useEffect, useRef } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { designSystem as ds } from "@/styles/design-system";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import {
  Flag, Plus, Trash2, Download, Type, Image as ImageIcon,
  ZoomIn, ZoomOut, ChevronDown, Square, Circle, Minus as MinusIcon,
  Undo2, Redo2, Eye, Banknote, Maximize2,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { BannerCanvas, type BannerElement, type BannerProject } from "@/components/faixas/BannerCanvas";
import { PropertiesPanel } from "@/components/faixas/PropertiesPanel";

const BANNER_PRESETS = [
  { id: "loja", label: "Faixa Loja", width: 8.65, height: 0.70, description: "Frente da loja" },
  { id: "acougue", label: "Faixa Açougue", width: 8.50, height: 0.70, description: "Frente do açougue" },
];

const CANVAS_SCALE = 200; // 1m = 200px (increased for better visibility)

function genId() {
  return Math.random().toString(36).substring(2, 10);
}

export default function Faixas() {
  const { toast } = useToast();
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const editorWrapperRef = useRef<HTMLDivElement>(null);

  // Projects
  const [projects, setProjects] = useState<BannerProject[]>(() => {
    try {
      const s = localStorage.getItem("faixas_projects_v2");
      return s ? JSON.parse(s) : [];
    } catch { return []; }
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedElId, setSelectedElId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [zoomMode, setZoomMode] = useState<"width" | "height">("width");
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  // History (undo/redo)
  const [history, setHistory] = useState<BannerProject[][]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);

  useEffect(() => {
    localStorage.setItem("faixas_projects_v2", JSON.stringify(projects));
  }, [projects]);

  const project = projects.find((p) => p.id === activeId) || null;
  const selectedEl = project?.elements.find((e) => e.id === selectedElId) || null;

  // Auto-fit zoom to container width or height
  const fitZoom = useCallback((mode: "width" | "height" = zoomMode) => {
    if (!project || !editorWrapperRef.current) return;
    
    // Calculate available space more accurately
    const wrapper = editorWrapperRef.current;
    const toolbarHeight = wrapper.querySelector(".toolbar-container")?.clientHeight || 60;
    const containerWidth = wrapper.offsetWidth - 80;
    const containerHeight = (window.innerHeight - wrapper.getBoundingClientRect().top - toolbarHeight - 120);
    
    const canvasWidth = project.widthM * CANVAS_SCALE;
    const canvasHeight = project.heightM * CANVAS_SCALE;

    if (mode === "height") {
      const idealZoom = containerHeight / canvasHeight;
      setZoom(Math.max(0.05, Math.min(5, idealZoom)));
    } else {
      const idealZoom = containerWidth / canvasWidth;
      setZoom(Math.max(0.05, Math.min(2, idealZoom)));
    }
    setZoomMode(mode);
  }, [project, zoomMode]);

  // Auto-fit when project loads or window resizes
  useEffect(() => {
    if (!project) return;
    const timer = setTimeout(() => {
      // For very wide banners (common in faixas), width fit is usually better
      // but if it's too small, height fit might be requested
      fitZoom("width");
    }, 100);
    
    const handleResize = () => fitZoom(zoomMode);
    window.addEventListener("resize", handleResize);
    return () => { 
      clearTimeout(timer); 
      window.removeEventListener("resize", handleResize); 
    };
  }, [project?.id, fitZoom, zoomMode]);

  // Save to history
  const pushHistory = useCallback(() => {
    setHistory((prev) => {
      const trimmed = prev.slice(0, historyIdx + 1);
      return [...trimmed, JSON.parse(JSON.stringify(projects))].slice(-30);
    });
    setHistoryIdx((prev) => prev + 1);
  }, [projects, historyIdx]);

  const undo = useCallback(() => {
    if (historyIdx <= 0) return;
    const newIdx = historyIdx - 1;
    setProjects(JSON.parse(JSON.stringify(history[newIdx])));
    setHistoryIdx(newIdx);
  }, [history, historyIdx]);

  const redo = useCallback(() => {
    if (historyIdx >= history.length - 1) return;
    const newIdx = historyIdx + 1;
    setProjects(JSON.parse(JSON.stringify(history[newIdx])));
    setHistoryIdx(newIdx);
  }, [history, historyIdx]);

  // Update project
  const updateProject = useCallback((id: string, updater: (p: BannerProject) => BannerProject) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? updater(p) : p)));
  }, []);

  const updateProjectPartial = useCallback((updates: Partial<BannerProject>) => {
    if (!activeId) return;
    updateProject(activeId, (p) => ({ ...p, ...updates }));
  }, [activeId, updateProject]);

  // Element operations
  const updateElement = useCallback((elId: string, updates: Partial<BannerElement>) => {
    if (!activeId) return;
    updateProject(activeId, (p) => ({
      ...p,
      elements: p.elements.map((e) => (e.id === elId ? { ...e, ...updates } : e)),
    }));
  }, [activeId, updateProject]);

  const deleteElement = useCallback((elId: string) => {
    if (!activeId) return;
    pushHistory();
    updateProject(activeId, (p) => ({
      ...p,
      elements: p.elements.filter((e) => e.id !== elId),
    }));
    if (selectedElId === elId) setSelectedElId(null);
  }, [activeId, updateProject, selectedElId, pushHistory]);

  const duplicateElement = useCallback((elId: string) => {
    if (!activeId || !project) return;
    pushHistory();
    const el = project.elements.find((e) => e.id === elId);
    if (!el) return;
    const newEl = { ...el, id: genId(), x: el.x + 20, y: el.y + 10 };
    updateProject(activeId, (p) => ({ ...p, elements: [...p.elements, newEl] }));
    setSelectedElId(newEl.id);
  }, [activeId, project, updateProject, pushHistory]);

  const moveLayer = useCallback((elId: string, dir: "up" | "down" | "top" | "bottom") => {
    if (!activeId) return;
    pushHistory();
    updateProject(activeId, (p) => {
      const els = [...p.elements];
      const idx = els.findIndex((e) => e.id === elId);
      if (idx === -1) return p;
      const [el] = els.splice(idx, 1);
      if (dir === "up") els.splice(Math.min(idx + 1, els.length), 0, el);
      else if (dir === "down") els.splice(Math.max(idx - 1, 0), 0, el);
      else if (dir === "top") els.push(el);
      else els.unshift(el);
      return { ...p, elements: els };
    });
  }, [activeId, updateProject, pushHistory]);

  // Create project
  const createProject = (presetId: string) => {
    const preset = BANNER_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const p: BannerProject = {
      id: genId(),
      name: `${preset.label} - ${new Date().toLocaleDateString("pt-BR")}`,
      preset: preset.id,
      widthM: preset.width,
      heightM: preset.height,
      bgColor: "#FFFFFF",
      elements: [],
      createdAt: new Date().toISOString(),
    };
    setProjects((prev) => [p, ...prev]);
    setActiveId(p.id);
    setSelectedElId(null);
    pushHistory();
  };

  // Add elements
  const addText = () => {
    if (!project) return;
    pushHistory();
    const el: BannerElement = {
      id: genId(), type: "text",
      x: project.widthM * CANVAS_SCALE * 0.35,
      y: project.heightM * CANVAS_SCALE * 0.15,
      width: 300, height: 50,
      rotation: 0, opacity: 1, locked: false,
      content: "PROMOÇÃO",
      fontSize: 48, fontFamily: "Impact", fontWeight: "bold",
      fontStyle: "normal", color: "#EF4444",
      textAlign: "center", textDirection: "horizontal",
      letterSpacing: 2, lineHeight: 1.1,
    };
    updateProject(project.id, (p) => ({ ...p, elements: [...p.elements, el] }));
    setSelectedElId(el.id);
  };

  const addPrice = () => {
    if (!project) return;
    pushHistory();
    const el: BannerElement = {
      id: genId(), type: "price",
      x: project.widthM * CANVAS_SCALE * 0.4,
      y: project.heightM * CANVAS_SCALE * 0.1,
      width: 400, height: 180,
      rotation: 0, opacity: 1, locked: false,
      content: "19,90",
      fontSize: 120, fontFamily: "Impact", fontWeight: "bold",
      color: "#000000",
    };
    updateProject(project.id, (p) => ({ ...p, elements: [...p.elements, el] }));
    setSelectedElId(el.id);
  };

  const addImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !project) return;
      pushHistory();
      const reader = new FileReader();
      reader.onload = (ev) => {
        const el: BannerElement = {
          id: genId(), type: "image",
          x: 20, y: 5,
          width: 120, height: project.heightM * CANVAS_SCALE - 10,
          rotation: 0, opacity: 1, locked: false,
          src: ev.target?.result as string,
          objectFit: "contain",
        };
        updateProject(project!.id, (p) => ({ ...p, elements: [...p.elements, el] }));
        setSelectedElId(el.id);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const addBgImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !project) return;
      pushHistory();
      const reader = new FileReader();
      reader.onload = (ev) => {
        updateProjectPartial({ bgImage: ev.target?.result as string });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const addShape = (shapeType: "rect" | "circle" | "line") => {
    if (!project) return;
    pushHistory();
    const el: BannerElement = {
      id: genId(), type: "shape",
      x: project.widthM * CANVAS_SCALE * 0.3,
      y: project.heightM * CANVAS_SCALE * 0.1,
      width: shapeType === "line" ? 200 : 120,
      height: shapeType === "line" ? 4 : project.heightM * CANVAS_SCALE * 0.6,
      rotation: 0, opacity: 1, locked: false,
      shapeType, fillColor: "#3B82F6",
      strokeColor: "#000", strokeWidth: 0, borderRadius: 0,
    };
    updateProject(project.id, (p) => ({ ...p, elements: [...p.elements, el] }));
    setSelectedElId(el.id);
  };

  const deleteProject = (id: string) => {
    if (!confirm("Excluir este projeto?")) return;
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (activeId === id) { setActiveId(null); setSelectedElId(null); }
  };

  // Export
  const exportPNG = async () => {
    if (!project) return;
    setSelectedElId(null);
    await new Promise((r) => setTimeout(r, 150));

    const canvas = canvasContainerRef.current?.querySelector("[data-banner-canvas]") as HTMLElement | null;
    if (!canvas) return;

    try {
      const result = await html2canvas(canvas, { scale: 4, backgroundColor: project.bgColor, useCORS: true });
      const link = document.createElement("a");
      link.download = `${project.name.replace(/\s+/g, "_")}.png`;
      link.href = result.toDataURL("image/png");
      link.click();
      toast({ title: "Exportado!", description: "Imagem PNG gerada em alta resolução." });
    } catch {
      toast({ title: "Erro", description: "Falha ao exportar.", variant: "destructive" });
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!project) return;
      if (e.key === "Delete" && selectedElId) { deleteElement(selectedElId); }
      if (e.key === "Escape") { setSelectedElId(null); }
      if (e.ctrlKey && e.key === "z") { e.preventDefault(); undo(); }
      if (e.ctrlKey && e.key === "y") { e.preventDefault(); redo(); }
      if (e.ctrlKey && e.key === "d" && selectedElId) { e.preventDefault(); duplicateElement(selectedElId); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [project, selectedElId, deleteElement, undo, redo, duplicateElement]);

  // ═══════════════════════════════════
  // PROJECT LIST VIEW
  // ═══════════════════════════════════
  if (!project) {
    return (
      <PageWrapper>
        <div className={cn(ds.layout.container.page, "animate-in fade-in duration-500")}>
          <div className="flex flex-col gap-4 md:gap-6 mb-4 md:mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="hidden sm:flex p-3 rounded-xl bg-brand/10 dark:bg-brand/20 border border-brand/20">
                  <Flag className="h-6 w-6 text-brand" />
                </div>
                <div>
                  <h1 className={cn(ds.typography.size.xl, "md:text-[22px] font-bold text-foreground")}>Faixas Promocionais</h1>
                  <p className={cn(ds.colors.text.secondary, "text-xs md:text-sm mt-0.5")}>Editor visual de banners para loja e açougue</p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className={cn(ds.components.button.primary, "h-9")}>
                    <Plus className="mr-2 h-4 w-4" /> Nova Faixa <ChevronDown className="ml-2 h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  {BANNER_PRESETS.map((p) => (
                    <DropdownMenuItem key={p.id} onClick={() => createProject(p.id)} className="py-3">
                      <Flag className="mr-2 h-4 w-4 text-brand flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm">{p.label}</p>
                        <p className="text-xs text-muted-foreground">{p.width}m × {p.height}m — {p.description}</p>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-20 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-brand/10 flex items-center justify-center">
                <Flag className="h-8 w-8 text-brand" />
              </div>
              <h2 className="text-lg font-bold">Nenhuma faixa criada</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Crie sua primeira faixa promocional clicando em "Nova Faixa".
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((p) => {
                const preset = BANNER_PRESETS.find((b) => b.id === p.preset);
                return (
                  <Card
                    key={p.id}
                    className={cn(ds.components.card.root, ds.components.card.interactive, "p-4 group cursor-pointer")}
                    onClick={() => { setActiveId(p.id); setSelectedElId(null); }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm truncate">{p.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{preset?.label} — {p.widthM}m × {p.heightM}m</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-[10px]">{p.elements.length} elementos</Badge>
                          <span className="text-[10px] text-muted-foreground">{new Date(p.createdAt).toLocaleDateString("pt-BR")}</span>
                        </div>
                      </div>
                      <div className="w-28 h-10 rounded border flex-shrink-0 ml-3 overflow-hidden" style={{ backgroundColor: p.bgColor }}>
                        {p.bgImage && <img src={p.bgImage} className="w-full h-full object-cover" alt="" />}
                      </div>
                    </div>
                    <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }}>
                        <Trash2 className="h-3 w-3 mr-1 text-red-500" /> Excluir
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </PageWrapper>
    );
  }

  // ═══════════════════════════════════
  // EDITOR VIEW
  // ═══════════════════════════════════
  return (
    <PageWrapper>
      <div ref={editorWrapperRef} className={cn(ds.layout.container.page, "animate-in fade-in duration-300 !space-y-2 !pb-2 h-full flex flex-col")}>
        {/* Toolbar */}
        <div className="toolbar-container flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-card/80 backdrop-blur-sm rounded-xl border p-2 px-3 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => { setActiveId(null); setSelectedElId(null); }}>
              ← Voltar
            </Button>
            <div className="w-px h-5 bg-border" />
            <Input
              value={project.name}
              onChange={(e) => updateProject(project.id, (p) => ({ ...p, name: e.target.value }))}
              className="h-7 text-xs font-bold border-none bg-transparent px-1 w-[200px] focus-visible:ring-1"
            />
            <Badge variant="secondary" className="text-[9px] hidden sm:inline-flex">{project.widthM}m × {project.heightM}m</Badge>
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            {/* Undo/Redo */}
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={undo} disabled={historyIdx <= 0} title="Desfazer (Ctrl+Z)">
              <Undo2 className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={redo} disabled={historyIdx >= history.length - 1} title="Refazer (Ctrl+Y)">
              <Redo2 className="h-3.5 w-3.5" />
            </Button>
            <div className="w-px h-5 bg-border mx-1" />

            {/* Add elements */}
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={addText}>
              <Type className="h-3.5 w-3.5 mr-1" /> Texto
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={addPrice}>
              <Banknote className="h-3.5 w-3.5 mr-1" /> Preço
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={addImage}>
              <ImageIcon className="h-3.5 w-3.5 mr-1" /> Imagem
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  <Square className="h-3.5 w-3.5 mr-1" /> Forma <ChevronDown className="ml-1 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => addShape("rect")}><Square className="h-3.5 w-3.5 mr-2" /> Retângulo</DropdownMenuItem>
                <DropdownMenuItem onClick={() => addShape("circle")}><Circle className="h-3.5 w-3.5 mr-2" /> Círculo</DropdownMenuItem>
                <DropdownMenuItem onClick={() => addShape("line")}><MinusIcon className="h-3.5 w-3.5 mr-2" /> Linha</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={addBgImage}><ImageIcon className="h-3.5 w-3.5 mr-2" /> Imagem de Fundo</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="w-px h-5 bg-border mx-1" />

            {/* Zoom */}
            <div className="flex items-center gap-1 border rounded-lg px-1.5 h-8">
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setZoom((z) => Math.max(0.05, z - 0.05))}>
                <ZoomOut className="h-3 w-3" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-[10px] font-mono w-12 text-center select-none hover:text-brand transition-colors">
                    {Math.round(zoom * 100)}%
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-32">
                  <DropdownMenuItem onClick={() => fitZoom("width")}>Ajustar Largura</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => fitZoom("height")}>Ajustar Altura</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setZoom(0.5)}>50%</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setZoom(1.0)}>100%</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setZoom(2.0)}>200%</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setZoom((z) => Math.min(5, z + 0.05))}>
                <ZoomIn className="h-3 w-3" />
              </Button>
            </div>

            {/* Export */}
            <Button size="sm" className={cn(ds.components.button.primary, "h-8 text-xs")} onClick={exportPNG}>
              <Download className="h-3.5 w-3.5 mr-1" /> Exportar PNG
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div ref={canvasContainerRef} className="flex-1 flex flex-col min-h-0">
          <BannerCanvas
            project={project}
            zoom={zoom}
            selectedId={selectedElId}
            onSelectElement={setSelectedElId}
            onUpdateElement={updateElement}
            onDoubleClickElement={(id) => {
              const el = project.elements.find((e) => e.id === id);
              if (el?.type === "text") setEditingTextId(id);
            }}
            canvasScale={CANVAS_SCALE}
          />
        </div>

        {/* Properties Panel */}
        {selectedEl && (
          <Card className={cn(ds.components.card.root, "animate-in slide-in-from-bottom-3 duration-200")}>
            <PropertiesPanel
              element={selectedEl}
              project={project}
              onUpdate={updateElement}
              onDelete={deleteElement}
              onDuplicate={duplicateElement}
              onMoveLayer={moveLayer}
              onUpdateProject={updateProjectPartial}
            />
          </Card>
        )}

        {/* Keyboard shortcuts hint */}
        <div className="flex items-center justify-center gap-4 text-[9px] text-muted-foreground/50 py-1">
          <span>Delete: excluir</span>
          <span>Ctrl+Z: desfazer</span>
          <span>Ctrl+Y: refazer</span>
          <span>Ctrl+D: duplicar</span>
          <span>Shift+Rotação: snap 15°</span>
        </div>
      </div>
    </PageWrapper>
  );
}
