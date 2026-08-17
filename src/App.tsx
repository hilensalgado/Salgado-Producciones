import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { TabCourses } from './components/TabCourses';
import { TabUploadMatching } from './components/TabUploadMatching';
import { TabTemplateEditor } from './components/TabTemplateEditor';
import { TabStudentPreview } from './components/TabStudentPreview';
import { TabBatchExport } from './components/TabBatchExport';
import { Course, TemplateConfig } from './types';
import { getDemoProject, PRESET_TEMPLATES } from './utils/presets';
import { getDefaultTemplate } from './utils/templateStorage';

const STORAGE_KEY_COURSES = 'anuario_pro_courses_v1';
const STORAGE_KEY_TEMPLATE = 'anuario_pro_template_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<'courses' | 'upload' | 'template' | 'preview' | 'export'>('courses');

  // Initial State from Demo or LocalStorage
  const [courses, setCourses] = useState<Course[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COURSES);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load courses from localStorage', e);
    }
    // Default initial demo state
    return getDemoProject().courses;
  });

  const [activeTemplate, setActiveTemplate] = useState<TemplateConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TEMPLATE);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load template from localStorage', e);
    }
    return getDefaultTemplate();
  });

  // Save to LocalStorage on changes (excluding heavy dataUrls if storage gets full)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_COURSES, JSON.stringify(courses));
    } catch (e) {
      console.warn('LocalStorage limit reached when saving courses', e);
    }
  }, [courses]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TEMPLATE, JSON.stringify(activeTemplate));
    } catch (e) {
      console.warn('LocalStorage limit reached when saving template', e);
    }
  }, [activeTemplate]);

  // Load Demo Project handler
  const handleLoadDemo = () => {
    const demo = getDemoProject();
    setCourses(demo.courses);
    setActiveTemplate(demo.activeTemplate);
    setActiveTab('preview');
  };

  // Reset to Blank Project
  const handleResetProject = () => {
    if (confirm('¿Deseas reiniciar el proyecto? Se borrarán los cursos y fotos cargados actualmente.')) {
      const blankCourse: Course = {
        id: `course-${Date.now()}`,
        code: '1A',
        name: '1° Grado "A"',
        schoolName: 'Mi Escuela Primaria',
        teacherName: 'Prof. Titular',
        year: new Date().getFullYear().toString(),
        students: [],
      };
      setCourses([blankCourse]);
      setActiveTemplate(getDefaultTemplate());
      setActiveTab('courses');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        courses={courses}
        activeTemplate={activeTemplate}
        onLoadDemo={handleLoadDemo}
        onResetProject={handleResetProject}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'courses' && (
          <TabCourses
            courses={courses}
            setCourses={setCourses}
            onGoToUpload={() => setActiveTab('upload')}
          />
        )}

        {activeTab === 'upload' && (
          <TabUploadMatching
            courses={courses}
            setCourses={setCourses}
            onGoToTemplate={() => setActiveTab('template')}
            onGoToPreview={() => setActiveTab('preview')}
          />
        )}

        {activeTab === 'template' && (
          <TabTemplateEditor
            template={activeTemplate}
            setTemplate={setActiveTemplate}
            courses={courses}
          />
        )}

        {activeTab === 'preview' && (
          <TabStudentPreview
            courses={courses}
            setCourses={setCourses}
            template={activeTemplate}
            onGoToExport={() => setActiveTab('export')}
          />
        )}

        {activeTab === 'export' && (
          <TabBatchExport
            courses={courses}
            template={activeTemplate}
          />
        )}
      </main>

      {/* Persistent Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Anuario • Automatización de Fotos Escolares Combinadas</span>
          <span className="font-mono text-slate-600">
            Renderizado Canvas 2D • Exportación ZIP por Lotes • Calibrador de Marcos PNG
          </span>
        </div>
      </footer>
    </div>
  );
}
