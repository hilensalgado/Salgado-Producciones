import React, { useState } from 'react';
import JSZip from 'jszip';
import {
  Download,
  FolderArchive,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Layers,
  FileImage,
  Printer,
  Sliders,
  Settings,
  HardDrive,
} from 'lucide-react';
import { Course, Student, TemplateConfig } from '../types';
import { renderStudentToBlob } from '../utils/canvasRenderer';

interface TabBatchExportProps {
  courses: Course[];
  template: TemplateConfig;
}

export const TabBatchExport: React.FC<TabBatchExportProps> = ({ courses, template }) => {
  const [format, setFormat] = useState<'image/jpeg' | 'image/png'>('image/jpeg');
  const [quality, setQuality] = useState<number>(0.96);
  const [resolutionMode, setResolutionMode] = useState<'preset' | 'custom'>('preset');
  const [selectedPreset, setSelectedPreset] = useState<string>('300dpi-20x25');
  const [customWidth, setCustomWidth] = useState<number>(template.width);
  const [customHeight, setCustomHeight] = useState<number>(template.height);

  const PRINT_PRESETS = [
    {
      id: '300dpi-20x25',
      name: '20 × 25 cm (8×10″)',
      dpi: '300 DPI',
      width: 2400,
      height: 3000,
      desc: 'Formato estándar de anuario escolar',
    },
    {
      id: '300dpi-15x21',
      name: '15 × 21 cm (A5)',
      dpi: '300 DPI',
      width: 1772,
      height: 2480,
      desc: 'Formato mediano económico',
    },
    {
      id: '300dpi-20x30',
      name: '20 × 30 cm',
      dpi: '300 DPI',
      width: 2362,
      height: 3543,
      desc: 'Formato alargado / apaisado',
    },
    {
      id: '300dpi-30x40',
      name: '30 × 40 cm',
      dpi: '300 DPI',
      width: 3543,
      height: 4724,
      desc: 'Gran formato cuadro / mural',
    },
  ];

  // Effective export dimensions
  const activePreset = PRINT_PRESETS.find((p) => p.id === selectedPreset);
  const exportWidth = resolutionMode === 'custom' ? customWidth : (activePreset?.width || template.width);
  const exportHeight = resolutionMode === 'custom' ? customHeight : (activePreset?.height || template.height);
  const [zipByCourse, setZipByCourse] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [progress, setProgress] = useState<{ current: number; total: number; currentName: string }>({
    current: 0,
    total: 0,
    currentName: '',
  });
  const [lastExportUrl, setLastExportUrl] = useState<string | null>(null);

  // Compute ready students
  const readyList: { student: Student; course: Course }[] = [];
  const incompleteList: { student: Student; course: Course }[] = [];

  for (const course of courses) {
    const hasGroup = !!course.groupPhoto;
    for (const student of course.students) {
      const hasInd = !!student.individualPhoto;
      const hasTch = !!student.teacherPhoto;
      if (hasGroup && hasInd && hasTch) {
        readyList.push({ student, course });
      } else {
        incompleteList.push({ student, course });
      }
    }
  }

  const handleStartBatchExport = async () => {
    if (readyList.length === 0) {
      alert('No hay alumnos con las 3 fotos completas para exportar.');
      return;
    }

    setIsExporting(true);
    setProgress({ current: 0, total: readyList.length, currentName: 'Iniciando empaquetado...' });

    try {
      const zip = new JSZip();

      for (let i = 0; i < readyList.length; i++) {
        const { student, course } = readyList[i];
        setProgress({
          current: i + 1,
          total: readyList.length,
          currentName: `${student.name} (${course.name})`,
        });

        // Render at specified resolution
        const blob = await renderStudentToBlob(student, course, template, {
          customWidth: exportWidth,
          customHeight: exportHeight,
          format,
          quality,
        });

        const extension = format === 'image/png' ? 'png' : 'jpg';
        const fileName = `Anuario_${course.code}_${student.normalizedName}.${extension}`;

        if (zipByCourse) {
          // Folder by course
          const folderName = `${course.name.replace(/[/\\?%*:|"<>]/g, '_')}_(${course.code})`;
          zip.folder(folderName)?.file(fileName, blob);
        } else {
          zip.file(fileName, blob);
        }
      }

      setProgress({
        current: readyList.length,
        total: readyList.length,
        currentName: 'Comprimiendo archivo ZIP...',
      });

      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });

      const url = URL.createObjectURL(zipBlob);
      setLastExportUrl(url);

      const a = document.createElement('a');
      a.href = url;
      const schoolPrefix = courses[0]?.schoolName ? `${courses[0].schoolName.replace(/\s+/g, '_')}_` : '';
      a.download = `Anuarios_${schoolPrefix}${new Date().getFullYear()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error al exportar lote:', err);
      alert('Hubo un error al generar el archivo ZIP.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <FolderArchive className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Exportación por Lotes en Alta Resolución (ZIP)
            </h2>
            <p className="text-sm text-slate-400">
              Genera y descarga todos los anuarios escolares listos para enviar al laboratorio fotográfico o imprenta.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="bg-slate-900 border border-emerald-500/30 p-4 rounded-2xl flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Alumnos Listos (3/3 fotos)</span>
            <span className="text-2xl font-black text-white">{readyList.length}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Cursos en el Proyecto</span>
            <span className="text-2xl font-black text-white">{courses.length}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-rose-500/30 p-4 rounded-2xl flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Alumnos Incompletos</span>
            <span className="text-2xl font-black text-white">{incompleteList.length}</span>
          </div>
        </div>
      </div>

      {/* Export Options & Settings */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
        <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <Settings className="w-4 h-4 text-amber-400" />
          Parámetros de Renderizado e Impresión
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Format */}
          <div className="space-y-2">
            <label className="block font-semibold text-slate-300">Formato de Imagen de Salida:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormat('image/jpeg')}
                className={`p-3 rounded-xl border text-center font-semibold transition-all cursor-pointer ${
                  format === 'image/jpeg'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                JPG / JPEG (Recomendado)
                <span className="block text-[10px] font-normal text-slate-400 mt-0.5">
                  Óptimo para laboratorios fotográficos
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('image/png')}
                className={`p-3 rounded-xl border text-center font-semibold transition-all cursor-pointer ${
                  format === 'image/png'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                PNG (Sin compresión)
                <span className="block text-[10px] font-normal text-slate-400 mt-0.5">
                  Máxima nitidez, mayor peso
                </span>
              </button>
            </div>
          </div>

          {/* Quality for JPEG */}
          {format === 'image/jpeg' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-300">Calidad de Compresión JPG:</label>
                <span className="font-mono text-amber-400 font-bold">{Math.round(quality * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.80"
                max="1.0"
                step="0.02"
                value={quality}
                onChange={(e) => setQuality(parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <p className="text-[10px] text-slate-400">96%-100% asegura fidelidad total sin artefactos visibles.</p>
            </div>
          )}
        </div>

        {/* Resolution selector */}
        <div className="space-y-3 pt-2 border-t border-slate-800 text-xs">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-slate-300 flex items-center gap-2">
              <Printer className="w-4 h-4 text-amber-400" />
              Resolución de Impresión Fotográfica (300 DPI):
            </label>
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setResolutionMode('preset')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  resolutionMode === 'preset'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Formatos Estándar (300 DPI)
              </button>
              <button
                type="button"
                onClick={() => setResolutionMode('custom')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  resolutionMode === 'custom'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Píxeles Personalizados
              </button>
            </div>
          </div>

          {resolutionMode === 'preset' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
              {PRINT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelectedPreset(preset.id)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedPreset === preset.id
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{preset.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono font-bold">
                      {preset.dpi}
                    </span>
                  </div>
                  <span className="block font-mono text-[11px] text-amber-400/90 mt-1">
                    {preset.width} × {preset.height} px
                  </span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">{preset.desc}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-slate-400 text-[11px]">Ancho de salida (Píxeles):</label>
                <input
                  type="number"
                  min="600"
                  max="8000"
                  step="10"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(Math.max(100, parseInt(e.target.value) || 100))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-slate-400 text-[11px]">Alto de salida (Píxeles):</label>
                <input
                  type="number"
                  min="600"
                  max="8000"
                  step="10"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(Math.max(100, parseInt(e.target.value) || 100))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Checkbox: Zip structure & Final Specs */}
        <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <label className="flex items-center gap-2.5 cursor-pointer text-slate-300">
            <input
              type="checkbox"
              checked={zipByCourse}
              onChange={(e) => setZipByCourse(e.target.checked)}
              className="rounded accent-amber-500 w-4 h-4"
            />
            <span>Organizar archivo ZIP en subcarpetas separadas por curso</span>
          </label>

          <div className="flex items-center gap-2 text-slate-400 font-mono">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
            Salida final por archivo:{' '}
            <strong className="text-white">
              {exportWidth} × {exportHeight} px
            </strong>
          </div>
        </div>
      </div>

      {/* Progress Bar (during rendering) */}
      {isExporting && (
        <div className="bg-slate-900 border border-amber-500/50 rounded-3xl p-6 shadow-xl space-y-3 animate-pulse">
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
              Renderizando Lote: {progress.currentName}
            </span>
            <span className="font-mono text-amber-300 font-bold">
              {progress.current} / {progress.total} (
              {Math.round((progress.current / Math.max(1, progress.total)) * 100)}%)
            </span>
          </div>

          <div className="w-full h-3.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-200"
              style={{
                width: `${Math.round((progress.current / Math.max(1, progress.total)) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Action Trigger Button */}
      <div className="text-center space-y-3">
        <button
          id="btn-trigger-batch-zip-export"
          type="button"
          disabled={isExporting || readyList.length === 0}
          onClick={handleStartBatchExport}
          className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-base shadow-xl transition-all active:scale-95 cursor-pointer"
        >
          <FolderArchive className="w-6 h-6" />
          <span>
            {isExporting
              ? 'Procesando Lote en Canvas...'
              : `Descargar Archivo ZIP (${readyList.length} Anuarios Listos)`}
          </span>
        </button>

        {lastExportUrl && !isExporting && (
          <p className="text-xs text-emerald-400 flex items-center justify-center gap-1.5 font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            ¡Archivo ZIP generado exitosamente! Si no se inició la descarga automáticamente,{' '}
            <a href={lastExportUrl} download="Anuarios.zip" className="underline text-amber-300">
              haz clic aquí para descargar
            </a>
            .
          </p>
        )}
      </div>

      {/* Incomplete Warning if any */}
      {incompleteList.length > 0 && (
        <div className="bg-rose-950/20 border border-rose-800/40 rounded-2xl p-5 text-xs text-rose-300 space-y-2">
          <div className="flex items-center gap-2 font-bold text-rose-200 text-sm">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Alumnos que no se incluirán en el ZIP por fotos faltantes ({incompleteList.length}):</span>
          </div>
          <p className="text-slate-400">
            Para incluirlos, regresa a la pestaña "Carga & Emparejador" y asigna las fotos que faltan:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-300 max-h-36 overflow-y-auto pl-2">
            {incompleteList.map(({ student, course }) => (
              <li key={student.id}>
                <span className="font-semibold text-white">{student.name}</span> ({course.name}) -{' '}
                {!course.groupPhoto ? 'Falta grupal • ' : ''}
                {!student.individualPhoto ? 'Falta individual • ' : ''}
                {!student.teacherPhoto ? 'Falta foto con maestra' : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
