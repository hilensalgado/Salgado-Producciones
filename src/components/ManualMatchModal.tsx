import React, { useState } from 'react';
import { Course, ParsedFileInfo, PhotoSlotType } from '../types';
import { Check, X, User, Users, GraduationCap } from 'lucide-react';

interface ManualMatchModalProps {
  file: ParsedFileInfo;
  courses: Course[];
  onAssign: (fileId: string, courseId: string, type: PhotoSlotType, studentId?: string) => void;
  onClose: () => void;
}

export const ManualMatchModal: React.FC<ManualMatchModalProps> = ({
  file,
  courses,
  onAssign,
  onClose,
}) => {
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    file.matchedCourseId || courses[0]?.id || ''
  );
  const [selectedType, setSelectedType] = useState<PhotoSlotType>(
    file.detectedType || 'individual'
  );
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    file.matchedStudentId || ''
  );

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];

  const handleSave = () => {
    if (!selectedCourseId) return;
    if (selectedType !== 'group' && !selectedStudentId) {
      alert('Por favor selecciona el alumno para esta foto individual o con maestra.');
      return;
    }
    onAssign(file.id, selectedCourseId, selectedType, selectedStudentId);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-lg font-bold text-white">Asignación Manual de Foto</h3>
            <p className="text-xs text-slate-400 font-mono truncate max-w-xs">{file.fileName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thumbnail Preview */}
        <div className="flex items-center gap-4 bg-slate-800/60 p-3 rounded-xl border border-slate-800">
          <div className="w-20 h-20 bg-slate-950 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center border border-slate-700">
            <img src={file.dataUrl} alt={file.fileName} className="w-full h-full object-cover" />
          </div>
          <div className="text-xs space-y-1 text-slate-300">
            <p className="font-semibold text-white truncate">{file.fileName}</p>
            <p className="text-slate-400">Tamaño: {Math.round(file.fileSize / 1024)} KB</p>
            {file.detectedCourseCode && (
              <p className="text-amber-300">
                Curso detectado: <span className="font-mono">{file.detectedCourseCode}</span>
              </p>
            )}
            {file.detectedStudentName && (
              <p className="text-amber-300">
                Alumno detectado: <span className="font-semibold">{file.detectedStudentName}</span>
              </p>
            )}
          </div>
        </div>

        {/* Selector Form */}
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">1. Selecciona el Curso</label>
            <select
              value={selectedCourseId}
              onChange={(e) => {
                setSelectedCourseId(e.target.value);
                setSelectedStudentId('');
              }}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code}) - {c.schoolName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">2. Tipo de Foto</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedType('group')}
                className={`p-2.5 rounded-xl border text-center font-medium transition-all cursor-pointer ${
                  selectedType === 'group'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-4 h-4 mx-auto mb-1" />
                Grupal
              </button>

              <button
                type="button"
                onClick={() => setSelectedType('teacher')}
                className={`p-2.5 rounded-xl border text-center font-medium transition-all cursor-pointer ${
                  selectedType === 'teacher'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <GraduationCap className="w-4 h-4 mx-auto mb-1" />
                Con Maestra
              </button>

              <button
                type="button"
                onClick={() => setSelectedType('individual')}
                className={`p-2.5 rounded-xl border text-center font-medium transition-all cursor-pointer ${
                  selectedType === 'individual'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <User className="w-4 h-4 mx-auto mb-1" />
                Individual
              </button>
            </div>
          </div>

          {selectedType !== 'group' && selectedCourse && (
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">3. Selecciona el Alumno</label>
              {selectedCourse.students.length === 0 ? (
                <p className="text-rose-400 bg-rose-950/30 p-2.5 rounded-lg border border-rose-900/50">
                  Este curso no tiene alumnos registrados. Puedes crear alumnos en la pestaña "Escuela & Cursos".
                </p>
              ) : (
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">-- Seleccionar Alumno --</option>
                  {selectedCourse.students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer shadow-md"
          >
            <Check className="w-4 h-4" />
            Asignar Foto
          </button>
        </div>
      </div>
    </div>
  );
};
