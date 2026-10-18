export interface ProductTypeItem {
  id: string;
  label: string;
  isCustom?: boolean;
}

export const INITIAL_PRODUCT_TYPES: ProductTypeItem[] = [
  { id: 'ichki', label: "Ichki ta'mir" },
  { id: 'tashqi', label: "Tashqi ta'mir" },
  { id: 'sement', label: "Sement" },
  { id: 'kardon', label: "Kardon" },
  { id: 'gisht', label: "G‘isht" },
  { id: 'ishchi_kuchi', label: "Ishchi kuchi" },
  { id: 'asbob_uskunalar', label: "Asbob-uskunalar" },
  { id: 'texnika_ijarasi', label: "Texnik Asbob-uskunalar ijarasi" },
];

const STORAGE_KEY = 'bunkerstroy_product_types';

function sanitizeTypes(types: ProductTypeItem[]): ProductTypeItem[] {
  // Map of unique lower-cased labels
  const seen = new Set<string>();
  const result: ProductTypeItem[] = [];

  for (const item of types) {
    const trimmed = item.label.trim();
    if (!trimmed || trimmed.length < 2) continue;
    const lower = trimmed.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);
    result.push({
      ...item,
      label: trimmed,
    });
  }

  // Ensure standard default types are included if missing
  for (const def of INITIAL_PRODUCT_TYPES) {
    if (!seen.has(def.label.toLowerCase())) {
      seen.add(def.label.toLowerCase());
      result.push(def);
    }
  }

  return result;
}

export function getProductTypes(): ProductTypeItem[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return INITIAL_PRODUCT_TYPES;
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return sanitizeTypes(parsed);
    }
    return INITIAL_PRODUCT_TYPES;
  } catch {
    return INITIAL_PRODUCT_TYPES;
  }
}

export function saveProductTypes(types: ProductTypeItem[]) {
  try {
    const sanitized = sanitizeTypes(types);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    window.dispatchEvent(new CustomEvent('bunkerstroy_product_types_updated', { detail: sanitized }));
  } catch (e) {
    console.error('Failed to save product types:', e);
  }
}

export function addProductType(newLabel: string): ProductTypeItem[] {
  const trimmed = newLabel.trim();
  if (!trimmed || trimmed.length < 2) return getProductTypes();

  const current = getProductTypes();
  const exists = current.some(
    (t) => t.label.toLowerCase() === trimmed.toLowerCase() || t.id.toLowerCase() === trimmed.toLowerCase()
  );

  if (exists) {
    return current;
  }

  // Remove partial prefix fragments if user typed step-by-step
  const filtered = current.filter((t) => {
    if (t.isCustom && t.label.length < trimmed.length && trimmed.toLowerCase().startsWith(t.label.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Generate an ID for the new type
  const slug = trimmed
    .toLowerCase()
    .replace(/[^a-z0-9а-яёўқғҳ]+/gi, '_')
    .replace(/^_+|_+$/g, '');

  const newItem: ProductTypeItem = {
    id: slug || `type_${Date.now()}`,
    label: trimmed,
    isCustom: true,
  };

  const updated = [...filtered, newItem];
  saveProductTypes(updated);
  return updated;
}
