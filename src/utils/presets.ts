import { Course, TemplateConfig } from '../types';

/**
 * Creates SVG Data URLs for built-in template frames with transparent photo windows
 */
function createSvgFrameDataUrl(svgContent: string): string {
  const encoded = encodeURIComponent(svgContent);
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

export const PRESET_TEMPLATES: TemplateConfig[] = [
  {
    id: 'preset-classic-navy-gold',
    name: 'Clásico Azul Marino & Oro',
    description: 'Marco tradicional escolar con bordes dorados, paspartú marino y tipografía elegante.',
    width: 2400,
    height: 3000,
    isPreset: true,
    backgroundColor: '#0f172a',
    templateLayer: 'foreground',
    pngUrl: createSvgFrameDataUrl(`
      <svg width="2400" height="3000" viewBox="0 0 2400 3000" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#dfba73"/>
            <stop offset="50%" stop-color="#fef0cd"/>
            <stop offset="100%" stop-color="#b8860b"/>
          </linearGradient>
          <linearGradient id="navyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#091428"/>
            <stop offset="100%" stop-color="#16294a"/>
          </linearGradient>
          <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
            <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.6"/>
          </filter>
        </defs>

        <!-- Main Frame Body -->
        <rect width="2400" height="3000" fill="url(#navyGrad)" />
        
        <!-- Outer Gold Border -->
        <rect x="60" y="60" width="2280" height="2880" rx="30" fill="none" stroke="url(#goldGrad)" stroke-width="12" />
        <rect x="85" y="85" width="2230" height="2830" rx="20" fill="none" stroke="#dfba73" stroke-width="3" opacity="0.6" />

        <!-- Header Ribbon / Emblems -->
        <path d="M 200,60 L 2200,60 L 2100,120 L 300,120 Z" fill="url(#goldGrad)" opacity="0.2" />

        <!-- Transparent Cutouts with Inner Golden Frames (mask-like visual borders) -->
        <!-- Slot 1: Group Photo (Top) -->
        <!-- Mask Cutout Rect -->
        <rect x="140" y="180" width="2120" height="1200" rx="16" fill="black" opacity="0" />
        <rect x="134" y="174" width="2132" height="1212" rx="20" fill="none" stroke="url(#goldGrad)" stroke-width="12" />
        <rect x="126" y="166" width="2148" height="1228" rx="24" fill="none" stroke="#091428" stroke-width="6" />

        <!-- Slot 2: Teacher Photo (Bottom Left) -->
        <rect x="140" y="1450" width="1020" height="1060" rx="16" fill="black" opacity="0" />
        <rect x="134" y="1444" width="1032" height="1072" rx="20" fill="none" stroke="url(#goldGrad)" stroke-width="12" />
        <rect x="126" y="1436" width="1048" height="1088" rx="24" fill="none" stroke="#091428" stroke-width="6" />

        <!-- Slot 3: Individual Student Photo (Bottom Right) -->
        <rect x="1240" y="1450" width="1020" height="1060" rx="16" fill="black" opacity="0" />
        <rect x="1234" y="1444" width="1032" height="1072" rx="20" fill="none" stroke="url(#goldGrad)" stroke-width="12" />
        <rect x="1226" y="1436" width="1048" height="1088" rx="24" fill="none" stroke="#091428" stroke-width="6" />

        <!-- Bottom Footer Plaque -->
        <rect x="140" y="2570" width="2120" height="340" rx="18" fill="#0c1a33" stroke="url(#goldGrad)" stroke-width="4" filter="url(#shadow)" />
        <line x1="200" y1="2690" x2="2200" y2="2690" stroke="url(#goldGrad)" stroke-width="2" opacity="0.4" />
      </svg>
    `),
    photoSlots: [
      {
        id: 'slot-group',
        type: 'group',
        label: 'Foto Grupal',
        x: 5.83, // 140 / 2400 * 100
        y: 6.0, // 180 / 3000 * 100
        width: 88.33, // 2120 / 2400 * 100
        height: 40.0, // 1200 / 3000 * 100
        borderRadius: 16,
      },
      {
        id: 'slot-teacher',
        type: 'teacher',
        label: 'Con Maestra',
        x: 5.83, // 140 / 2400 * 100
        y: 48.33, // 1450 / 3000 * 100
        width: 42.5, // 1020 / 2400 * 100
        height: 35.33, // 1060 / 3000 * 100
        borderRadius: 16,
      },
      {
        id: 'slot-individual',
        type: 'individual',
        label: 'Foto Individual',
        x: 51.67, // 1240 / 2400 * 100
        y: 48.33, // 1450 / 3000 * 100
        width: 42.5, // 1020 / 2400 * 100
        height: 35.33, // 1060 / 3000 * 100
        borderRadius: 16,
      },
    ],
    textSlots: [
      {
        id: 'txt-school',
        field: 'schoolName',
        label: 'Nombre de Escuela',
        x: 50,
        y: 87.8, // inside footer plaque
        fontSize: 64,
        fontFamily: 'Cinzel, Georgia, serif',
        fontWeight: 'bold',
        color: '#fef0cd',
        align: 'center',
        textTransform: 'uppercase',
        shadow: true,
        shadowColor: 'rgba(0, 0, 0, 0.8)',
      },
      {
        id: 'txt-course',
        field: 'courseName',
        label: 'Curso / División',
        x: 25,
        y: 93.8,
        fontSize: 48,
        fontFamily: 'Montserrat, sans-serif',
        fontWeight: '600',
        color: '#dfba73',
        align: 'center',
        textTransform: 'uppercase',
        shadow: true,
      },
      {
        id: 'txt-teacher',
        field: 'teacherName',
        label: 'Nombre de Maestra',
        x: 75,
        y: 93.8,
        fontSize: 44,
        fontFamily: 'Montserrat, sans-serif',
        fontWeight: '500',
        color: '#f8fafc',
        align: 'center',
        textTransform: 'none',
        shadow: true,
      },
      {
        id: 'txt-year',
        field: 'year',
        label: 'Año Lectivo',
        x: 50,
        y: 3.5,
        fontSize: 42,
        fontFamily: 'Cinzel, Georgia, serif',
        fontWeight: 'bold',
        color: '#dfba73',
        align: 'center',
        textTransform: 'none',
        shadow: true,
      },
      {
        id: 'txt-student',
        field: 'studentName',
        label: 'Nombre del Alumno',
        x: 72.9, // right above/below student photo
        y: 84.5,
        fontSize: 40,
        fontFamily: 'Montserrat, sans-serif',
        fontWeight: '600',
        color: '#fef0cd',
        align: 'center',
        textTransform: 'uppercase',
        shadow: true,
      },
    ],
  },
  {
    id: 'preset-modern-editorial',
    name: 'Moderno Editorial Blanco & Grafito',
    description: 'Estilo contemporáneo, paspartú blanco puro, líneas finas y tipografía sans-serif limpia.',
    width: 2400,
    height: 3000,
    isPreset: true,
    backgroundColor: '#ffffff',
    templateLayer: 'foreground',
    pngUrl: createSvgFrameDataUrl(`
      <svg width="2400" height="3000" viewBox="0 0 2400 3000" xmlns="http://www.w3.org/2000/svg">
        <!-- Background Sheet -->
        <rect width="2400" height="3000" fill="#ffffff" />
        
        <!-- Clean Framing Grid -->
        <rect x="80" y="80" width="2240" height="2840" fill="none" stroke="#1e293b" stroke-width="4" />
        <line x1="80" y1="240" x2="2320" y2="240" stroke="#0f172a" stroke-width="2" />

        <!-- Photo Borders -->
        <rect x="140" y="280" width="2120" height="1160" fill="none" stroke="#334155" stroke-width="3" />
        <rect x="140" y="1500" width="1030" height="1050" fill="none" stroke="#334155" stroke-width="3" />
        <rect x="1230" y="1500" width="1030" height="1050" fill="none" stroke="#334155" stroke-width="3" />

        <!-- Sub labels -->
        <text x="160" y="1480" font-family="sans-serif" font-size="28" font-weight="700" fill="#64748b" letter-spacing="4">RECUERDO CON LA MAESTRA</text>
        <text x="1250" y="1480" font-family="sans-serif" font-size="28" font-weight="700" fill="#64748b" letter-spacing="4">RETRATO INDIVIDUAL</text>

        <!-- Bottom separator -->
        <line x1="140" y1="2620" x2="2260" y2="2620" stroke="#cbd5e1" stroke-width="2" />
      </svg>
    `),
    photoSlots: [
      {
        id: 'slot-group',
        type: 'group',
        label: 'Foto Grupal',
        x: 5.83,
        y: 9.33,
        width: 88.33,
        height: 38.67,
        borderRadius: 4,
      },
      {
        id: 'slot-teacher',
        type: 'teacher',
        label: 'Con Maestra',
        x: 5.83,
        y: 50.0,
        width: 42.92,
        height: 35.0,
        borderRadius: 4,
      },
      {
        id: 'slot-individual',
        type: 'individual',
        label: 'Foto Individual',
        x: 51.25,
        y: 50.0,
        width: 42.92,
        height: 35.0,
        borderRadius: 4,
      },
    ],
    textSlots: [
      {
        id: 'txt-school',
        field: 'schoolName',
        label: 'Nombre de Escuela',
        x: 50,
        y: 5.2,
        fontSize: 56,
        fontFamily: 'Montserrat, sans-serif',
        fontWeight: 'bold',
        color: '#0f172a',
        align: 'center',
        textTransform: 'uppercase',
        shadow: false,
      },
      {
        id: 'txt-course',
        field: 'courseName',
        label: 'Curso / División',
        x: 25,
        y: 91.5,
        fontSize: 52,
        fontFamily: 'Montserrat, sans-serif',
        fontWeight: 'bold',
        color: '#0f172a',
        align: 'center',
        textTransform: 'uppercase',
        shadow: false,
      },
      {
        id: 'txt-teacher',
        field: 'teacherName',
        label: 'Nombre de Maestra',
        x: 75,
        y: 91.5,
        fontSize: 46,
        fontFamily: 'Montserrat, sans-serif',
        fontWeight: '500',
        color: '#334155',
        align: 'center',
        textTransform: 'none',
        shadow: false,
      },
      {
        id: 'txt-year',
        field: 'year',
        label: 'Año Lectivo',
        x: 50,
        y: 96.5,
        fontSize: 40,
        fontFamily: 'Montserrat, sans-serif',
        fontWeight: '600',
        color: '#64748b',
        align: 'center',
        textTransform: 'none',
        shadow: false,
      },
      {
        id: 'txt-student',
        field: 'studentName',
        label: 'Nombre del Alumno',
        x: 72.7,
        y: 86.5,
        fontSize: 42,
        fontFamily: 'Montserrat, sans-serif',
        fontWeight: 'bold',
        color: '#0f172a',
        align: 'center',
        textTransform: 'uppercase',
        shadow: false,
      },
    ],
  },
  {
    id: 'preset-playful-primary',
    name: 'Primaria & Jardín Colorido',
    description: 'Diseño alegre con lápices, estrellas y marco pastel ideal para nivel inicial y primaria.',
    width: 2400,
    height: 3000,
    isPreset: true,
    backgroundColor: '#fffbeb',
    templateLayer: 'foreground',
    pngUrl: createSvgFrameDataUrl(`
      <svg width="2400" height="3000" viewBox="0 0 2400 3000" xmlns="http://www.w3.org/2000/svg">
        <rect width="2400" height="3000" fill="#fffbeb" />
        
        <!-- Fun border -->
        <rect x="50" y="50" width="2300" height="2900" rx="40" fill="none" stroke="#3b82f6" stroke-width="16" />
        <rect x="75" y="75" width="2250" height="2850" rx="30" fill="none" stroke="#f59e0b" stroke-width="8" stroke-dasharray="24 16" />

        <!-- Colorful photo slot frames -->
        <rect x="130" y="210" width="2140" height="1180" rx="30" fill="none" stroke="#10b981" stroke-width="12" />
        <rect x="130" y="1460" width="1030" height="1060" rx="30" fill="none" stroke="#8b5cf6" stroke-width="12" />
        <rect x="1240" y="1460" width="1030" height="1060" rx="30" fill="none" stroke="#ec4899" stroke-width="12" />

        <!-- Decorative banners and shapes -->
        <circle cx="120" cy="180" r="36" fill="#f59e0b" />
        <circle cx="2280" cy="180" r="36" fill="#ec4899" />
        <circle cx="1200" cy="1440" r="28" fill="#3b82f6" />
        
        <!-- Bottom Banner Plate -->
        <rect x="130" y="2580" width="2140" height="320" rx="30" fill="#fef3c7" stroke="#f59e0b" stroke-width="6" />
      </svg>
    `),
    photoSlots: [
      {
        id: 'slot-group',
        type: 'group',
        label: 'Foto Grupal',
        x: 5.83,
        y: 7.33,
        width: 88.33,
        height: 38.67,
        borderRadius: 24,
      },
      {
        id: 'slot-teacher',
        type: 'teacher',
        label: 'Con Maestra',
        x: 5.83,
        y: 49.0,
        width: 42.5,
        height: 35.0,
        borderRadius: 24,
      },
      {
        id: 'slot-individual',
        type: 'individual',
        label: 'Foto Individual',
        x: 51.67,
        y: 49.0,
        width: 42.5,
        height: 35.0,
        borderRadius: 24,
      },
    ],
    textSlots: [
      {
        id: 'txt-school',
        field: 'schoolName',
        label: 'Nombre de Escuela',
        x: 50,
        y: 4.0,
        fontSize: 54,
        fontFamily: 'Comic Sans MS, Quicksand, cursive, sans-serif',
        fontWeight: 'bold',
        color: '#1e3a8a',
        align: 'center',
        textTransform: 'none',
        shadow: false,
      },
      {
        id: 'txt-course',
        field: 'courseName',
        label: 'Curso / División',
        x: 30,
        y: 91.0,
        fontSize: 50,
        fontFamily: 'Quicksand, sans-serif',
        fontWeight: 'bold',
        color: '#b45309',
        align: 'center',
        textTransform: 'uppercase',
      },
      {
        id: 'txt-teacher',
        field: 'teacherName',
        label: 'Nombre de Maestra',
        x: 70,
        y: 91.0,
        fontSize: 46,
        fontFamily: 'Quicksand, sans-serif',
        fontWeight: '600',
        color: '#4c1d95',
        align: 'center',
      },
      {
        id: 'txt-year',
        field: 'year',
        label: 'Año Lectivo',
        x: 50,
        y: 96.0,
        fontSize: 38,
        fontFamily: 'Quicksand, sans-serif',
        fontWeight: 'bold',
        color: '#047857',
        align: 'center',
      },
      {
        id: 'txt-student',
        field: 'studentName',
        label: 'Nombre del Alumno',
        x: 72.9,
        y: 85.0,
        fontSize: 42,
        fontFamily: 'Quicksand, sans-serif',
        fontWeight: 'bold',
        color: '#be185d',
        align: 'center',
        textTransform: 'uppercase',
      },
    ],
  },
];

/**
 * Creates SVG Data URLs for cute sample realistic portraits and classroom photos
 */
function createSamplePhotoSvg(text: string, subtext: string, bgColor: string, accentColor: string, iconType: 'group' | 'teacher' | 'student'): string {
  const iconMarkup =
    iconType === 'group'
      ? `<g fill="${accentColor}">
           <circle cx="200" cy="140" r="45" opacity="0.9"/>
           <circle cx="300" cy="120" r="55"/>
           <circle cx="400" cy="140" r="45" opacity="0.9"/>
           <path d="M 120,280 C 120,210 280,210 280,280 Z" opacity="0.9"/>
           <path d="M 200,280 C 200,190 400,190 400,280 Z"/>
           <path d="M 320,280 C 320,210 480,210 480,280 Z" opacity="0.9"/>
         </g>`
      : iconType === 'teacher'
      ? `<g fill="${accentColor}">
           <circle cx="230" cy="130" r="50"/>
           <circle cx="370" cy="160" r="40"/>
           <path d="M 130,280 C 130,200 330,200 330,280 Z"/>
           <path d="M 290,280 C 290,220 450,220 450,280 Z" opacity="0.85"/>
         </g>`
      : `<g fill="${accentColor}">
           <circle cx="300" cy="135" r="60"/>
           <path d="M 180,280 C 180,200 420,200 420,280 Z"/>
         </g>`;

  const svg = `
    <svg width="600" height="450" viewBox="0 0 600 450" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${bgColor}"/>
          <stop offset="100%" stop-color="${bgColor}dd"/>
        </linearGradient>
      </defs>
      <rect width="600" height="450" fill="url(#bg)"/>
      <g transform="translate(0, 10)">
        ${iconMarkup}
      </g>
      <text x="300" y="340" font-family="system-ui, sans-serif" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle">${text}</text>
      <text x="300" y="385" font-family="system-ui, sans-serif" font-size="20" fill="#f8fafc" opacity="0.9" text-anchor="middle">${subtext}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Returns a rich pre-built Demo Project for testing immediately
 */
export function getDemoProject(): { courses: Course[]; activeTemplate: TemplateConfig } {
  const course1Students = [
    { name: 'Mateo Benítez', code: 'mateo_benitez' },
    { name: 'Sofía Rodríguez', code: 'sofia_rodriguez' },
    { name: 'Lucas Valenzuela', code: 'lucas_valenzuela' },
    { name: 'Valentina Morales', code: 'valentina_morales' },
    { name: 'Thiago Fernández', code: 'thiago_fernandez' },
  ];

  const course2Students = [
    { name: 'Emma Castro', code: 'emma_castro' },
    { name: 'Joaquín Navarro', code: 'joaquin_navarro' },
    { name: 'Camila Giménez', code: 'camila_gimenez' },
  ];

  const course1: Course = {
    id: 'course-5toa',
    code: '5toA',
    name: '5° Grado División "A"',
    schoolName: 'Instituto San Martín de Tours',
    teacherName: 'Prof. Marcela Gómez',
    year: '2026',
    groupPhoto: {
      id: 'demo-grp-5toa',
      fileName: '5toA_grupal.jpg',
      dataUrl: createSamplePhotoSvg('FOTO GRUPAL 5° "A"', 'Promoción 2026 • 24 Alumnos', '#1e3a8a', '#93c5fd', 'group'),
      uploadDate: Date.now(),
    },
    students: course1Students.map((s, idx) => ({
      id: `stu-5toa-${idx + 1}`,
      name: s.name,
      normalizedName: s.code,
      courseId: 'course-5toa',
      individualPhoto: {
        id: `demo-ind-${s.code}`,
        fileName: `5toA_${s.code}_individual.jpg`,
        dataUrl: createSamplePhotoSvg(s.name.toUpperCase(), 'Retrato Escolar Individual', idx % 2 === 0 ? '#047857' : '#0369a1', '#a7f3d0', 'student'),
        uploadDate: Date.now(),
      },
      teacherPhoto: {
        id: `demo-tch-${s.code}`,
        fileName: `5toA_${s.code}_maestra.jpg`,
        dataUrl: createSamplePhotoSvg(`${s.name} y Prof. Marcela`, 'Recuerdo con Maestra', idx % 2 === 0 ? '#6d28d9' : '#b45309', '#fde68a', 'teacher'),
        uploadDate: Date.now(),
      },
    })),
  };

  const course2: Course = {
    id: 'course-sala-roja',
    code: 'sala_roja',
    name: 'Sala Roja (Turno Mañana)',
    schoolName: 'Jardín de Infantes Los Pinitos',
    teacherName: 'Seño Carolina & Seño Julieta',
    year: '2026',
    groupPhoto: {
      id: 'demo-grp-sala-roja',
      fileName: 'sala_roja_grupal.jpg',
      dataUrl: createSamplePhotoSvg('SALA ROJA 2026', 'Jardín Los Pinitos', '#be123c', '#fbcfe8', 'group'),
      uploadDate: Date.now(),
    },
    students: course2Students.map((s, idx) => ({
      id: `stu-sr-${idx + 1}`,
      name: s.name,
      normalizedName: s.code,
      courseId: 'course-sala-roja',
      individualPhoto: {
        id: `demo-ind-sr-${s.code}`,
        fileName: `sala_roja_${s.code}_individual.jpg`,
        dataUrl: createSamplePhotoSvg(s.name.toUpperCase(), 'Retrato Individual', '#c2410c', '#fed7aa', 'student'),
        uploadDate: Date.now(),
      },
      teacherPhoto: {
        id: `demo-tch-sr-${s.code}`,
        fileName: `sala_roja_${s.code}_maestra.jpg`,
        dataUrl: createSamplePhotoSvg(`${s.name} con las Seños`, 'Recuerdo con Docentes', '#4338ca', '#c7d2fe', 'teacher'),
        uploadDate: Date.now(),
      },
    })),
  };

  return {
    courses: [course1, course2],
    activeTemplate: PRESET_TEMPLATES[0],
  };
}
