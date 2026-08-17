export type PhotoSlotType = 'group' | 'teacher' | 'individual';

export interface PhotoSlot {
  id: string;
  type: PhotoSlotType;
  label: string;
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  width: number; // percentage 0 - 100
  height: number; // percentage 0 - 100
  borderRadius?: number; // px
  rotation?: number; // degrees
  borderWidth?: number;
  borderColor?: string;
  shadow?: boolean;
}

export type TextFieldType = 'schoolName' | 'courseName' | 'teacherName' | 'studentName' | 'year' | 'custom';

export interface TextSlot {
  id: string;
  field: TextFieldType;
  label: string;
  customText?: string;
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  fontSize: number; // pt/px relative to 3000px height (e.g. 48)
  fontFamily: string;
  fontWeight: 'normal' | '500' | '600' | 'bold' | '800';
  color: string;
  align: 'left' | 'center' | 'right';
  textTransform?: 'none' | 'uppercase' | 'capitalize';
  letterSpacing?: number;
  shadow?: boolean;
  shadowColor?: string;
}

export interface TemplateConfig {
  id: string;
  name: string;
  width: number; // e.g. 2400
  height: number; // e.g. 3000
  pngUrl: string | null; // DataURL or Image URL of the frame
  templateLayer: 'foreground' | 'background'; // 'foreground': frame with transparent holes sits ON TOP of photos; 'background': frame behind photos
  backgroundColor: string;
  photoSlots: PhotoSlot[];
  textSlots: TextSlot[];
  isPreset?: boolean;
  description?: string;
}

export interface PhotoCropAdjustment {
  zoom: number; // 1.0 is default cover
  offsetX: number; // percentage offset -50 to +50
  offsetY: number; // percentage offset -50 to +50
  rotation?: number; // 0, 90, 180, 270
}

export interface PhotoFileEntry {
  id: string;
  file?: File;
  dataUrl: string;
  fileName: string;
  fileSize?: number;
  uploadDate: number;
}

export interface Student {
  id: string;
  name: string;
  normalizedName: string;
  courseId: string;
  individualPhoto?: PhotoFileEntry;
  teacherPhoto?: PhotoFileEntry;
  individualAdjustment?: PhotoCropAdjustment;
  teacherAdjustment?: PhotoCropAdjustment;
}

export interface Course {
  id: string;
  code: string; // e.g., "5toA", "sala-amarilla", "primer-grado"
  name: string; // e.g., "5° Grado 'A'"
  schoolName: string; // e.g., "Escuela Normal N° 1"
  teacherName: string; // e.g., "Prof. Mariana López"
  year: string; // e.g., "2026"
  groupPhoto?: PhotoFileEntry;
  groupAdjustment?: PhotoCropAdjustment;
  students: Student[];
  templateId?: string; // specific template or fallback to active template
}

export interface ParsedFileInfo {
  id: string;
  file: File;
  dataUrl: string;
  fileName: string;
  fileSize: number;
  detectedCourseCode?: string;
  detectedStudentName?: string;
  detectedType?: PhotoSlotType;
  matchStatus: 'matched' | 'unmatched' | 'ambiguous';
  matchedCourseId?: string;
  matchedStudentId?: string;
  matchReason?: string;
}

export interface BatchRenderOptions {
  format: 'image/jpeg' | 'image/png';
  quality: number; // 0.8 to 1.0
  resolutionScale: number; // 0.5 (fast preview), 1.0 (standard 2400x3000), 1.5 (ultra 300 DPI print)
  fileNamePattern: string; // e.g. "{curso}_{alumno}_anuario"
  zipByCourse: boolean;
}

export interface AuditReport {
  totalCourses: number;
  totalStudents: number;
  readyStudents: number;
  missingGroupCount: number;
  missingIndividualCount: number;
  missingTeacherCount: number;
  unassignedFilesCount: number;
  coursesStatus: {
    courseId: string;
    courseName: string;
    courseCode: string;
    hasGroupPhoto: boolean;
    totalStudents: number;
    completedStudents: number;
    missingIndividual: string[]; // student names
    missingTeacher: string[]; // student names
  }[];
}
