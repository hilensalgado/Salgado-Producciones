import { TemplateConfig } from '../types';
import { PRESET_TEMPLATES } from './presets';

export const STORAGE_KEY_SAVED_TEMPLATES = 'anuario_saved_custom_templates_v1';
export const STORAGE_KEY_DEFAULT_TEMPLATE = 'anuario_default_template_v1';

/**
 * Gets all saved templates from LocalStorage, combined with built-in presets
 */
export function getSavedTemplates(): TemplateConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SAVED_TEMPLATES);
    if (raw) {
      const parsed: TemplateConfig[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading saved templates from localStorage:', e);
  }
  return [];
}

/**
 * Saves a template to the user's custom templates library
 */
export function saveCustomTemplate(template: TemplateConfig): TemplateConfig[] {
  const existing = getSavedTemplates();
  const index = existing.findIndex((t) => t.id === template.id);

  let updated: TemplateConfig[];
  if (index >= 0) {
    updated = existing.map((t) => (t.id === template.id ? template : t));
  } else {
    updated = [template, ...existing];
  }

  try {
    localStorage.setItem(STORAGE_KEY_SAVED_TEMPLATES, JSON.stringify(updated));
  } catch (e) {
    console.warn('LocalStorage limit reached when saving custom templates:', e);
  }

  return updated;
}

/**
 * Deletes a template from the user's custom templates library
 */
export function deleteCustomTemplate(templateId: string): TemplateConfig[] {
  const existing = getSavedTemplates();
  const updated = existing.filter((t) => t.id !== templateId);

  try {
    localStorage.setItem(STORAGE_KEY_SAVED_TEMPLATES, JSON.stringify(updated));
  } catch (e) {
    console.warn('LocalStorage error deleting template:', e);
  }

  return updated;
}

/**
 * Sets a template as the default reusable template for all future batches
 */
export function setDefaultTemplate(template: TemplateConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_DEFAULT_TEMPLATE, JSON.stringify(template));
  } catch (e) {
    console.warn('LocalStorage error setting default template:', e);
  }
}

/**
 * Gets the default template if configured, or falls back to the first preset
 */
export function getDefaultTemplate(): TemplateConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DEFAULT_TEMPLATE);
    if (raw) {
      const parsed: TemplateConfig = JSON.parse(raw);
      if (parsed && parsed.photoSlots && parsed.textSlots) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error loading default template:', e);
  }
  return PRESET_TEMPLATES[0];
}

/**
 * Exports a template configuration as a JSON file download
 */
export function exportTemplateToJson(template: TemplateConfig): void {
  const jsonStr = JSON.stringify(template, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  const safeName = template.name.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  a.download = `plantilla_posiciones_${safeName}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Imports a template configuration from a JSON file
 */
export async function importTemplateFromJson(file: File): Promise<TemplateConfig> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as TemplateConfig;
        if (!parsed.photoSlots || !parsed.textSlots) {
          throw new Error('El archivo JSON no contiene la estructura válida de una plantilla.');
        }
        // Ensure unique ID if imported
        const imported: TemplateConfig = {
          ...parsed,
          id: `custom-imported-${Date.now()}`,
          name: `${parsed.name} (Importada)`,
          isPreset: false,
        };
        resolve(imported);
      } catch (err) {
        reject(new Error(`Error al leer archivo JSON: ${err}`));
      }
    };
    reader.onerror = () => reject(new Error('Error al abrir el archivo.'));
    reader.readAsText(file);
  });
}
