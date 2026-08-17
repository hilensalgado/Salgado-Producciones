import { Course, ParsedFileInfo, PhotoSlotType, Student } from '../types';

/**
 * Normalizes text for robust matching (lowercase, no accents, alphanumeric + dashes/underscores)
 */
export function normalizeKey(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics / accents
    .replace(/[^a-z0-9]/g, '') // keep only lowercase letters and numbers
    .trim();
}

export function formatStudentDisplayName(rawName: string): string {
  if (!rawName) return '';
  // Replace underscores, hyphens with spaces and capitalize each word
  return rawName
    .replace(/[_-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export interface ParseResult {
  detectedCourseCode?: string;
  detectedStudentName?: string;
  detectedType?: PhotoSlotType;
  confidence: number;
}

/**
 * Parses filenames according to conventions:
 * - [curso]_grupal.jpg
 * - [curso]_[alumno]_individual.jpg
 * - [curso]_[alumno]_maestra.jpg (also supports docente, profesora, seño, maestro)
 */
export function parsePhotoFileName(fileName: string): ParseResult {
  // Strip extension
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
  const cleanName = nameWithoutExt.trim();

  // Normalize lower
  const lower = cleanName.toLowerCase();

  // Check for group photo pattern:
  // e.g. "5toa_grupal", "sala_roja_grupal", "1b-grupal", "grupal_5toa", "5toa_grupo", "curso_5toa_grupal"
  if (
    lower.endsWith('_grupal') ||
    lower.endsWith('-grupal') ||
    lower.endsWith('_grupo') ||
    lower.endsWith('-grupo') ||
    lower.includes('_grupal_') ||
    lower.includes('-grupal-')
  ) {
    const coursePart = cleanName
      .replace(/[-_]grupal.*$/i, '')
      .replace(/[-_]grupo.*$/i, '')
      .replace(/^grupal[-_]/i, '')
      .replace(/^grupo[-_]/i, '');

    return {
      detectedCourseCode: coursePart || cleanName,
      detectedStudentName: undefined,
      detectedType: 'group',
      confidence: 0.95,
    };
  }

  // Also check if filename is literally just "grupal.jpg" or "grupo.jpg"
  if (lower === 'grupal' || lower === 'grupo') {
    return {
      detectedType: 'group',
      confidence: 0.6,
    };
  }

  // Check for teacher photo patterns:
  // e.g. "5toa_lucas_perez_maestra", "1A_maria_gomez_docente", "sala_azul_juan_profesora", "5to_seño_lucas"
  const teacherKeywords = ['_maestra', '-maestra', '_maestro', '-maestro', '_docente', '-docente', '_profesora', '-profesora', '_profesor', '-profesor', '_seno', '-seno', '_seño', '-seño', '_con_maestra', '-con-maestra'];
  
  for (const kw of teacherKeywords) {
    if (lower.includes(kw)) {
      // Find the keyword index in original string
      const kwIdx = lower.indexOf(kw);
      const beforeKw = cleanName.substring(0, kwIdx);
      const parts = beforeKw.split(/[-_]/).filter(Boolean);

      if (parts.length >= 2) {
        const coursePart = parts[0];
        const studentPart = parts.slice(1).join(' ');
        return {
          detectedCourseCode: coursePart,
          detectedStudentName: formatStudentDisplayName(studentPart),
          detectedType: 'teacher',
          confidence: 0.95,
        };
      } else if (parts.length === 1) {
        return {
          detectedCourseCode: parts[0],
          detectedStudentName: undefined,
          detectedType: 'teacher',
          confidence: 0.7,
        };
      }
    }
  }

  // Check for individual photo pattern:
  // e.g. "5toa_lucas_perez_individual", "1B_sofia_martinez_indiv", "sala_roja_pedro_individual"
  const individualKeywords = ['_individual', '-individual', '_indiv', '-indiv', '_solo', '-solo', '_sola', '-sola', '_retrato', '-retrato'];
  
  for (const kw of individualKeywords) {
    if (lower.includes(kw)) {
      const kwIdx = lower.indexOf(kw);
      const beforeKw = cleanName.substring(0, kwIdx);
      const parts = beforeKw.split(/[-_]/).filter(Boolean);

      if (parts.length >= 2) {
        const coursePart = parts[0];
        const studentPart = parts.slice(1).join(' ');
        return {
          detectedCourseCode: coursePart,
          detectedStudentName: formatStudentDisplayName(studentPart),
          detectedType: 'individual',
          confidence: 0.95,
        };
      } else if (parts.length === 1) {
        return {
          detectedCourseCode: parts[0],
          detectedStudentName: undefined,
          detectedType: 'individual',
          confidence: 0.7,
        };
      }
    }
  }

  // Fallback pattern matching:
  // If format is [curso]_[alumno] or [curso]_[tipo]_[alumno]
  const parts = cleanName.split(/[-_]/).filter(Boolean);
  if (parts.length >= 2) {
    const first = parts[0].toLowerCase();
    const last = parts[parts.length - 1].toLowerCase();

    if (first === 'grupal' || first === 'grupo') {
      return {
        detectedCourseCode: parts.slice(1).join('-'),
        detectedType: 'group',
        confidence: 0.8,
      };
    }

    if (last === 'grupal' || last === 'grupo') {
      return {
        detectedCourseCode: parts.slice(0, -1).join('-'),
        detectedType: 'group',
        confidence: 0.85,
      };
    }

    // If 3 parts, e.g. "5A_Juan_Gomez" -> default to individual if not specified
    const coursePart = parts[0];
    const studentPart = parts.slice(1).join(' ');
    return {
      detectedCourseCode: coursePart,
      detectedStudentName: formatStudentDisplayName(studentPart),
      detectedType: 'individual',
      confidence: 0.6,
    };
  }

  return {
    confidence: 0.2,
  };
}

/**
 * Match parsed files against existing courses and students
 */
export function matchParsedFilesToCourses(
  parsedFiles: ParsedFileInfo[],
  courses: Course[]
): {
  matchedFiles: ParsedFileInfo[];
  updatedCourses: Course[];
  unmatchedCount: number;
} {
  const updatedCourses = JSON.parse(JSON.stringify(courses)) as Course[];
  const matchedFiles: ParsedFileInfo[] = [];
  let unmatchedCount = 0;

  for (const item of parsedFiles) {
    const parse = parsePhotoFileName(item.fileName);
    const updatedItem: ParsedFileInfo = {
      ...item,
      detectedCourseCode: parse.detectedCourseCode,
      detectedStudentName: parse.detectedStudentName,
      detectedType: parse.detectedType,
      matchStatus: 'unmatched',
    };

    if (!parse.detectedCourseCode && !parse.detectedType) {
      updatedItem.matchStatus = 'unmatched';
      updatedItem.matchReason = 'No se pudo detectar curso ni tipo de foto en el nombre del archivo.';
      matchedFiles.push(updatedItem);
      unmatchedCount++;
      continue;
    }

    // Try finding course
    const normCourseCode = normalizeKey(parse.detectedCourseCode || '');
    let matchedCourse = updatedCourses.find(c => {
      const cCodeNorm = normalizeKey(c.code);
      const cNameNorm = normalizeKey(c.name);
      return (
        normCourseCode === cCodeNorm ||
        (normCourseCode.length > 1 && cCodeNorm.includes(normCourseCode)) ||
        (cCodeNorm.length > 1 && normCourseCode.includes(cCodeNorm)) ||
        normCourseCode === cNameNorm
      );
    });

    // If no course exists but course code was detected, we can auto-create the course if there are none or user wants
    if (!matchedCourse && parse.detectedCourseCode) {
      // If there's only 1 course in project, match to it if confidence is reasonable
      if (updatedCourses.length === 1) {
        matchedCourse = updatedCourses[0];
      }
    }

    if (!matchedCourse) {
      updatedItem.matchStatus = 'unmatched';
      updatedItem.matchReason = `Curso "${parse.detectedCourseCode || 'desconocido'}" no encontrado en la lista de cursos.`;
      matchedFiles.push(updatedItem);
      unmatchedCount++;
      continue;
    }

    updatedItem.matchedCourseId = matchedCourse.id;

    // Handle Group photo
    if (parse.detectedType === 'group') {
      matchedCourse.groupPhoto = {
        id: item.id,
        file: item.file,
        dataUrl: item.dataUrl,
        fileName: item.fileName,
        fileSize: item.fileSize,
        uploadDate: Date.now(),
      };
      updatedItem.matchStatus = 'matched';
      updatedItem.matchReason = `Asignada como foto grupal del curso ${matchedCourse.name} (${matchedCourse.code})`;
      matchedFiles.push(updatedItem);
      continue;
    }

    // Handle Student photo (individual or teacher)
    if (parse.detectedStudentName && (parse.detectedType === 'individual' || parse.detectedType === 'teacher')) {
      const normStudentName = normalizeKey(parse.detectedStudentName);
      
      // Find student in course
      let student = matchedCourse.students.find(s => {
        const sNorm = normalizeKey(s.name);
        return sNorm === normStudentName || sNorm.includes(normStudentName) || normStudentName.includes(sNorm);
      });

      // If student not found in roster, auto-add student to this course
      if (!student) {
        const newStudent: Student = {
          id: `stu-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          name: parse.detectedStudentName,
          normalizedName: normStudentName,
          courseId: matchedCourse.id,
        };
        matchedCourse.students.push(newStudent);
        student = newStudent;
      }

      updatedItem.matchedStudentId = student.id;

      if (parse.detectedType === 'individual') {
        student.individualPhoto = {
          id: item.id,
          file: item.file,
          dataUrl: item.dataUrl,
          fileName: item.fileName,
          fileSize: item.fileSize,
          uploadDate: Date.now(),
        };
        updatedItem.matchStatus = 'matched';
        updatedItem.matchReason = `Asignada como foto individual de "${student.name}" en ${matchedCourse.name}`;
      } else if (parse.detectedType === 'teacher') {
        student.teacherPhoto = {
          id: item.id,
          file: item.file,
          dataUrl: item.dataUrl,
          fileName: item.fileName,
          fileSize: item.fileSize,
          uploadDate: Date.now(),
        };
        updatedItem.matchStatus = 'matched';
        updatedItem.matchReason = `Asignada como foto con maestra de "${student.name}" en ${matchedCourse.name}`;
      }

      matchedFiles.push(updatedItem);
      continue;
    }

    // If reached here
    updatedItem.matchStatus = 'ambiguous';
    updatedItem.matchReason = 'Archivo detectado parcialmente pero falta identificar el alumno o tipo.';
    matchedFiles.push(updatedItem);
    unmatchedCount++;
  }

  return { matchedFiles, updatedCourses, unmatchedCount };
}
