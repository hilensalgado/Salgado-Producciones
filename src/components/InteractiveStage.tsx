import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Move,
  Maximize2,
  Minimize2,
  AlignCenter,
  Sparkles,
  Camera,
  Type,
  Users,
  Layers,
  Check,
  RotateCcw,
  Eye,
  Sliders,
  Grid,
} from 'lucide-react';
import { Course, PhotoSlot, Student, TemplateConfig, TextSlot } from '../types';
import { renderStudentToCanvas } from '../utils/canvasRenderer';

interface InteractiveStageProps {
  template: TemplateConfig;
  setTemplate: React.Dispatch<React.SetStateAction<TemplateConfig>>;
  sampleStudent: Student;
  sampleCourse: Course;
  selectedElementId: string | null;
  setSelectedElementId: (id: string | null) => void;
  editorMode: 'interactive' | 'preview' | 'split';
  setEditorMode: (mode: 'interactive' | 'preview' | 'split') => void;
}

type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

interface DragState {
  elementId: string;
  elementType: 'photo' | 'text';
  action: 'move' | 'resize';
  handle?: ResizeHandle;
  startX: number; // pointer clientX
  startY: number; // pointer clientY
  initialX: number; // element initial % x
  initialY: number; // element initial % y
  initialWidth?: number; // element initial % width
  initialHeight?: number; // element initial % height
  containerWidth: number; // px
  containerHeight: number; // px
}

// Color schemes for elements
const PHOTO_THEMES: Record<string, { bg: string; border: string; activeBorder: string; badge: string; text: string; name: string }> = {
  'slot-group': {
    bg: 'bg-sky-500/20 hover:bg-sky-500/30',
    border: 'border-sky-400',
    activeBorder: 'border-sky-300 ring-2 ring-sky-400 shadow-sky-500/30 shadow-lg',
    badge: 'bg-sky-600 text-white',
    text: 'text-sky-300',
    name: '1. Foto Grupal',
  },
  'slot-teacher': {
    bg: 'bg-purple-500/20 hover:bg-purple-500/30',
    border: 'border-purple-400',
    activeBorder: 'border-purple-300 ring-2 ring-purple-400 shadow-purple-500/30 shadow-lg',
    badge: 'bg-purple-600 text-white',
    text: 'text-purple-300',
    name: '2. Con Maestra',
  },
  'slot-individual': {
    bg: 'bg-emerald-500/20 hover:bg-emerald-500/30',
    border: 'border-emerald-400',
    activeBorder: 'border-emerald-300 ring-2 ring-emerald-400 shadow-emerald-500/30 shadow-lg',
    badge: 'bg-emerald-600 text-white',
    text: 'text-emerald-300',
    name: '3. Foto Individual',
  },
};

const TEXT_THEMES: Record<string, { bg: string; border: string; activeBorder: string; badge: string; text: string; name: string }> = {
  'txt-school': {
    bg: 'bg-amber-500/20 hover:bg-amber-500/30',
    border: 'border-amber-400 border-dashed',
    activeBorder: 'border-amber-300 border-solid ring-2 ring-amber-400 shadow-amber-500/30 shadow-lg',
    badge: 'bg-amber-600 text-white',
    text: 'text-amber-300',
    name: 'Texto: Escuela',
  },
  'txt-course': {
    bg: 'bg-indigo-500/20 hover:bg-indigo-500/30',
    border: 'border-indigo-400 border-dashed',
    activeBorder: 'border-indigo-300 border-solid ring-2 ring-indigo-400 shadow-indigo-500/30 shadow-lg',
    badge: 'bg-indigo-600 text-white',
    text: 'text-indigo-300',
    name: 'Texto: Curso',
  },
  'txt-teacher': {
    bg: 'bg-rose-500/20 hover:bg-rose-500/30',
    border: 'border-rose-400 border-dashed',
    activeBorder: 'border-rose-300 border-solid ring-2 ring-rose-400 shadow-rose-500/30 shadow-lg',
    badge: 'bg-rose-600 text-white',
    text: 'text-rose-300',
    name: 'Texto: Maestra',
  },
  'txt-student': {
    bg: 'bg-teal-500/20 hover:bg-teal-500/30',
    border: 'border-teal-400 border-dashed',
    activeBorder: 'border-teal-300 border-solid ring-2 ring-teal-400 shadow-teal-500/30 shadow-lg',
    badge: 'bg-teal-600 text-white',
    text: 'text-teal-300',
    name: 'Texto: Alumno',
  },
  'txt-year': {
    bg: 'bg-orange-500/20 hover:bg-orange-500/30',
    border: 'border-orange-400 border-dashed',
    activeBorder: 'border-orange-300 border-solid ring-2 ring-orange-400 shadow-orange-500/30 shadow-lg',
    badge: 'bg-orange-600 text-white',
    text: 'text-orange-300',
    name: 'Texto: Año',
  },
};

export const InteractiveStage: React.FC<InteractiveStageProps> = ({
  template,
  setTemplate,
  sampleStudent,
  sampleCourse,
  selectedElementId,
  setSelectedElementId,
  editorMode,
  setEditorMode,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [showCenterGuides, setShowCenterGuides] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(true);

  // Render canvas preview
  useEffect(() => {
    if (!canvasRef.current) return;
    renderStudentToCanvas(canvasRef.current, sampleStudent, sampleCourse, template, {
      scale: 0.35,
    }).catch(console.error);
  }, [template, sampleStudent, sampleCourse]);

  // Pointer Up listener
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      if (dragState) {
        setDragState(null);
        setShowCenterGuides(false);
      }
    };

    const handleGlobalPointerMove = (e: PointerEvent) => {
      if (!dragState || !containerRef.current) return;

      const deltaX = e.clientX - dragState.startX;
      const deltaY = e.clientY - dragState.startY;

      const deltaPercentX = (deltaX / dragState.containerWidth) * 100;
      const deltaPercentY = (deltaY / dragState.containerHeight) * 100;

      if (dragState.action === 'move') {
        let newX = Math.max(0, Math.min(95, dragState.initialX + deltaPercentX));
        let newY = Math.max(0, Math.min(95, dragState.initialY + deltaPercentY));

        // Snap to center horizontal (50%)
        if (dragState.elementType === 'text') {
          if (Math.abs(newX - 50) < 1.5) {
            newX = 50;
            setShowCenterGuides(true);
          } else {
            setShowCenterGuides(false);
          }
        } else if (dragState.initialWidth) {
          const centerX = newX + dragState.initialWidth / 2;
          if (Math.abs(centerX - 50) < 1.5) {
            newX = 50 - dragState.initialWidth / 2;
            setShowCenterGuides(true);
          } else {
            setShowCenterGuides(false);
          }
        }

        // Round to 1 decimal place for clean coordinates
        newX = Math.round(newX * 10) / 10;
        newY = Math.round(newY * 10) / 10;

        if (dragState.elementType === 'photo') {
          setTemplate((prev) => ({
            ...prev,
            photoSlots: prev.photoSlots.map((s) =>
              s.id === dragState.elementId ? { ...s, x: newX, y: newY } : s
            ),
          }));
        } else {
          setTemplate((prev) => ({
            ...prev,
            textSlots: prev.textSlots.map((t) =>
              t.id === dragState.elementId ? { ...t, x: newX, y: newY } : t
            ),
          }));
        }
      } else if (dragState.action === 'resize' && dragState.handle && dragState.initialWidth && dragState.initialHeight) {
        let newX = dragState.initialX;
        let newY = dragState.initialY;
        let newWidth = dragState.initialWidth;
        let newHeight = dragState.initialHeight;

        const handle = dragState.handle;

        // Horizontal resize
        if (handle.includes('e')) {
          newWidth = Math.max(5, Math.min(100 - newX, dragState.initialWidth + deltaPercentX));
        } else if (handle.includes('w')) {
          const maxDelta = dragState.initialWidth - 5;
          const clampedDelta = Math.min(maxDelta, deltaPercentX);
          newX = Math.max(0, dragState.initialX + clampedDelta);
          newWidth = dragState.initialWidth - (newX - dragState.initialX);
        }

        // Vertical resize
        if (handle.includes('s')) {
          newHeight = Math.max(5, Math.min(100 - newY, dragState.initialHeight + deltaPercentY));
        } else if (handle.includes('n')) {
          const maxDelta = dragState.initialHeight - 5;
          const clampedDelta = Math.min(maxDelta, deltaPercentY);
          newY = Math.max(0, dragState.initialY + clampedDelta);
          newHeight = dragState.initialHeight - (newY - dragState.initialY);
        }

        newX = Math.round(newX * 10) / 10;
        newY = Math.round(newY * 10) / 10;
        newWidth = Math.round(newWidth * 10) / 10;
        newHeight = Math.round(newHeight * 10) / 10;

        setTemplate((prev) => ({
          ...prev,
          photoSlots: prev.photoSlots.map((s) =>
            s.id === dragState.elementId
              ? { ...s, x: newX, y: newY, width: newWidth, height: newHeight }
              : s
          ),
        }));
      }
    };

    if (dragState) {
      window.addEventListener('pointermove', handleGlobalPointerMove);
      window.addEventListener('pointerup', handleGlobalPointerUp);
    }

    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
    };
  }, [dragState, setTemplate]);

  // Start dragging a box
  const handleStartMove = (
    e: React.PointerEvent,
    elementId: string,
    elementType: 'photo' | 'text',
    x: number,
    y: number,
    width?: number,
    height?: number
  ) => {
    e.stopPropagation();
    setSelectedElementId(elementId);

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    setDragState({
      elementId,
      elementType,
      action: 'move',
      startX: e.clientX,
      startY: e.clientY,
      initialX: x,
      initialY: y,
      initialWidth: width,
      initialHeight: height,
      containerWidth: rect.width,
      containerHeight: rect.height,
    });
  };

  // Start resizing a handle
  const handleStartResize = (
    e: React.PointerEvent,
    elementId: string,
    handle: ResizeHandle,
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    e.stopPropagation();
    setSelectedElementId(elementId);

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    setDragState({
      elementId,
      elementType: 'photo',
      action: 'resize',
      handle,
      startX: e.clientX,
      startY: e.clientY,
      initialX: x,
      initialY: y,
      initialWidth: width,
      initialHeight: height,
      containerWidth: rect.width,
      containerHeight: rect.height,
    });
  };

  // Keyboard Nudge Support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedElementId) return;

      const isArrow = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key);
      if (!isArrow) return;

      // Don't nudge if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;

      e.preventDefault();
      const step = e.shiftKey ? 1.0 : 0.2;

      let dx = 0;
      let dy = 0;
      if (e.key === 'ArrowLeft') dx = -step;
      if (e.key === 'ArrowRight') dx = step;
      if (e.key === 'ArrowUp') dy = -step;
      if (e.key === 'ArrowDown') dy = step;

      const isPhoto = template.photoSlots.some((s) => s.id === selectedElementId);

      if (isPhoto) {
        setTemplate((prev) => ({
          ...prev,
          photoSlots: prev.photoSlots.map((s) =>
            s.id === selectedElementId
              ? {
                  ...s,
                  x: Math.round(Math.max(0, Math.min(100 - s.width, s.x + dx)) * 10) / 10,
                  y: Math.round(Math.max(0, Math.min(100 - s.height, s.y + dy)) * 10) / 10,
                }
              : s
          ),
        }));
      } else {
        setTemplate((prev) => ({
          ...prev,
          textSlots: prev.textSlots.map((t) =>
            t.id === selectedElementId
              ? {
                  ...t,
                  x: Math.round(Math.max(0, Math.min(100, t.x + dx)) * 10) / 10,
                  y: Math.round(Math.max(0, Math.min(100, t.y + dy)) * 10) / 10,
                }
              : t
          ),
        }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, template, setTemplate]);

  const selectedPhoto = template.photoSlots.find((s) => s.id === selectedElementId);
  const selectedText = template.textSlots.find((t) => t.id === selectedElementId);

  return (
    <div className="w-full flex flex-col items-center bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
      {/* Top Stage Toolbar */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-800 text-xs">
        {/* Mode Selector */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setEditorMode('interactive')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              editorMode === 'interactive'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Move className="w-3.5 h-3.5" />
            <span>Editor de Rectángulos</span>
          </button>

          <button
            type="button"
            onClick={() => setEditorMode('split')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              editorMode === 'split'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Modo Dividido / Transparente</span>
          </button>

          <button
            type="button"
            onClick={() => setEditorMode('preview')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              editorMode === 'preview'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Vista Previa Final</span>
          </button>
        </div>

        {/* Helpers: Center guide & Grid */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowGrid(!showGrid)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 cursor-pointer transition-all ${
              showGrid
                ? 'bg-slate-800 border-amber-500/50 text-amber-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Alternar cuadrícula de alineación"
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Cuadrícula</span>
          </button>

          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
            {template.width} x {template.height} px
          </span>
        </div>
      </div>

      {/* Interactive Visual Stage Canvas */}
      <div
        ref={containerRef}
        onClick={() => setSelectedElementId(null)}
        className="relative max-h-[640px] w-full flex items-center justify-center bg-slate-950/90 rounded-2xl p-2 border border-slate-800 shadow-inner overflow-hidden select-none"
        style={{ touchAction: 'none' }}
      >
        {/* Canvas Display */}
        <div
          className="relative rounded-lg shadow-2xl overflow-hidden border border-slate-700/60"
          style={{
            aspectRatio: `${template.width} / ${template.height}`,
            maxHeight: '600px',
            maxWidth: '100%',
          }}
        >
          {/* Canvas Element */}
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain block"
            style={{
              opacity: editorMode === 'interactive' ? 0.35 : editorMode === 'split' ? 0.75 : 1.0,
            }}
          />

          {/* Grid Overlay */}
          {showGrid && editorMode !== 'preview' && (
            <div
              className="absolute inset-0 pointer-events-none opacity-15"
              style={{
                backgroundImage:
                  'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
                backgroundSize: '10% 10%',
              }}
            />
          )}

          {/* Center Vertical & Horizontal Guides */}
          {showCenterGuides && (
            <>
              <div className="absolute top-0 bottom-0 left-1/2 w-[2px] bg-amber-400/80 -translate-x-1/2 pointer-events-none shadow-lg z-30 animate-pulse" />
              <div className="absolute left-0 right-0 top-1/2 h-[2px] bg-amber-400/80 -translate-y-1/2 pointer-events-none shadow-lg z-30 animate-pulse" />
            </>
          )}

          {/* INTERACTIVE DRAGGABLE & RESIZABLE OVERLAYS (Visible in Interactive and Split mode) */}
          {editorMode !== 'preview' && (
            <div className="absolute inset-0">
              {/* 1. PHOTO RECTANGLES (Grupal, Maestra, Individual) */}
              {template.photoSlots.map((slot) => {
                const isSelected = selectedElementId === slot.id;
                const theme = PHOTO_THEMES[slot.id] || {
                  bg: 'bg-sky-500/20',
                  border: 'border-sky-400',
                  activeBorder: 'border-sky-300 ring-2 ring-sky-400 shadow-lg',
                  badge: 'bg-sky-600 text-white',
                  text: 'text-sky-300',
                  name: slot.label,
                };

                return (
                  <div
                    key={slot.id}
                    onPointerDown={(e) =>
                      handleStartMove(e, slot.id, 'photo', slot.x, slot.y, slot.width, slot.height)
                    }
                    className={`absolute cursor-move transition-shadow rounded-lg border-2 ${
                      isSelected
                        ? `${theme.activeBorder} z-20`
                        : `${theme.border} ${theme.bg} z-10 hover:border-white`
                    }`}
                    style={{
                      left: `${slot.x}%`,
                      top: `${slot.y}%`,
                      width: `${slot.width}%`,
                      height: `${slot.height}%`,
                      backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.08)' : undefined,
                    }}
                  >
                    {/* Badge Label */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 pointer-events-none">
                      <span
                        className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded shadow-md flex items-center gap-1 ${theme.badge}`}
                      >
                        <Camera className="w-3 h-3" />
                        {theme.name}
                      </span>
                    </div>

                    {/* Coordinates pill on active/hover */}
                    <div className="absolute bottom-1.5 right-1.5 pointer-events-none opacity-80 sm:opacity-100">
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-950/80 text-slate-200 border border-slate-700">
                        {slot.width}% × {slot.height}%
                      </span>
                    </div>

                    {/* Resize Handles (Only shown when selected) */}
                    {isSelected && (
                      <>
                        {/* 4 Corners */}
                        <div
                          onPointerDown={(e) =>
                            handleStartResize(e, slot.id, 'nw', slot.x, slot.y, slot.width, slot.height)
                          }
                          className="absolute -top-2 -left-2 w-4 h-4 bg-white border-2 border-slate-900 rounded-full cursor-nwse-resize shadow-md z-30 hover:scale-125 transition-transform"
                        />
                        <div
                          onPointerDown={(e) =>
                            handleStartResize(e, slot.id, 'ne', slot.x, slot.y, slot.width, slot.height)
                          }
                          className="absolute -top-2 -right-2 w-4 h-4 bg-white border-2 border-slate-900 rounded-full cursor-nesw-resize shadow-md z-30 hover:scale-125 transition-transform"
                        />
                        <div
                          onPointerDown={(e) =>
                            handleStartResize(e, slot.id, 'sw', slot.x, slot.y, slot.width, slot.height)
                          }
                          className="absolute -bottom-2 -left-2 w-4 h-4 bg-white border-2 border-slate-900 rounded-full cursor-nesw-resize shadow-md z-30 hover:scale-125 transition-transform"
                        />
                        <div
                          onPointerDown={(e) =>
                            handleStartResize(e, slot.id, 'se', slot.x, slot.y, slot.width, slot.height)
                          }
                          className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-slate-900 rounded-full cursor-nwse-resize shadow-md z-30 hover:scale-125 transition-transform"
                        />

                        {/* 4 Sides */}
                        <div
                          onPointerDown={(e) =>
                            handleStartResize(e, slot.id, 'n', slot.x, slot.y, slot.width, slot.height)
                          }
                          className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-3 bg-white border-2 border-slate-900 rounded cursor-ns-resize shadow-md z-30"
                        />
                        <div
                          onPointerDown={(e) =>
                            handleStartResize(e, slot.id, 's', slot.x, slot.y, slot.width, slot.height)
                          }
                          className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-3 bg-white border-2 border-slate-900 rounded cursor-ns-resize shadow-md z-30"
                        />
                        <div
                          onPointerDown={(e) =>
                            handleStartResize(e, slot.id, 'w', slot.x, slot.y, slot.width, slot.height)
                          }
                          className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-6 bg-white border-2 border-slate-900 rounded cursor-ew-resize shadow-md z-30"
                        />
                        <div
                          onPointerDown={(e) =>
                            handleStartResize(e, slot.id, 'e', slot.x, slot.y, slot.width, slot.height)
                          }
                          className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-6 bg-white border-2 border-slate-900 rounded cursor-ew-resize shadow-md z-30"
                        />
                      </>
                    )}
                  </div>
                );
              })}

              {/* 2. TEXT RECTANGLES (Escuela, Curso, Maestra, etc.) */}
              {template.textSlots.map((textSlot) => {
                const isSelected = selectedElementId === textSlot.id;
                const theme = TEXT_THEMES[textSlot.id] || {
                  bg: 'bg-amber-500/20',
                  border: 'border-amber-400 border-dashed',
                  activeBorder: 'border-amber-300 border-solid ring-2 ring-amber-400 shadow-lg',
                  badge: 'bg-amber-600 text-white',
                  text: 'text-amber-300',
                  name: textSlot.label,
                };

                // Approximate text box width based on font size / label length
                const approxWidth = Math.max(30, Math.min(80, (textSlot.label.length * textSlot.fontSize) / (template.width * 0.4) * 100));
                const approxHeight = Math.max(4, (textSlot.fontSize / template.height) * 180);

                return (
                  <div
                    key={textSlot.id}
                    onPointerDown={(e) =>
                      handleStartMove(e, textSlot.id, 'text', textSlot.x, textSlot.y)
                    }
                    className={`absolute cursor-move rounded-md transition-shadow ${
                      isSelected
                        ? `${theme.activeBorder} z-25 bg-amber-500/20`
                        : `${theme.border} ${theme.bg} z-15 hover:border-white`
                    }`}
                    style={{
                      left: `${textSlot.x}%`,
                      top: `${textSlot.y}%`,
                      transform: 'translate(-50%, -50%)',
                      minWidth: `${approxWidth}%`,
                      minHeight: `${approxHeight}%`,
                      padding: '4px 8px',
                    }}
                  >
                    <div className="flex items-center justify-center gap-1.5 pointer-events-none">
                      <span
                        className={`text-[9px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-1 whitespace-nowrap ${theme.badge}`}
                      >
                        <Type className="w-3 h-3" />
                        {theme.name}
                      </span>
                      <span className="text-[9px] font-mono text-slate-200 hidden sm:inline bg-slate-950/70 px-1 rounded">
                        Y: {textSlot.y}%
                      </span>
                    </div>

                    {/* Small anchor dot on center */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white pointer-events-none" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Selected Element Quick Fine-Tune Bar & Key Tips */}
      <div className="w-full mt-3 pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        {selectedPhoto ? (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-white flex items-center gap-1">
              <Camera className="w-4 h-4 text-amber-400" />
              {selectedPhoto.label}:
            </span>
            <span className="font-mono text-amber-300 bg-slate-800 px-2 py-0.5 rounded">
              X: {selectedPhoto.x}% | Y: {selectedPhoto.y}% | Ancho: {selectedPhoto.width}% | Alto: {selectedPhoto.height}%
            </span>
            <button
              type="button"
              onClick={() => {
                setTemplate((prev) => ({
                  ...prev,
                  photoSlots: prev.photoSlots.map((s) =>
                    s.id === selectedPhoto.id ? { ...s, x: Math.round((100 - s.width) / 2 * 10) / 10 } : s
                  ),
                }));
              }}
              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer font-medium"
              title="Centrar horizontalmente"
            >
              <AlignCenter className="w-3 h-3" />
              Centrar
            </button>
          </div>
        ) : selectedText ? (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-white flex items-center gap-1">
              <Type className="w-4 h-4 text-amber-400" />
              {selectedText.label}:
            </span>
            <span className="font-mono text-amber-300 bg-slate-800 px-2 py-0.5 rounded">
              X: {selectedText.x}% (Centro) | Y: {selectedText.y}% | Fuente: {selectedText.fontSize}px
            </span>
            <button
              type="button"
              onClick={() => {
                setTemplate((prev) => ({
                  ...prev,
                  textSlots: prev.textSlots.map((t) =>
                    t.id === selectedText.id ? { ...t, x: 50 } : t
                  ),
                }));
              }}
              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer font-medium"
              title="Centrar texto en el marco (X: 50%)"
            >
              <AlignCenter className="w-3 h-3" />
              Centrar (X: 50%)
            </button>
          </div>
        ) : (
          <span className="text-slate-400 flex items-center gap-1">
            <Move className="w-3.5 h-3.5 text-amber-400" />
            Haz clic y arrastra cualquier rectángulo para reubicarlo. Usa las esquinas para redimensionar.
          </span>
        )}

        <div className="text-slate-400 text-[11px]">
          <span>💡 Usa las </span>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 font-mono">
            Flechas ↑ ↓ ← →
          </kbd>
          <span> para ajuste fino (o </span>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 font-mono">
            Shift + Flechas
          </kbd>
          <span>).</span>
        </div>
      </div>
    </div>
  );
};
