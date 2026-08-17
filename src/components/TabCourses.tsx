import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Users, School, GraduationCap, Calendar, UserCheck, ArrowRight, Upload, Sparkles, Check, AlertCircle } from 'lucide-react';
import { Course, Student } from '../types';
import { normalizeKey } from '../utils/fileParser';

interface TabCoursesProps {
  courses: Course[];
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
  onGoToUpload: () => void;
}

export const TabCourses: React.FC<TabCoursesProps> = ({
  courses,
  setCourses,
  onGoToUpload,
}) => {
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '');
  const [isEditingCourseModal, setIsEditingCourseModal] = useState<boolean>(false);
  const [editingCourse, setEditingCourse] = useState<Partial<Course>>({});
  const [batchNamesText, setBatchNamesText] = useState<string>('');
  const [showBatchModal, setShowBatchModal] = useState<boolean>(false);
  const [newStudentName, setNewStudentName] = useState<string>('');

  const activeCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];

  const handleCreateCourse = () => {
    const newCourse: Course = {
      id: `course-${Date.now()}`,
      code: `curso-${courses.length + 1}`,
      name: `${courses.length + 1}° Grado`,
      schoolName: courses[0]?.schoolName || 'Escuela Primaria N° 10',
      teacherName: 'Prof. Docente',
      year: new Date().getFullYear().toString(),
      students: [],
    };

    setCourses((prev) => [...prev, newCourse]);
    setSelectedCourseId(newCourse.id);
    setEditingCourse(newCourse);
    setIsEditingCourseModal(true);
  };

  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse.id || !editingCourse.name) return;

    setCourses((prev) =>
      prev.map((c) =>
        c.id === editingCourse.id
          ? {
              ...c,
              name: editingCourse.name || c.name,
              code: (editingCourse.code || c.code).trim().replace(/\s+/g, '_'),
              schoolName: editingCourse.schoolName || c.schoolName,
              teacherName: editingCourse.teacherName || c.teacherName,
              year: editingCourse.year || c.year,
            }
          : c
      )
    );
    setIsEditingCourseModal(false);
  };

  const handleDeleteCourse = (courseId: string) => {
    if (courses.length <= 1) {
      alert('Debe existir al menos un curso en el proyecto.');
      return;
    }
    if (confirm('¿Estás seguro de eliminar este curso y todos sus alumnos asociados?')) {
      const remaining = courses.filter((c) => c.id !== courseId);
      setCourses(remaining);
      setSelectedCourseId(remaining[0].id);
    }
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim() || !activeCourse) return;

    const newStudent: Student = {
      id: `stu-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: newStudentName.trim(),
      normalizedName: normalizeKey(newStudentName.trim()),
      courseId: activeCourse.id,
    };

    setCourses((prev) =>
      prev.map((c) =>
        c.id === activeCourse.id
          ? { ...c, students: [...c.students, newStudent] }
          : c
      )
    );
    setNewStudentName('');
  };

  const handleBatchImportStudents = () => {
    if (!batchNamesText.trim() || !activeCourse) return;

    const lines = batchNamesText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const newStudents: Student[] = lines.map((name, idx) => ({
      id: `stu-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
      name: name,
      normalizedName: normalizeKey(name),
      courseId: activeCourse.id,
    }));

    setCourses((prev) =>
      prev.map((c) =>
        c.id === activeCourse.id
          ? { ...c, students: [...c.students, ...newStudents] }
          : c
      )
    );

    setBatchNamesText('');
    setShowBatchModal(false);
  };

  const handleDeleteStudent = (studentId: string) => {
    if (!activeCourse) return;
    setCourses((prev) =>
      prev.map((c) =>
        c.id === activeCourse.id
          ? { ...c, students: c.students.filter((s) => s.id !== studentId) }
          : c
      )
    );
  };

  // Helper to apply school name & year to all courses with one click
  const handleApplySchoolToAll = () => {
    if (!activeCourse) return;
    if (
      confirm(
        `¿Deseas aplicar la Escuela "${activeCourse.schoolName}" y el Año "${activeCourse.year}" a todos los cursos (${courses.length})?`
      )
    ) {
      setCourses((prev) =>
        prev.map((c) => ({
          ...c,
          schoolName: activeCourse.schoolName,
          year: activeCourse.year,
        }))
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner Guide */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <School className="w-5 h-5 text-amber-400" />
              Configuración de Escuela, Cursos y Alumnos
            </h2>
            <p className="text-sm text-slate-400 max-w-3xl">
              Define los datos fijos que se imprimirán en el marco escolar (Nombre de Escuela, Docente, Curso y Año). Puedes cargar los nombres de los alumnos aquí o dejar que el sistema los detecte automáticamente de los nombres de las fotos.
            </p>
          </div>
          <button
            id="btn-go-to-upload-top"
            type="button"
            onClick={onGoToUpload}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-sm transition-all cursor-pointer whitespace-nowrap"
          >
            <span>Ir a Cargar Fotos</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Courses List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-amber-400" />
              Cursos Registrados ({courses.length})
            </h3>
            <button
              id="btn-add-course"
              type="button"
              onClick={handleCreateCourse}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Nuevo Curso
            </button>
          </div>

          <div className="space-y-2.5">
            {courses.map((course) => {
              const isSelected = activeCourse?.id === course.id;
              const hasGroup = !!course.groupPhoto;
              const totalStudents = course.students.length;
              const completeStudents = course.students.filter(
                (s) => !!s.individualPhoto && !!s.teacherPhoto && hasGroup
              ).length;

              return (
                <div
                  key={course.id}
                  id={`course-card-${course.id}`}
                  onClick={() => setSelectedCourseId(course.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-slate-800/90 border-amber-500/80 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/50'
                      : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/50 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-base">{course.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
                          cód: {course.code}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                        <School className="w-3.5 h-3.5 text-slate-500" />
                        {course.schoolName}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                        {course.teacherName}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCourse(course);
                          setIsEditingCourseModal(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-700 transition-colors"
                        title="Editar metadatos del curso"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {courses.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCourse(course.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-700 transition-colors"
                          title="Eliminar curso"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Course Status Mini bar */}
                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      {totalStudents} alumnos
                    </span>
                    <span
                      className={`font-medium ${
                        hasGroup && completeStudents === totalStudents && totalStudents > 0
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {hasGroup ? 'Grupal ✓' : 'Falta grupal'} • {completeStudents}/{totalStudents} listos
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Course Details & Student Roster */}
        {activeCourse && (
          <div className="lg:col-span-8 space-y-6">
            {/* Course Metadata Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-start justify-between flex-wrap gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-bold text-white">{activeCourse.name}</h3>
                    <span className="text-xs px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono font-bold">
                      Código: [{activeCourse.code}]
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Los archivos para este curso deben nombrarse:{' '}
                    <code className="text-amber-300 font-mono bg-slate-800 px-1.5 py-0.5 rounded">
                      {activeCourse.code}_grupal.jpg
                    </code>
                    ,{' '}
                    <code className="text-amber-300 font-mono bg-slate-800 px-1.5 py-0.5 rounded">
                      {activeCourse.code}_[alumno]_individual.jpg
                    </code>
                    ,{' '}
                    <code className="text-amber-300 font-mono bg-slate-800 px-1.5 py-0.5 rounded">
                      {activeCourse.code}_[alumno]_maestra.jpg
                    </code>
                  </p>
                </div>

                <button
                  id="btn-edit-active-course"
                  type="button"
                  onClick={() => {
                    setEditingCourse(activeCourse);
                    setIsEditingCourseModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Editar Datos Fijos
                </button>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-800">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <School className="w-3.5 h-3.5 text-amber-400" /> Escuela / Institución
                  </span>
                  <p className="text-sm font-semibold text-white mt-1 truncate">{activeCourse.schoolName || '-'}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-800">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-amber-400" /> Maestra / Docente
                  </span>
                  <p className="text-sm font-semibold text-white mt-1 truncate">{activeCourse.teacherName || '-'}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-800">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" /> Ciclo / Año
                  </span>
                  <p className="text-sm font-semibold text-white mt-1">{activeCourse.year || '-'}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-800">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-amber-400" /> Foto Grupal
                  </span>
                  <p className="text-sm font-semibold mt-1 flex items-center gap-1">
                    {activeCourse.groupPhoto ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Check className="w-4 h-4" /> Cargada
                      </span>
                    ) : (
                      <span className="text-rose-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" /> Pendiente
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {courses.length > 1 && (
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={handleApplySchoolToAll}
                    className="text-xs text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer"
                  >
                    Copiar nombre de escuela y año a los demás {courses.length - 1} cursos
                  </button>
                </div>
              )}
            </div>

            {/* Student Roster Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h4 className="text-lg font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-amber-400" />
                    Nómina de Alumnos ({activeCourse.students.length})
                  </h4>
                  <p className="text-xs text-slate-400">
                    Puedes agregar alumnos manualmente, pegar una lista o dejar que la subida masiva los cree automáticamente.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id="btn-batch-import-students"
                    type="button"
                    onClick={() => setShowBatchModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Pegar Lista de Alumnos
                  </button>
                </div>
              </div>

              {/* Add Single Student Form */}
              <form onSubmit={handleAddStudent} className="flex gap-2">
                <input
                  type="text"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="Escribir nombre del alumno (ej: Lucas Benítez)..."
                  className="flex-1 px-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="submit"
                  disabled={!newStudentName.trim()}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-sm transition-all cursor-pointer"
                >
                  Agregar Alumno
                </button>
              </form>

              {/* Students Table / Grid */}
              {activeCourse.students.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-xl">
                  <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-400">No hay alumnos agregados en este curso aún.</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Agrega nombres con el formulario superior, usa "Pegar Lista" o ve a "Cargar Fotos" para que se creen automáticamente desde los nombres de archivo.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Nombre del Alumno</th>
                        <th className="py-2.5 px-3">Foto Individual</th>
                        <th className="py-2.5 px-3">Foto con Maestra</th>
                        <th className="py-2.5 px-3">Estado</th>
                        <th className="py-2.5 px-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {activeCourse.students.map((student, idx) => {
                        const hasInd = !!student.individualPhoto;
                        const hasTch = !!student.teacherPhoto;
                        const isComplete = hasInd && hasTch && !!activeCourse.groupPhoto;

                        return (
                          <tr key={student.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 px-3 text-slate-500 font-mono">{idx + 1}</td>
                            <td className="py-3 px-3">
                              <span className="font-semibold text-slate-200 text-sm block">{student.name}</span>
                              <span className="text-[11px] text-slate-500 font-mono">
                                {activeCourse.code}_{student.normalizedName}_*.jpg
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              {hasInd ? (
                                <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-2 py-0.5 rounded text-[11px] font-medium">
                                  <Check className="w-3 h-3" /> Asignada
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-rose-400 bg-rose-950/40 border border-rose-800/50 px-2 py-0.5 rounded text-[11px] font-medium">
                                  <AlertCircle className="w-3 h-3" /> Faltante
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              {hasTch ? (
                                <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-2 py-0.5 rounded text-[11px] font-medium">
                                  <Check className="w-3 h-3" /> Asignada
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-rose-400 bg-rose-950/40 border border-rose-800/50 px-2 py-0.5 rounded text-[11px] font-medium">
                                  <AlertCircle className="w-3 h-3" /> Faltante
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              {isComplete ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-bold border border-emerald-500/20">
                                  Listo para Imprimir
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-medium border border-amber-500/20">
                                  Incompleto
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteStudent(student.id)}
                                className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors"
                                title="Eliminar alumno"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit Course Modal */}
      {isEditingCourseModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-amber-400" />
                Configurar Datos del Curso
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingCourseModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nombre para mostrar en el marco (Curso / División)
                </label>
                <input
                  type="text"
                  value={editingCourse.name || ''}
                  onChange={(e) => setEditingCourse((prev) => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder='Ej: 5° Grado División "A" o Sala Amarilla'
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Código de Curso para Nombres de Archivo (sin espacios)
                </label>
                <input
                  type="text"
                  value={editingCourse.code || ''}
                  onChange={(e) => setEditingCourse((prev) => ({ ...prev, code: e.target.value }))}
                  required
                  placeholder="Ej: 5toA, 1B, sala_roja, 7mo2da"
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm font-mono text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Este prefijo se usará para emparejar automáticamente las fotos: [código]_grupal.jpg, [código]_[alumno]_individual.jpg
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nombre de la Escuela / Institución
                </label>
                <input
                  type="text"
                  value={editingCourse.schoolName || ''}
                  onChange={(e) => setEditingCourse((prev) => ({ ...prev, schoolName: e.target.value }))}
                  required
                  placeholder="Ej: Escuela Normal Superior N° 1"
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nombre de la Maestra / Docente
                  </label>
                  <input
                    type="text"
                    value={editingCourse.teacherName || ''}
                    onChange={(e) => setEditingCourse((prev) => ({ ...prev, teacherName: e.target.value }))}
                    placeholder="Ej: Prof. Mariana Gómez"
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Año / Ciclo Lectivo
                  </label>
                  <input
                    type="text"
                    value={editingCourse.year || ''}
                    onChange={(e) => setEditingCourse((prev) => ({ ...prev, year: e.target.value }))}
                    placeholder="Ej: 2026"
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditingCourseModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm cursor-pointer shadow-md"
                >
                  Guardar Datos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Import Student Names Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-amber-400" />
                Pegar Lista de Alumnos para {activeCourse?.name}
              </h3>
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Pega una lista de nombres de alumnos (un nombre por línea). Se agregarán a la nómina de este curso.
            </p>

            <textarea
              rows={8}
              value={batchNamesText}
              onChange={(e) => setBatchNamesText(e.target.value)}
              placeholder={`Juan Pérez\nMaría García\nLucas Gómez\nSofía Rodríguez\nMateo López`}
              className="w-full px-4 py-3 bg-slate-800/90 border border-slate-700 rounded-xl text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <span className="text-xs text-slate-400">
                {batchNamesText.split('\n').filter((l) => l.trim().length > 0).length} nombres detectados
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleBatchImportStudents}
                  disabled={!batchNamesText.trim()}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-sm cursor-pointer shadow-md"
                >
                  Importar Alumnos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
