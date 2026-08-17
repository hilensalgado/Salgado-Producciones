import React from 'react';
import { Camera, Sparkles, FolderDown, RotateCcw, CheckCircle2, AlertTriangle, Layers, Users, Image as ImageIcon, Download } from 'lucide-react';
import { Course, TemplateConfig } from '../types';

interface HeaderProps {
  activeTab: 'courses' | 'upload' | 'template' | 'preview' | 'export';
  setActiveTab: (tab: 'courses' | 'upload' | 'template' | 'preview' | 'export') => void;
  courses: Course[];
  activeTemplate: TemplateConfig;
  onLoadDemo: () => void;
  onResetProject: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  courses,
  activeTemplate,
  onLoadDemo,
  onResetProject,
}) => {
  // Compute global stats
  const totalCourses = courses.length;
  const totalStudents = courses.reduce((acc, c) => acc + c.students.length, 0);
  
  let readyStudents = 0;
  let missingPhotosCount = 0;

  for (const c of courses) {
    const hasGroup = !!c.groupPhoto?.dataUrl;
    for (const s of c.students) {
      const hasInd = !!s.individualPhoto?.dataUrl;
      const hasTch = !!s.teacherPhoto?.dataUrl;
      if (hasGroup && hasInd && hasTch) {
        readyStudents++;
      } else {
        if (!hasGroup) missingPhotosCount++;
        if (!hasInd) missingPhotosCount++;
        if (!hasTch) missingPhotosCount++;
      }
    }
  }

  interface TabItem {
    id: 'courses' | 'upload' | 'template' | 'preview' | 'export';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    badgeAlert?: boolean;
    badgeSuccess?: boolean;
  }

  const tabs: TabItem[] = [
    { id: 'courses', label: '1. Escuela & Cursos', icon: Users, badge: totalStudents > 0 ? `${totalStudents} alumnos` : undefined },
    { id: 'upload', label: '2. Carga & Emparejador', icon: ImageIcon, badge: missingPhotosCount > 0 ? `${missingPhotosCount} faltantes` : (readyStudents > 0 ? '✓ Listo' : undefined), badgeAlert: missingPhotosCount > 0 },
    { id: 'template', label: '3. Marco & Calibrador', icon: Layers, badge: activeTemplate.name.split(' ')[0] },
    { id: 'preview', label: '4. Vista Previa', icon: Camera },
    { id: 'export', label: '5. Exportar por Lotes', icon: Download, badge: readyStudents > 0 ? `${readyStudents} listos` : undefined, badgeSuccess: readyStudents > 0 },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Navbar */}
        <div className="flex flex-col md:flex-row items-center justify-between py-3 gap-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-md shadow-amber-500/20 text-slate-950 font-black text-xl">
              <Camera className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  Anuario
                  <span className="text-xs uppercase px-2 py-0.5 rounded-full font-semibold bg-amber-400/10 text-amber-300 border border-amber-400/20">
                    Pro School Lab
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-400">
                Automatización de fotos escolares combinadas (Grupal + Con Maestra + Individual)
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            <button
              id="btn-load-demo"
              type="button"
              onClick={onLoadDemo}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Cargar Proyecto Demo
            </button>

            <button
              id="btn-reset-project"
              type="button"
              onClick={onResetProject}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium transition-all active:scale-95 cursor-pointer"
              title="Reiniciar a proyecto en blanco"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Nuevo Proyecto
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto py-2 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      isActive
                        ? 'bg-slate-950/20 text-slate-950'
                        : tab.badgeAlert
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : tab.badgeSuccess
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
