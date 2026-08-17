import React, { useState, useRef, useEffect } from 'react';
import {
  Layers,
  Upload,
  Sparkles,
  Move,
  Type,
  Maximize2,
  Check,
  RotateCcw,
  Palette,
  Eye,
  Sliders,
  ShieldCheck,
  Info,
  Save,
  Download,
  FileJson,
  Star,
  Bookmark,
  Trash2,
  Plus,
  CheckCircle2,
} from 'lucide-react';
import { Course, PhotoSlot, TemplateConfig, TextSlot } from '../types';
import { PRESET_TEMPLATES } from '../utils/presets';
import { detectTransparentCutouts } from '../utils/alphaDetector';
import { InteractiveStage } from './InteractiveStage';
import {
  exportTemplateToJson,
  getSavedTemplates,
  importTemplateFromJson,
  saveCustomTemplate,
  setDefaultTemplate,
  deleteCustomTemplate,
} from '../utils/templateStorage';

interface TabTemplateEditorProps {
  template: TemplateConfig;
  setTemplate: React.Dispatch<React.SetStateAction<TemplateConfig>>;
  courses: Course[];
}

export const TabTemplateEditor: React.FC<TabTemplateEditorProps> = ({
  template,
  setTemplate,
  courses,
}) => {
  const [selectedElementId, setSelectedElementId] = useState<string | null>('slot-group');
  const [activeSubTab, setActiveSubTab] = useState<'interactive' | 'photos' | 'texts' | 'saved' | 'presets'>('interactive');
  const [editorMode, setEditorMode] = useState<'interactive' | 'preview' | 'split'>('interactive');
  const [isDetectingAlpha, setIsDetectingAlpha] = useState<boolean>(false);
  const [feedbackNotice, setFeedbackNotice] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);
  const [savedLibrary, setSavedLibrary] = useState<TemplateConfig[]>([]);
  const [saveModalOpen, setSaveModalOpen] = useState<boolean>(false);
  const [newTemplateName, setNewTemplateName] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  // Load user saved custom templates from LocalStorage
  useEffect(() => {
    setSavedLibrary(getSavedTemplates());
  }, []);

  const showNotification = (message: string, type: 'success' | 'info' | 'error' = 'success', duration = 5000) => {
    setFeedbackNotice({ message, type });
    setTimeout(() => {
      setFeedbackNotice(null);
    }, duration);
  };

  // Sample course & student for live preview in the calibrator
  const sampleCourse = courses[0] || {
    id: 'sample-course',
    code: '5toA',
    name: '5° Grado "A"',
    schoolName: 'Escuela Normal N° 1',
    teacherName: 'Prof. Marcela Gómez',
    year: '2026',
    students: [],
  };

  const sampleStudent = sampleCourse.students[0] || {
    id: 'sample-stu',
    name: 'Lucas Benítez',
    normalizedName: 'lucas_benitez',
    courseId: sampleCourse.id,
  };

  // Handle uploading custom PNG template
  const handleUploadTemplatePng = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const updated: TemplateConfig = {
          ...template,
          id: `custom-frame-${Date.now()}`,
          name: file.name.replace(/\.[^/.]+$/, ''),
          pngUrl: dataUrl,
          width: img.naturalWidth || 2400,
          height: img.naturalHeight || 3000,
          isPreset: false,
        };
        setTemplate(updated);
        showNotification(`¡Marco PNG "${file.name}" cargado con éxito (${updated.width}x${updated.height}px)!`);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Handle importing JSON
  const handleImportJsonFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    try {
      const imported = await importTemplateFromJson(file);
      setTemplate(imported);
      const updatedLib = saveCustomTemplate(imported);
      setSavedLibrary(updatedLib);
      showNotification(`¡Plantilla "${imported.name}" importada y guardada en tu biblioteca!`);
    } catch (err: any) {
      showNotification(err.message || 'Error al importar archivo JSON', 'error');
    }
  };

  // Auto-detect transparent windows
  const handleAutoDetectWindows = async () => {
    if (!template.pngUrl) {
      showNotification('Primero debes cargar o seleccionar un marco PNG.', 'info');
      return;
    }

    setIsDetectingAlpha(true);
    const detectedSlots = await detectTransparentCutouts(template.pngUrl);
    setIsDetectingAlpha(false);

    if (detectedSlots && detectedSlots.length > 0) {
      setTemplate((prev) => ({
        ...prev,
        photoSlots: detectedSlots,
      }));
      showNotification(`¡Éxito! Se detectaron y calibraron automáticamente ${detectedSlots.length} ventanas transparentes.`);
    } else {
      showNotification('No se detectaron zonas con transparencia nítida (alpha < 40). Puedes arrastrar los rectángulos directamente sobre el marco.', 'info');
    }
  };

  // Save current configuration as reusable default for future batches
  const handleSaveAsDefault = () => {
    setDefaultTemplate(template);
    saveCustomTemplate(template);
    setSavedLibrary(getSavedTemplates());
    showNotification('⭐ ¡Configuración de posiciones guardada como predeterminada! Se aplicará automáticamente en todos los lotes futuros.');
  };

  // Save as a new named template in the library
  const handleSaveNamedTemplate = () => {
    if (!newTemplateName.trim()) return;
    const customTemplate: TemplateConfig = {
      ...template,
      id: `custom-template-${Date.now()}`,
      name: newTemplateName.trim(),
      isPreset: false,
    };
    const updated = saveCustomTemplate(customTemplate);
    setSavedLibrary(updated);
    setTemplate(customTemplate);
    setNewTemplateName('');
    setSaveModalOpen(false);
    showNotification(`✓ Plantilla "${customTemplate.name}" guardada en tu biblioteca.`);
  };

  // Delete saved template
  const handleDeleteTemplate = (id: string, name: string) => {
    if (confirm(`¿Deseas eliminar la plantilla guardada "${name}"?`)) {
      const updated = deleteCustomTemplate(id);
      setSavedLibrary(updated);
      showNotification(`Plantilla "${name}" eliminada.`);
    }
  };

  // Photo slot updater
  const updatePhotoSlot = (id: string, updates: Partial<PhotoSlot>) => {
    setTemplate((prev) => ({
      ...prev,
      photoSlots: prev.photoSlots.map((slot) =>
        slot.id === id ? { ...slot, ...updates } : slot
      ),
    }));
  };

  // Text slot updater
  const updateTextSlot = (id: string, updates: Partial<TextSlot>) => {
    setTemplate((prev) => ({
      ...prev,
      textSlots: prev.textSlots.map((slot) =>
        slot.id === id ? { ...slot, ...updates } : slot
      ),
    }));
  };

  const selectedPhoto = template.photoSlots.find((s) => s.id === selectedElementId);
  const selectedText = template.textSlots.find((t) => t.id === selectedElementId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUploadTemplatePng}
        accept="image/png,image/webp,image/svg+xml"
        className="hidden"
      />
      <input
        type="file"
        ref={jsonInputRef}
        onChange={handleImportJsonFile}
        accept=".json,application/json"
        className="hidden"
      />

      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                Editor Visual de Posiciones y Plantillas
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 font-mono border border-amber-500/20">
                {template.name} ({template.width} x {template.height} px)
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Arrastra los rectángulos directamente sobre el marco para ubicar las 3 fotos (Grupal, Maestra, Individual) y los 3 textos clave (Escuela, Curso, Maestra). Guarda esta configuración una sola vez para reutilizarla en todos tus lotes.
            </p>
          </div>

          {/* Top Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="btn-save-as-default-future"
              type="button"
              onClick={handleSaveAsDefault}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer"
              title="Guarda esta posición como predeterminada para todos los lotes futuros"
            >
              <Star className="w-4 h-4 fill-slate-950" />
              Guardar para Futuros Lotes
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4 text-amber-400" />
              Subir PNG Propio
            </button>

            <button
              type="button"
              onClick={() => setSaveModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-all cursor-pointer"
              title="Guardar como nueva plantilla en mi biblioteca"
            >
              <Bookmark className="w-4 h-4 text-amber-400" />
              Guardar Copia...
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Feedback Banner */}
      {feedbackNotice && (
        <div
          className={`px-4 py-3 rounded-xl flex items-center justify-between shadow-lg text-xs font-medium border ${
            feedbackNotice.type === 'error'
              ? 'bg-rose-950/80 border-rose-500/50 text-rose-200'
              : feedbackNotice.type === 'info'
              ? 'bg-sky-950/80 border-sky-500/50 text-sky-200'
              : 'bg-slate-900 border-amber-500/50 text-amber-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>{feedbackNotice.message}</span>
          </div>
          <button type="button" onClick={() => setFeedbackNotice(null)} className="text-slate-400 hover:text-white cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Visual Canvas Stage */}
        <div className="lg:col-span-7 xl:col-span-7 flex flex-col items-center">
          <InteractiveStage
            template={template}
            setTemplate={setTemplate}
            sampleStudent={sampleStudent}
            sampleCourse={sampleCourse}
            selectedElementId={selectedElementId}
            setSelectedElementId={setSelectedElementId}
            editorMode={editorMode}
            setEditorMode={setEditorMode}
          />
        </div>

        {/* Right Column: Controls Panel & Tabs */}
        <div className="lg:col-span-5 xl:col-span-5 space-y-4">
          {/* Sub-tabs */}
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveSubTab('interactive')}
              className={`flex-1 py-2 px-2.5 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeSubTab === 'interactive'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              📐 Elementos
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('photos')}
              className={`flex-1 py-2 px-2.5 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeSubTab === 'photos'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              📷 3 Fotos
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('texts')}
              className={`flex-1 py-2 px-2.5 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeSubTab === 'texts'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ✍️ Textos
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('saved')}
              className={`flex-1 py-2 px-2.5 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeSubTab === 'saved'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ⭐ Guardadas ({savedLibrary.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('presets')}
              className={`flex-1 py-2 px-2.5 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeSubTab === 'presets'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🎨 Marcos Base
            </button>
          </div>

          {/* Sub-tab 1: Quick Interactive Elements Selector & Reusable Save */}
          {activeSubTab === 'interactive' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Move className="w-4 h-4 text-amber-400" />
                  Editor de Posiciones Reutilizable
                </h4>
                <button
                  type="button"
                  onClick={handleSaveAsDefault}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold hover:bg-amber-500/25 cursor-pointer"
                  title="Guardar esta configuración para todos los lotes futuros"
                >
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  Guardar Predeterminada
                </button>
              </div>

              <p className="text-slate-400">
                Haz clic en cualquier elemento para seleccionarlo y arrastrarlo en el lienzo, o edita sus medidas aquí:
              </p>

              {/* 3 Photo Slots Quick Buttons */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  1. Las 3 Fotos Principales:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {template.photoSlots.map((slot) => {
                    const isSelected = selectedElementId === slot.id;
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setSelectedElementId(slot.id)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-sky-500/20 border-sky-400 text-sky-200 font-bold ring-1 ring-sky-400'
                            : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span className="block truncate">{slot.label}</span>
                        <span className="block text-[10px] text-slate-400 font-mono">
                          {slot.width}% × {slot.height}%
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3 Key Text Slots Quick Buttons */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  2. Los 3 Textos Clave:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {template.textSlots.slice(0, 3).map((textSlot) => {
                    const isSelected = selectedElementId === textSlot.id;
                    return (
                      <button
                        key={textSlot.id}
                        type="button"
                        onClick={() => setSelectedElementId(textSlot.id)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold ring-1 ring-amber-400'
                            : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span className="block truncate">{textSlot.label}</span>
                        <span className="block text-[10px] text-slate-400 font-mono">
                          Y: {textSlot.y}%
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Element Live Stepper Controls */}
              {selectedPhoto && (
                <div className="p-3.5 bg-slate-950/70 rounded-xl border border-sky-500/30 space-y-3 pt-3">
                  <div className="flex items-center justify-between text-sky-300 font-bold pb-2 border-b border-slate-800">
                    <span>Ajuste Numérico: {selectedPhoto.label}</span>
                    <span className="font-mono text-slate-400 text-[10px]">ID: {selectedPhoto.id}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Posición X:</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="95"
                          value={selectedPhoto.x}
                          onChange={(e) => updatePhotoSlot(selectedPhoto.id, { x: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                        />
                        <span className="text-slate-400">%</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Posición Y:</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="95"
                          value={selectedPhoto.y}
                          onChange={(e) => updatePhotoSlot(selectedPhoto.id, { y: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                        />
                        <span className="text-slate-400">%</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Ancho (Width):</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <input
                          type="number"
                          step="0.5"
                          min="5"
                          max="100"
                          value={selectedPhoto.width}
                          onChange={(e) => updatePhotoSlot(selectedPhoto.id, { width: parseFloat(e.target.value) || 10 })}
                          className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                        />
                        <span className="text-slate-400">%</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Alto (Height):</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <input
                          type="number"
                          step="0.5"
                          min="5"
                          max="100"
                          value={selectedPhoto.height}
                          onChange={(e) => updatePhotoSlot(selectedPhoto.id, { height: parseFloat(e.target.value) || 10 })}
                          className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                        />
                        <span className="text-slate-400">%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedText && (
                <div className="p-3.5 bg-slate-950/70 rounded-xl border border-amber-500/30 space-y-3 pt-3">
                  <div className="flex items-center justify-between text-amber-300 font-bold pb-2 border-b border-slate-800">
                    <span>Ajuste Numérico: {selectedText.label}</span>
                    <span className="font-mono text-slate-400 text-[10px]">ID: {selectedText.id}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Posición Y (Vertical):</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <input
                          type="number"
                          step="0.2"
                          min="0"
                          max="100"
                          value={selectedText.y}
                          onChange={(e) => updateTextSlot(selectedText.id, { y: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                        />
                        <span className="text-slate-400">%</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Posición X (Horizontal):</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="100"
                          value={selectedText.x}
                          onChange={(e) => updateTextSlot(selectedText.id, { x: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                        />
                        <span className="text-slate-400">%</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Tamaño de Fuente:</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <input
                          type="number"
                          step="2"
                          min="20"
                          max="120"
                          value={selectedText.fontSize}
                          onChange={(e) => updateTextSlot(selectedText.id, { fontSize: parseInt(e.target.value) || 40 })}
                          className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                        />
                        <span className="text-slate-400">px</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Color:</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <input
                          type="color"
                          value={selectedText.color}
                          onChange={(e) => updateTextSlot(selectedText.id, { color: e.target.value })}
                          className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                        />
                        <span className="text-slate-300 font-mono">{selectedText.color}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sub-tab 2: Detailed Photo Slots Slider Controls */}
          {activeSubTab === 'photos' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  Calibrador Detallado de Cuadros de Fotos
                </h4>
                <button
                  type="button"
                  onClick={handleAutoDetectWindows}
                  disabled={isDetectingAlpha}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold text-[11px] hover:bg-amber-500/20 cursor-pointer"
                >
                  {isDetectingAlpha ? 'Analizando...' : 'Auto-Detectar'}
                </button>
              </div>

              {/* Select Slot */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Seleccionar Cuadro a Calibrar:</label>
                <div className="grid grid-cols-3 gap-2">
                  {template.photoSlots.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setSelectedElementId(slot.id)}
                      className={`p-2 rounded-xl border text-center font-medium transition-all cursor-pointer ${
                        selectedElementId === slot.id
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              </div>

              {selectedPhoto && (
                <div className="space-y-4 pt-2">
                  {/* Position X */}
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Posición Horizontal (X):</span>
                      <span className="font-mono text-amber-400">{selectedPhoto.x}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="80"
                      step="0.5"
                      value={selectedPhoto.x}
                      onChange={(e) => updatePhotoSlot(selectedPhoto.id, { x: parseFloat(e.target.value) })}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>

                  {/* Position Y */}
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Posición Vertical (Y):</span>
                      <span className="font-mono text-amber-400">{selectedPhoto.y}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="80"
                      step="0.5"
                      value={selectedPhoto.y}
                      onChange={(e) => updatePhotoSlot(selectedPhoto.id, { y: parseFloat(e.target.value) })}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>

                  {/* Width */}
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Ancho (Width):</span>
                      <span className="font-mono text-amber-400">{selectedPhoto.width}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="0.5"
                      value={selectedPhoto.width}
                      onChange={(e) => updatePhotoSlot(selectedPhoto.id, { width: parseFloat(e.target.value) })}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>

                  {/* Height */}
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Alto (Height):</span>
                      <span className="font-mono text-amber-400">{selectedPhoto.height}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="80"
                      step="0.5"
                      value={selectedPhoto.height}
                      onChange={(e) => updatePhotoSlot(selectedPhoto.id, { height: parseFloat(e.target.value) })}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>

                  {/* Corner Radius */}
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Radio de Esquinas Redondeadas:</span>
                      <span className="font-mono text-amber-400">{selectedPhoto.borderRadius || 0}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      step="2"
                      value={selectedPhoto.borderRadius || 0}
                      onChange={(e) => updatePhotoSlot(selectedPhoto.id, { borderRadius: parseInt(e.target.value) })}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sub-tab 3: Detailed Text Slots Controls */}
          {activeSubTab === 'texts' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Type className="w-4 h-4 text-amber-400" />
                  Textos Fijos del Marco
                </h4>
              </div>

              {/* Text slot selector */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Seleccionar Campo de Texto:</label>
                <div className="grid grid-cols-2 gap-2">
                  {template.textSlots.map((textSlot) => (
                    <button
                      key={textSlot.id}
                      type="button"
                      onClick={() => setSelectedElementId(textSlot.id)}
                      className={`p-2 rounded-xl border text-left font-medium transition-all cursor-pointer truncate ${
                        selectedElementId === textSlot.id
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {textSlot.label}
                    </button>
                  ))}
                </div>
              </div>

              {selectedText && (
                <div className="space-y-3.5 pt-2">
                  {/* Position Y */}
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Posición Vertical (Y):</span>
                      <span className="font-mono text-amber-400">{selectedText.y}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="0.2"
                      value={selectedText.y}
                      onChange={(e) => updateTextSlot(selectedText.id, { y: parseFloat(e.target.value) })}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>

                  {/* Position X */}
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Posición Horizontal (X):</span>
                      <span className="font-mono text-amber-400">{selectedText.x}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="0.5"
                      value={selectedText.x}
                      onChange={(e) => updateTextSlot(selectedText.id, { x: parseFloat(e.target.value) })}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>

                  {/* Font Size */}
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Tamaño de Letra (Font Size):</span>
                      <span className="font-mono text-amber-400">{selectedText.fontSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="24"
                      max="90"
                      step="2"
                      value={selectedText.fontSize}
                      onChange={(e) => updateTextSlot(selectedText.id, { fontSize: parseInt(e.target.value) })}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>

                  {/* Color & Alignment */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">Color de Texto:</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={selectedText.color}
                          onChange={(e) => updateTextSlot(selectedText.id, { color: e.target.value })}
                          className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                        />
                        <input
                          type="text"
                          value={selectedText.color}
                          onChange={(e) => updateTextSlot(selectedText.id, { color: e.target.value })}
                          className="flex-1 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">Alineación:</label>
                      <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                        {(['left', 'center', 'right'] as const).map((align) => (
                          <button
                            key={align}
                            type="button"
                            onClick={() => updateTextSlot(selectedText.id, { align })}
                            className={`flex-1 py-1 rounded text-xs font-semibold capitalize cursor-pointer ${
                              selectedText.align === align
                                ? 'bg-amber-500 text-slate-950'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {align === 'left' ? 'Izq' : align === 'center' ? 'Centro' : 'Der'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Uppercase & Shadow */}
                  <div className="flex items-center justify-between pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                      <input
                        type="checkbox"
                        checked={selectedText.textTransform === 'uppercase'}
                        onChange={(e) =>
                          updateTextSlot(selectedText.id, {
                            textTransform: e.target.checked ? 'uppercase' : 'none',
                          })
                        }
                        className="rounded accent-amber-500"
                      />
                      <span>Todo Mayúsculas (UPPERCASE)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                      <input
                        type="checkbox"
                        checked={!!selectedText.shadow}
                        onChange={(e) =>
                          updateTextSlot(selectedText.id, {
                            shadow: e.target.checked,
                          })
                        }
                        className="rounded accent-amber-500"
                      />
                      <span>Sombra de Contraste</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sub-tab 4: User Saved Custom Templates & Import/Export */}
          {activeSubTab === 'saved' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-amber-400" />
                  Biblioteca de Plantillas Guardadas
                </h4>
                <button
                  type="button"
                  onClick={() => setSaveModalOpen(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Guardar Actual
                </button>
              </div>

              <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => exportTemplateToJson(template)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold cursor-pointer"
                    title="Descargar configuración como archivo .json"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    Exportar JSON
                  </button>

                  <button
                    type="button"
                    onClick={() => jsonInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold cursor-pointer"
                    title="Importar archivo .json de plantilla guardada"
                  >
                    <FileJson className="w-3.5 h-3.5 text-amber-400" />
                    Importar JSON
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleSaveAsDefault}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold hover:bg-amber-500/30 cursor-pointer"
                >
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  Marcar Predeterminada
                </button>
              </div>

              {savedLibrary.length === 0 ? (
                <div className="p-6 text-center text-slate-400 space-y-2">
                  <Bookmark className="w-8 h-8 text-slate-600 mx-auto" />
                  <p>Aún no has guardado plantillas personalizadas en tu biblioteca.</p>
                  <p className="text-[11px] text-slate-500">
                    Guarda la disposición actual con el botón "Guardar para Futuros Lotes" o "Guardar Actual".
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {savedLibrary.map((item) => {
                    const isSelected = template.id === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                          isSelected
                            ? 'bg-slate-800 border-amber-500 shadow-md ring-1 ring-amber-500/40'
                            : 'bg-slate-800/40 border-slate-700/80 hover:bg-slate-800'
                        }`}
                      >
                        <div
                          onClick={() => {
                            setTemplate(JSON.parse(JSON.stringify(item)));
                            showNotification(`Plantilla "${item.name}" cargada.`);
                          }}
                          className="flex-1 cursor-pointer truncate"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white block truncate">{item.name}</span>
                            {isSelected && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-bold text-[9px]">
                                En uso
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {item.width}x{item.height} px • {item.photoSlots.length} fotos • {item.textSlots.length} textos
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setTemplate(JSON.parse(JSON.stringify(item)));
                              showNotification(`Plantilla "${item.name}" cargada.`);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold cursor-pointer text-[11px]"
                          >
                            Cargar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTemplate(item.id, item.name)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                            title="Eliminar plantilla"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Sub-tab 5: Preset Templates Selection */}
          {activeSubTab === 'presets' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 text-xs">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Palette className="w-4 h-4 text-amber-400" />
                Plantillas Escolares Incluidas
              </h4>
              <p className="text-slate-400">
                Selecciona uno de los marcos diseñados para impresión o sube tu archivo PNG personalizado.
              </p>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {PRESET_TEMPLATES.map((preset) => {
                  const isSelected = template.id === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => {
                        setTemplate(JSON.parse(JSON.stringify(preset)));
                        showNotification(`Marco base "${preset.name}" activado.`);
                      }}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-800 border-amber-500 shadow-md ring-1 ring-amber-500/40'
                          : 'bg-slate-800/40 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">{preset.name}</span>
                        {isSelected && (
                          <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-bold text-[10px]">
                            Activo
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 text-xs mt-1">{preset.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Template Modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-amber-400" />
              Guardar Configuración en mi Biblioteca
            </h3>
            <p className="text-xs text-slate-400">
              Ingresa un nombre para identificar esta plantilla y reutilizarla en todos tus futuros cursos y colegios:
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre de la Plantilla:</label>
              <input
                type="text"
                value={newTemplateName}
                placeholder="Ej. Marco Colegios Primaria 2026"
                onChange={(e) => setNewTemplateName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveNamedTemplate()}
                autoFocus
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setSaveModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveNamedTemplate}
                disabled={!newTemplateName.trim()}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold cursor-pointer"
              >
                Guardar Plantilla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
