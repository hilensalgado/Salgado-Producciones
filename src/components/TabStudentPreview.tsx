import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Move,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  School,
  GraduationCap,
  User,
  Users,
  Camera,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Course, PhotoCropAdjustment, PhotoSlotType, Student, TemplateConfig } from '../types';
import { renderStudentToBlob, renderStudentToCanvas } from '../utils/canvasRenderer';
import { FineTuneModal } from './FineTuneModal';

interface TabStudentPreviewProps {
  courses: Course[];
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
  template: TemplateConfig;
  onGoToExport: () => void;
}

export const TabStudentPreview: React.FC<TabStudentPreviewProps> = ({
  courses,
  setCourses,
  template,
  onGoToExport,
}) => {
  // Flatten all students
  const allStudents = courses.flatMap((c) =>
    c.students.map((s) => ({
      student: s,
      course: c,
    }))
  );

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [fineTuneTarget, setFineTuneTarget] = useState<PhotoSlotType | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Clamped active item
  const currentItem = allStudents[Math.min(currentIndex, Math.max(0, allStudents.length - 1))];
  const activeStudent = currentItem?.student;
  const activeCourse = currentItem?.course;

  // Re-render canvas when active student, course or template changes
  useEffect(() => {
    if (!canvasRef.current || !activeStudent || !activeCourse) return;
    renderStudentToCanvas(canvasRef.current, activeStudent, activeCourse, template, {
      scale: 0.5,
    }).catch(console.error);
  }, [activeStudent, activeCourse, template]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : allStudents.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < allStudents.length - 1 ? prev + 1 : 0));
  };

  // Download single student composite image at full 100% resolution (e.g. 2400x3000)
  const handleDownloadCurrent = async () => {
    if (!activeStudent || !activeCourse) return;
    setIsDownloading(true);

    try {
      const blob = await renderStudentToBlob(activeStudent, activeCourse, template, {
        scale: 1.0,
        format: 'image/jpeg',
        quality: 0.96,
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Anuario_${activeCourse.code}_${activeStudent.normalizedName}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error al exportar anuario:', err);
      alert('Hubo un problema al generar la imagen.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSaveFineTune = (updates: {
    groupAdjustment?: PhotoCropAdjustment;
    individualAdjustment?: PhotoCropAdjustment;
    teacherAdjustment?: PhotoCropAdjustment;
  }) => {
    if (!activeCourse || !activeStudent) return;

    setCourses((prev) =>
      prev.map((c) => {
        if (c.id !== activeCourse.id) return c;

        const updatedCourse = {
          ...c,
          groupAdjustment: updates.groupAdjustment || c.groupAdjustment,
          students: c.students.map((s) => {
            if (s.id !== activeStudent.id) return s;
            return {
              ...s,
              individualAdjustment: updates.individualAdjustment || s.individualAdjustment,
              teacherAdjustment: updates.teacherAdjustment || s.teacherAdjustment,
            };
          }),
        };

        return updatedCourse;
      })
    );
  };

  if (allStudents.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <Users className="w-16 h-16 text-slate-600 mx-auto" />
        <h3 className="text-xl font-bold text-white">No hay alumnos cargados</h3>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          Carga la lista de alumnos en la pestaña "Escuela & Cursos" o sube las fotos en "Carga & Emparejador" para comenzar.
        </p>
      </div>
    );
  }

  const hasGroup = !!activeCourse?.groupPhoto;
  const hasInd = !!activeStudent?.individualPhoto;
  const hasTch = !!activeStudent?.teacherPhoto;
  const isComplete = hasGroup && hasInd && hasTch;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Navigator Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Student Selector & Index */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              id="btn-prev-student"
              type="button"
              onClick={handlePrev}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
              title="Alumno anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              id="btn-next-student"
              type="button"
              onClick={handleNext}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
              title="Siguiente alumno"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">{activeStudent.name}</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700 font-mono">
                {activeCourse.name} ({currentIndex + 1} de {allStudents.length})
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Escuela: {activeCourse.schoolName} • Docente: {activeCourse.teacherName}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            id="btn-download-single-print"
            type="button"
            onClick={handleDownloadCurrent}
            disabled={isDownloading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>{isDownloading ? 'Generando 300 DPI...' : 'Descargar esta Foto (JPG)'}</span>
          </button>

          <button
            id="btn-go-to-batch-export"
            type="button"
            onClick={onGoToExport}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Exportar Todo el Curso en ZIP</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Preview + Adjustment Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left / Center: High Fidelity Canvas Display */}
        <div className="lg:col-span-8 flex flex-col items-center bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative">
          {/* Status Badge Over Preview */}
          <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-xs">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Camera className="w-4 h-4 text-amber-400" />
              Vista Previa de Impresión Final (Escala 100% fotográfica)
            </span>
            {isComplete ? (
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 3/3 Fotos Listas
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/30 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Faltan Fotos en este Alumno
              </span>
            )}
          </div>

          {/* Canvas */}
          <div className="relative max-h-[680px] w-full flex items-center justify-center bg-slate-950/80 rounded-2xl p-3 border border-slate-800 shadow-inner overflow-hidden">
            <canvas
              ref={canvasRef}
              className="max-h-[640px] w-auto max-w-full object-contain rounded-lg shadow-2xl border border-slate-700/60"
            />
          </div>

          <p className="text-[11px] text-slate-500 mt-3 text-center">
            La imagen final se exportará en alta definición ({template.width} x {template.height} px a 300 DPI para laboratorio fotográfico).
          </p>
        </div>

        {/* Right: Fine-Tune Nudge & Crop Shortcuts */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 text-xs">
            <h4 className="font-bold text-white text-sm flex items-center gap-2 border-b border-slate-800 pb-3">
              <Move className="w-4 h-4 text-amber-400" />
              Calibración de Encuadre Individual
            </h4>
            <p className="text-slate-400">
              Si alguna foto de este alumno necesita un reencuadre (hacer zoom o mover arriba/abajo), ajústala sin alterar las de sus compañeros:
            </p>

            {/* Slot 1: Grupal */}
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">Foto Grupal</span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Zoom: {(activeCourse.groupAdjustment?.zoom || 1).toFixed(2)}x
                </span>
              </div>
              <button
                type="button"
                onClick={() => setFineTuneTarget('group')}
                className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold cursor-pointer"
              >
                Ajustar
              </button>
            </div>

            {/* Slot 2: Con Maestra */}
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">Foto con Maestra</span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Zoom: {(activeStudent.teacherAdjustment?.zoom || 1).toFixed(2)}x
                </span>
              </div>
              <button
                type="button"
                onClick={() => setFineTuneTarget('teacher')}
                className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold cursor-pointer"
              >
                Ajustar
              </button>
            </div>

            {/* Slot 3: Individual */}
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">Foto Individual</span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Zoom: {(activeStudent.individualAdjustment?.zoom || 1).toFixed(2)}x
                </span>
              </div>
              <button
                type="button"
                onClick={() => setFineTuneTarget('individual')}
                className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold cursor-pointer"
              >
                Ajustar
              </button>
            </div>
          </div>

          {/* Quick Roster Selector List */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3 text-xs">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              Navegador de Alumnos ({allStudents.length})
            </h4>

            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {allStudents.map(({ student, course }, idx) => {
                const isSelected = idx === currentIndex;
                const isItemComplete = !!course.groupPhoto && !!student.individualPhoto && !!student.teacherPhoto;

                return (
                  <div
                    key={student.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                        : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="truncate">
                      <span className="block truncate">{student.name}</span>
                      <span className="text-[10px] text-slate-500 font-normal">{course.name}</span>
                    </div>

                    {isItemComplete ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" title="3/3 Fotos Listas" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-rose-400 flex-shrink-0" title="Incompleto" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Fine Tune Modal */}
      {fineTuneTarget && (
        <FineTuneModal
          student={activeStudent}
          course={activeCourse}
          template={template}
          targetType={fineTuneTarget}
          onSave={handleSaveFineTune}
          onClose={() => setFineTuneTarget(null)}
        />
      )}
    </div>
  );
};
