import { Course, Student, TemplateConfig, PhotoCropAdjustment } from '../types';

interface RenderOptions {
  scale?: number; // 1.0 = native template size (e.g. 2400x3000), 0.3 = fast preview
  customWidth?: number;
  customHeight?: number;
  format?: 'image/jpeg' | 'image/png';
  quality?: number; // 0.95
}

// Image cache to avoid re-decoding image elements during batch rendering
const imageElementCache = new Map<string, HTMLImageElement>();

export async function loadImage(src: string): Promise<HTMLImageElement> {
  if (imageElementCache.has(src)) {
    return imageElementCache.get(src)!;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageElementCache.set(src, img);
      resolve(img);
    };
    img.onerror = (err) => {
      reject(new Error(`No se pudo cargar la imagen: ${err}`));
    };
    img.src = src;
  });
}

/**
 * Helper to draw an image covering a target rectangle with zoom and pan offsets
 */
function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dWidth: number,
  dHeight: number,
  adjustment?: PhotoCropAdjustment,
  borderRadius?: number
) {
  ctx.save();

  // Apply rounded corners clipping if requested
  if (borderRadius && borderRadius > 0) {
    ctx.beginPath();
    ctx.roundRect(dx, dy, dWidth, dHeight, borderRadius);
    ctx.clip();
  } else {
    ctx.beginPath();
    ctx.rect(dx, dy, dWidth, dHeight);
    ctx.clip();
  }

  const zoom = adjustment?.zoom || 1.0;
  const offsetXPercent = adjustment?.offsetX || 0; // -50 to +50 %
  const offsetYPercent = adjustment?.offsetY || 0; // -50 to +50 %

  const imgRatio = img.width / img.height;
  const targetRatio = dWidth / dHeight;

  let sWidth: number;
  let sHeight: number;
  let sX: number;
  let sY: number;

  if (imgRatio > targetRatio) {
    // Image is wider than target: fit height, crop width
    sHeight = img.height / zoom;
    sWidth = (img.height * targetRatio) / zoom;
  } else {
    // Image is taller than target: fit width, crop height
    sWidth = img.width / zoom;
    sHeight = (img.width / targetRatio) / zoom;
  }

  // Base centered crop coordinates
  const maxSX = Math.max(0, img.width - sWidth);
  const maxSY = Math.max(0, img.height - sHeight);

  // Center offset
  const baseSX = (img.width - sWidth) / 2;
  const baseSY = (img.height - sHeight) / 2;

  // Add pan offsets
  sX = baseSX - (offsetXPercent / 100) * maxSX;
  sY = baseSY - (offsetYPercent / 100) * maxSY;

  // Clamp within image bounds
  sX = Math.max(0, Math.min(sX, img.width - sWidth));
  sY = Math.max(0, Math.min(sY, img.height - sHeight));

  ctx.drawImage(img, sX, sY, sWidth, sHeight, dx, dy, dWidth, dHeight);

  ctx.restore();
}

/**
 * Draws text replacement with responsive styling, alignments, and optional drop shadow
 */
function drawTextSlot(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number,
  fontSize: number,
  fontFamily: string,
  fontWeight: string,
  color: string,
  align: 'left' | 'center' | 'right',
  textTransform?: 'none' | 'uppercase' | 'capitalize',
  shadow?: boolean,
  shadowColor?: string
) {
  if (!text) return;

  let processedText = text;
  if (textTransform === 'uppercase') {
    processedText = text.toUpperCase();
  } else if (textTransform === 'capitalize') {
    processedText = text
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  ctx.save();
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}, system-ui, -apple-system, sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';

  if (shadow) {
    ctx.shadowColor = shadowColor || 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = Math.max(4, fontSize * 0.12);
    ctx.shadowOffsetX = fontSize * 0.04;
    ctx.shadowOffsetY = fontSize * 0.05;
  }

  ctx.fillText(processedText, x, y);
  ctx.restore();
}

/**
 * Renders a complete student composite yearbook photo to an HTML Canvas
 */
export async function renderStudentToCanvas(
  canvas: HTMLCanvasElement,
  student: Student,
  course: Course,
  template: TemplateConfig,
  options: RenderOptions = {}
): Promise<void> {
  const scale = options.scale || 1.0;
  const width = options.customWidth || Math.round(template.width * scale);
  const height = options.customHeight || Math.round(template.height * scale);
  const effectiveScale = options.customWidth ? options.customWidth / template.width : scale;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('No se pudo inicializar el contexto 2D del Canvas');

  // Ensure maximum interpolation quality for photographic printing (300 DPI)
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Background color
  ctx.fillStyle = template.backgroundColor || '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // Load photos asynchronously
  const groupPhotoPromise = course.groupPhoto?.dataUrl ? loadImage(course.groupPhoto.dataUrl) : null;
  const teacherPhotoPromise = student.teacherPhoto?.dataUrl ? loadImage(student.teacherPhoto.dataUrl) : null;
  const individualPhotoPromise = student.individualPhoto?.dataUrl ? loadImage(student.individualPhoto.dataUrl) : null;
  const framePromise = template.pngUrl ? loadImage(template.pngUrl) : null;

  const [groupImg, teacherImg, individualImg, frameImg] = await Promise.all([
    groupPhotoPromise,
    teacherPhotoPromise,
    individualPhotoPromise,
    framePromise,
  ]);

  // If background template layer, draw frame first
  if (template.templateLayer === 'background' && frameImg) {
    ctx.drawImage(frameImg, 0, 0, width, height);
  }

  // Draw Photo Slots
  for (const slot of template.photoSlots) {
    const slotX = (slot.x / 100) * width;
    const slotY = (slot.y / 100) * height;
    const slotW = (slot.width / 100) * width;
    const slotH = (slot.height / 100) * height;
    const slotRadius = (slot.borderRadius || 0) * effectiveScale;

    let targetImg: HTMLImageElement | null = null;
    let adjustment: PhotoCropAdjustment | undefined;

    if (slot.type === 'group') {
      targetImg = groupImg;
      adjustment = course.groupAdjustment;
    } else if (slot.type === 'teacher') {
      targetImg = teacherImg;
      adjustment = student.teacherAdjustment;
    } else if (slot.type === 'individual') {
      targetImg = individualImg;
      adjustment = student.individualAdjustment;
    }

    if (targetImg) {
      drawCoverImage(ctx, targetImg, slotX, slotY, slotW, slotH, adjustment, slotRadius);
    } else {
      // Draw placeholder if photo is missing
      ctx.save();
      ctx.fillStyle = '#f1f5f9';
      if (slotRadius > 0) {
        ctx.beginPath();
        ctx.roundRect(slotX, slotY, slotW, slotH, slotRadius);
        ctx.fill();
      } else {
        ctx.fillRect(slotX, slotY, slotW, slotH);
      }

      // Slot outline & label
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2 * effectiveScale;
      ctx.strokeRect(slotX, slotY, slotW, slotH);

      ctx.fillStyle = '#94a3b8';
      ctx.font = `600 ${Math.max(14, 24 * effectiveScale)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(slot.label || `[${slot.type}]`, slotX + slotW / 2, slotY + slotH / 2);
      ctx.restore();
    }
  }

  // If foreground template layer, draw frame ON TOP of photos (photos shine through transparent windows)
  if (template.templateLayer === 'foreground' && frameImg) {
    ctx.drawImage(frameImg, 0, 0, width, height);
  }

  // Draw Text Slots
  for (const textSlot of template.textSlots) {
    let rawText = '';
    switch (textSlot.field) {
      case 'schoolName':
        rawText = course.schoolName || '';
        break;
      case 'courseName':
        rawText = course.name || '';
        break;
      case 'teacherName':
        rawText = course.teacherName || '';
        break;
      case 'studentName':
        rawText = student.name || '';
        break;
      case 'year':
        rawText = course.year || '';
        break;
      case 'custom':
        rawText = textSlot.customText || '';
        break;
    }

    const textX = (textSlot.x / 100) * width;
    const textY = (textSlot.y / 100) * height;
    const textFontSize = textSlot.fontSize * effectiveScale;

    drawTextSlot(
      ctx,
      rawText,
      textX,
      textY,
      width,
      textFontSize,
      textSlot.fontFamily,
      textSlot.fontWeight,
      textSlot.color,
      textSlot.align,
      textSlot.textTransform,
      textSlot.shadow,
      textSlot.shadowColor
    );
  }
}

/**
 * Generates Blob or DataUrl for a student render
 */
export async function renderStudentToBlob(
  student: Student,
  course: Course,
  template: TemplateConfig,
  options: RenderOptions = {}
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  await renderStudentToCanvas(canvas, student, course, template, options);

  const format = options.format || 'image/jpeg';
  const quality = options.quality !== undefined ? options.quality : 0.96;

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Fallo al generar Blob de imagen'));
      },
      format,
      quality
    );
  });
}

export async function renderStudentToDataUrl(
  student: Student,
  course: Course,
  template: TemplateConfig,
  options: RenderOptions = {}
): Promise<string> {
  const canvas = document.createElement('canvas');
  await renderStudentToCanvas(canvas, student, course, template, options);
  const format = options.format || 'image/jpeg';
  const quality = options.quality !== undefined ? options.quality : 0.95;
  return canvas.toDataURL(format, quality);
}
