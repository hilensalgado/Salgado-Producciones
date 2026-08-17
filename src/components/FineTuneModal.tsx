import React, { useState, useEffect, useRef } from 'react';
import { PhotoCropAdjustment, Course, Student, TemplateConfig, PhotoSlotType } from '../types';
import { ZoomIn, ZoomOut, Move, RotateCcw, Check, X } from 'lucide-react';
import { renderStudentToCanvas } from '../utils/canvasRenderer';

interface FineTuneModalProps {
  student: Student;
  course: Course;
  template: TemplateConfig;
  targetType: PhotoSlotType;
  onSave: (updates: {
    groupAdjustment?: PhotoCropAdjustment;
    individualAdjustment?: PhotoCropAdjustment;
    teacherAdjustment?: PhotoCropAdjustment;
  }) => void;
  onClose: () => void;
}

export const FineTuneModal: React.FC<FineTuneModalProps> = ({
  student,
  course,
  template,
  targetType,
  onSave,
  onClose,
}) => {
  const initialAdj: PhotoCropAdjustment =
    targetType === 'group'
      ? course.groupAdjustment || { zoom: 1.0, offsetX: 0, offsetY: 0 }
      : targetType === 'individual'
      ? student.individualAdjustment || { zoom: 1.0, offsetX: 0, offsetY: 0 }
      : student.teacherAdjustment || { zoom: 1.0, offsetX: 0, offsetY: 0 };

  const [zoom, setZoom] = useState<number>(initialAdj.zoom);
  const [offsetX, setOffsetX] = useState<number>(initialAdj.offsetX);
  const [offsetY, setOffsetY] = useState<number>(initialAdj.offsetY);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Render on every adjustment change
  useEffect(() => {
    if (!previewCanvasRef.current) return;

    const tempCourse: Course = {
      ...course,
      groupAdjustment: targetType === 'group' ? { zoom, offsetX, offsetY } : course.groupAdjustment,
    };

    const tempStudent: Student = {
      ...student,
      individualAdjustment:
        targetType === 'individual' ? { zoom, offsetX, offsetY } : student.individualAdjustment,
      teacherAdjustment:
        targetType === 'teacher' ? { zoom, offsetX, offsetY } : student.teacherAdjustment,
    };

    renderStudentToCanvas(previewCanvasRef.current, tempStudent, tempCourse, template, {
      scale: 0.3,
    }).catch(console.error);
  }, [zoom, offsetX, offsetY, student, course, template, targetType]);

  const handleSave = () => {
    const adj: PhotoCropAdjustment = { zoom, offsetX, offsetY };
    if (targetType === 'group') {
      onSave({ groupAdjustment: adj });
    } else if (targetType === 'individual') {
      onSave({ individualAdjustment: adj });
    } else {
      onSave({ teacherAdjustment: adj });
    }
    onClose();
  };

  const handleReset = () => {
    setZoom(1.0);
    setOffsetX(0);
    setOffsetY(0);
  };

  const targetLabel =
    targetType === 'group'
      ? 'Foto Grupal del Curso'
      : targetType === 'individual'
      ? `Foto Individual de ${student.name}`
      : `Foto con Maestra de ${student.name}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Move className="w-5 h-5 text-amber-400" />
              Ajuste Fino de Encuadre y Zoom
            </h3>
            <p className="text-xs text-slate-400">{targetLabel}</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Canvas Preview */}
          <div className="md:col-span-6 flex justify-center bg-slate-950 p-2 rounded-xl border border-slate-800">
            <canvas
              ref={previewCanvasRef}
              className="max-h-[380px] w-auto max-w-full object-contain rounded shadow-lg"
            />
          </div>

          {/* Sliders Controls */}
          <div className="md:col-span-6 space-y-4 text-xs">
            {/* Zoom Slider */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="font-semibold flex items-center gap-1">
                  <ZoomIn className="w-3.5 h-3.5 text-amber-400" />
                  Zoom (Acercar / Alejar):
                </span>
                <span className="font-mono text-amber-400">{zoom.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="2.5"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Pan Offset Y (Up / Down) */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="font-semibold">Mover Arriba / Abajo (Y):</span>
                <span className="font-mono text-amber-400">{offsetY > 0 ? `+${offsetY}%` : `${offsetY}%`}</span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                step="1"
                value={offsetY}
                onChange={(e) => setOffsetY(parseInt(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Pan Offset X (Left / Right) */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="font-semibold">Mover Izquierda / Derecha (X):</span>
                <span className="font-mono text-amber-400">{offsetX > 0 ? `+${offsetX}%` : `${offsetX}%`}</span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                step="1"
                value={offsetX}
                onChange={(e) => setOffsetX(parseInt(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restablecer
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer shadow-md"
          >
            <Check className="w-4 h-4" />
            Aplicar Ajuste
          </button>
        </div>
      </div>
    </div>
  );
};
