import React, { useState, useRef } from 'react';
import {
  Upload,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Users,
  User,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Filter,
  Image as ImageIcon,
  Check,
  X,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { Course, ParsedFileInfo, PhotoSlotType, Student } from '../types';
import { matchParsedFilesToCourses, parsePhotoFileName } from '../utils/fileParser';
import { ManualMatchModal } from './ManualMatchModal';

interface TabUploadMatchingProps {
  courses: Course[];
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
  onGoToTemplate: () => void;
  onGoToPreview: () => void;
}

export const TabUploadMatching: React.FC<TabUploadMatchingProps> = ({
  courses,
  setCourses,
  onGoToTemplate,
  onGoToPreview,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFilesList, setUploadedFilesList] = useState<ParsedFileInfo[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'incomplete' | 'ready' | 'missing_group' | 'missing_indiv' | 'missing_teacher'>('all');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');
  const [manualMatchTarget, setManualMatchTarget] = useState<ParsedFileInfo | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const singleSlotInputRef = useRef<HTMLInputElement>(null);
  const [pendingSlotUpload, setPendingSlotUpload] = useState<{
    courseId: string;
    studentId?: string;
    type: PhotoSlotType;
  } | null>(null);

  const handleFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsProcessing(true);

    const parsedItems: ParsedFileInfo[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const parse = parsePhotoFileName(file.name);

      parsedItems.push({
        id: `file-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
        file,
        dataUrl,
        fileName: file.name,
        fileSize: file.size,
        detectedCourseCode: parse.detectedCourseCode,
        detectedStudentName: parse.detectedStudentName,
        detectedType: parse.detectedType,
        matchStatus: 'unmatched',
      });
    }

    // Match against courses
    const { matchedFiles, updatedCourses, unmatchedCount } = matchParsedFilesToCourses(
      parsedItems,
      courses
    );

    setCourses(updatedCourses);
    setUploadedFilesList((prev) => [...matchedFiles, ...prev]);
    setIsProcessing(false);

    const matchedCount = matchedFiles.length - unmatchedCount;
    setSuccessNotice(
      `Se procesaron ${matchedFiles.length} fotos: ${matchedCount} asignadas automáticamente${
        unmatchedCount > 0 ? `, ${unmatchedCount} pendientes de revisión manual` : ''
      }.`
    );

    setTimeout(() => {
      setSuccessNotice(null);
    }, 6000);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleManualAssign = (
    fileId: string,
    courseId: string,
    type: PhotoSlotType,
    studentId?: string
  ) => {
    const fileEntry = uploadedFilesList.find((f) => f.id === fileId);
    if (!fileEntry) return;

    setCourses((prev) =>
      prev.map((course) => {
        if (course.id !== courseId) return course;

        if (type === 'group') {
          return {
            ...course,
            groupPhoto: {
              id: fileEntry.id,
              file: fileEntry.file,
              dataUrl: fileEntry.dataUrl,
              fileName: fileEntry.fileName,
              fileSize: fileEntry.fileSize,
              uploadDate: Date.now(),
            },
          };
        }

        if (studentId) {
          return {
            ...course,
            students: course.students.map((student) => {
              if (student.id !== studentId) return student;

              const photoPayload = {
                id: fileEntry.id,
                file: fileEntry.file,
                dataUrl: fileEntry.dataUrl,
                fileName: fileEntry.fileName,
                fileSize: fileEntry.fileSize,
                uploadDate: Date.now(),
              };

              if (type === 'individual') {
                return { ...student, individualPhoto: photoPayload };
              } else if (type === 'teacher') {
                return { ...student, teacherPhoto: photoPayload };
              }
              return student;
            }),
          };
        }

        return course;
      })
    );

    // Update file status in list
    setUploadedFilesList((prev) =>
      prev.map((f) =>
        f.id === fileId
          ? {
              ...f,
              matchStatus: 'matched',
              matchedCourseId: courseId,
              matchedStudentId: studentId,
              matchReason: 'Asignada manualmente por el usuario',
            }
          : f
      )
    );

    setManualMatchTarget(null);
  };

  // Direct single slot upload
  const handleSlotUploadTrigger = (
    courseId: string,
    type: PhotoSlotType,
    studentId?: string
  ) => {
    setPendingSlotUpload({ courseId, type, studentId });
    if (singleSlotInputRef.current) {
      singleSlotInputRef.current.value = '';
      singleSlotInputRef.current.click();
    }
  };

  const handleSingleSlotFileInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files || e.target.files.length === 0 || !pendingSlotUpload) return;
    const file = e.target.files[0];

    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

    const photoPayload = {
      id: `slot-direct-${Date.now()}`,
      file,
      dataUrl,
      fileName: file.name,
      fileSize: file.size,
      uploadDate: Date.now(),
    };

    setCourses((prev) =>
      prev.map((course) => {
        if (course.id !== pendingSlotUpload.courseId) return course;

        if (pendingSlotUpload.type === 'group') {
          return { ...course, groupPhoto: photoPayload };
        }

        if (pendingSlotUpload.studentId) {
          return {
            ...course,
            students: course.students.map((student) => {
              if (student.id !== pendingSlotUpload.studentId) return student;
              if (pendingSlotUpload.type === 'individual') {
                return { ...student, individualPhoto: photoPayload };
              } else if (pendingSlotUpload.type === 'teacher') {
                return { ...student, teacherPhoto: photoPayload };
              }
              return student;
            }),
          };
        }

        return course;
      })
    );

    setPendingSlotUpload(null);
  };

  // Aggregate audit statistics
  const filteredCourses =
    selectedCourseFilter === 'all'
      ? courses
      : courses.filter((c) => c.id === selectedCourseFilter);

  // Flatten students with course context for filtering
  const flattenedStudents = filteredCourses.flatMap((course) =>
    course.students.map((student) => {
      const hasGroup = !!course.groupPhoto;
      const hasInd = !!student.individualPhoto;
      const hasTch = !!student.teacherPhoto;
      const isComplete = hasGroup && hasInd && hasTch;

      return {
        student,
        course,
        hasGroup,
        hasInd,
        hasTch,
        isComplete,
      };
    })
  );

  const displayedStudents = flattenedStudents.filter((item) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'ready') return item.isComplete;
    if (selectedFilter === 'incomplete') return !item.isComplete;
    if (selectedFilter === 'missing_group') return !item.hasGroup;
    if (selectedFilter === 'missing_indiv') return !item.hasInd;
    if (selectedFilter === 'missing_teacher') return !item.hasTch;
    return true;
  });

  const unmatchedFiles = uploadedFilesList.filter((f) => f.matchStatus !== 'matched');

  // Stats
  const totalStudentsCount = flattenedStudents.length;
  const readyStudentsCount = flattenedStudents.filter((s) => s.isComplete).length;
  const incompleteCount = totalStudentsCount - readyStudentsCount;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hidden inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        multiple
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={singleSlotInputRef}
        onChange={handleSingleSlotFileInputChange}
        accept="image/*"
        className="hidden"
      />

      {/* Success Notification */}
      {successNotice && (
        <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 px-4 py-3 rounded-xl flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>{successNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessNotice(null)}
            className="text-emerald-400 hover:text-emerald-200"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Drag & Drop Zone */}
      <div
        id="dropzone-batch-upload"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer select-none ${
          isDragging
            ? 'border-amber-400 bg-amber-500/10 scale-[1.01] ring-4 ring-amber-500/20'
            : 'border-slate-700 bg-slate-900/90 hover:border-amber-500/60 hover:bg-slate-900'
        }`}
      >
        <div className="max-w-2xl mx-auto space-y-4 pointer-events-none">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
            <Upload className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-white">
              Arrastra aquí todas las fotos del lote o haz clic para seleccionar
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              Sube fotos grupales, individuales y con maestras de todos los cursos juntos en una sola subida masiva.
            </p>
          </div>

          {/* Filename Convention Cheat Sheet Banner */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-xs text-left text-slate-300 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                1
              </span>
              <div>
                <span className="font-semibold text-white block">Foto Grupal:</span>
                <code className="text-amber-300 font-mono">[curso]_grupal.jpg</code>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                2
              </span>
              <div>
                <span className="font-semibold text-white block">Con Maestra:</span>
                <code className="text-amber-300 font-mono">[curso]_[alumno]_maestra.jpg</code>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                3
              </span>
              <div>
                <span className="font-semibold text-white block">Individual:</span>
                <code className="text-amber-300 font-mono">[curso]_[alumno]_individual.jpg</code>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500">
            Formatos compatibles: JPG, JPEG, PNG, WEBP. Sin límite de cantidad de fotos.
          </p>
        </div>
      </div>

      {/* Unmatched / Orphaned Photos Notification Box */}
      {unmatchedFiles.length > 0 && (
        <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h4 className="text-base font-bold text-white">
                Fotos no emparejadas automáticamente ({unmatchedFiles.length})
              </h4>
            </div>
            <span className="text-xs text-slate-400">
              Estas fotos no coinciden exactamente con la convención de nombres. Asígnalas con 1 clic:
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-60 overflow-y-auto pr-1">
            {unmatchedFiles.map((file) => (
              <div
                key={file.id}
                className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 flex items-center gap-3 text-xs"
              >
                <div className="w-12 h-12 rounded-lg bg-slate-950 overflow-hidden flex-shrink-0 border border-slate-700">
                  <img src={file.dataUrl} alt={file.fileName} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate" title={file.fileName}>
                    {file.fileName}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {file.matchReason || 'Pendiente de asignación'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setManualMatchTarget(file)}
                    className="mt-1 text-amber-300 hover:text-amber-200 font-bold underline text-[11px] cursor-pointer"
                  >
                    Asignar Manualmente →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit Matrix & Student Photo Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-amber-400" />
                Matriz de Auditoría y Estado de Fotos
              </h3>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                  readyStudentsCount === totalStudentsCount && totalStudentsCount > 0
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                }`}
              >
                {readyStudentsCount} / {totalStudentsCount} listos para imprimir
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Verificación en tiempo real de las 3 fotos obligatorias por alumno (Grupal del curso + Con Maestra + Individual).
            </p>
          </div>

          {/* Action to preview */}
          {readyStudentsCount > 0 && (
            <button
              id="btn-go-to-preview-top"
              type="button"
              onClick={onGoToPreview}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer whitespace-nowrap"
            >
              <span>Ver Vista Previa del Anuario</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-slate-400 flex items-center gap-1 font-semibold">
              <Filter className="w-3.5 h-3.5" /> Filtro:
            </span>
            <button
              type="button"
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-all ${
                selectedFilter === 'all'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Todos ({totalStudentsCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('incomplete')}
              className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-all ${
                selectedFilter === 'incomplete'
                  ? 'bg-rose-500 text-white font-bold shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Faltan Fotos ({incompleteCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('ready')}
              className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-all ${
                selectedFilter === 'ready'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Completos 3/3 ({readyStudentsCount})
            </button>
          </div>

          {/* Filter by course */}
          {courses.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Curso:</span>
              <select
                value={selectedCourseFilter}
                onChange={(e) => setSelectedCourseFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none"
              >
                <option value="all">Todos los Cursos ({courses.length})</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.students.length} alumnos)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Group Photo Status Cards per Course */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            1. Fotos Grupales por Curso
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCourses.map((course) => {
              const hasGroup = !!course.groupPhoto;
              return (
                <div
                  key={course.id}
                  className={`p-4 rounded-xl border flex items-center gap-4 ${
                    hasGroup
                      ? 'bg-slate-800/60 border-emerald-800/40'
                      : 'bg-rose-950/20 border-rose-800/50'
                  }`}
                >
                  <div className="w-20 h-14 bg-slate-950 rounded-lg overflow-hidden flex-shrink-0 border border-slate-700 flex items-center justify-center">
                    {hasGroup ? (
                      <img
                        src={course.groupPhoto!.dataUrl}
                        alt={`Grupal ${course.name}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Users className="w-6 h-6 text-slate-600" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm truncate">{course.name}</span>
                    </div>
                    <p className="text-xs text-slate-400 truncate font-mono">cód: {course.code}</p>

                    <div className="mt-1 flex items-center justify-between">
                      {hasGroup ? (
                        <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                          <Check className="w-3 h-3" /> Grupal Asignada
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSlotUploadTrigger(course.id, 'group')}
                          className="text-[11px] text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                        >
                          + Subir Foto Grupal
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Student Photo Grid / List */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-amber-400" />
            2. Fotos Individuales y con Maestra por Alumno ({displayedStudents.length})
          </h4>

          {displayedStudents.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-xl">
              <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No hay alumnos que coincidan con el filtro seleccionado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedStudents.map(({ student, course, hasGroup, hasInd, hasTch, isComplete }) => {
                return (
                  <div
                    key={student.id}
                    id={`student-card-${student.id}`}
                    className={`p-4 rounded-xl border transition-all ${
                      isComplete
                        ? 'bg-slate-800/70 border-slate-700 shadow-sm'
                        : 'bg-slate-800/40 border-amber-500/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800">
                      <div>
                        <h5 className="font-bold text-white text-base">{student.name}</h5>
                        <p className="text-xs text-slate-400 flex items-center gap-1.5">
                          <span>{course.name}</span>
                          <span className="text-slate-600">•</span>
                          <span className="font-mono text-[11px] text-amber-300">
                            {course.code}_{student.normalizedName}
                          </span>
                        </p>
                      </div>

                      {isComplete ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px] font-bold">
                          ✓ Completo
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[11px] font-bold">
                          Incompleto
                        </span>
                      )}
                    </div>

                    {/* 3 Photo Slots Thumbnails */}
                    <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                      {/* Slot 1: Group */}
                      <div className="space-y-1">
                        <div
                          className={`w-full aspect-[4/3] rounded-lg overflow-hidden border flex items-center justify-center relative ${
                            hasGroup ? 'border-emerald-700 bg-slate-950' : 'border-rose-700/60 bg-rose-950/20'
                          }`}
                        >
                          {hasGroup ? (
                            <img
                              src={course.groupPhoto!.dataUrl}
                              alt="Grupal"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Users className="w-4 h-4 text-rose-400" />
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block font-medium">Grupal</span>
                      </div>

                      {/* Slot 2: Teacher */}
                      <div className="space-y-1">
                        <div
                          onClick={() => !hasTch && handleSlotUploadTrigger(course.id, 'teacher', student.id)}
                          className={`w-full aspect-[4/3] rounded-lg overflow-hidden border flex items-center justify-center relative group ${
                            hasTch
                              ? 'border-emerald-700 bg-slate-950'
                              : 'border-rose-700/60 bg-rose-950/20 cursor-pointer hover:border-amber-400'
                          }`}
                        >
                          {hasTch ? (
                            <img
                              src={student.teacherPhoto!.dataUrl}
                              alt="Con Maestra"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex flex-col items-center">
                              <GraduationCap className="w-4 h-4 text-rose-400" />
                              <span className="text-[9px] text-amber-400 font-bold mt-0.5">+ Subir</span>
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block font-medium">Con Maestra</span>
                      </div>

                      {/* Slot 3: Individual */}
                      <div className="space-y-1">
                        <div
                          onClick={() => !hasInd && handleSlotUploadTrigger(course.id, 'individual', student.id)}
                          className={`w-full aspect-[4/3] rounded-lg overflow-hidden border flex items-center justify-center relative group ${
                            hasInd
                              ? 'border-emerald-700 bg-slate-950'
                              : 'border-rose-700/60 bg-rose-950/20 cursor-pointer hover:border-amber-400'
                          }`}
                        >
                          {hasInd ? (
                            <img
                              src={student.individualPhoto!.dataUrl}
                              alt="Individual"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex flex-col items-center">
                              <User className="w-4 h-4 text-rose-400" />
                              <span className="text-[9px] text-amber-400 font-bold mt-0.5">+ Subir</span>
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block font-medium">Individual</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Manual Match Modal */}
      {manualMatchTarget && (
        <ManualMatchModal
          file={manualMatchTarget}
          courses={courses}
          onAssign={handleManualAssign}
          onClose={() => setManualMatchTarget(null)}
        />
      )}
    </div>
  );
};
