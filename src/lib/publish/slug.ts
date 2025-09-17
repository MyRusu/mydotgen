const SLUG_MAX_LENGTH = 80;

function removeDiacritics(value: string): string {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
}

export function createBaseSlug(source: string): string {
  const normalized = removeDiacritics(source.toLowerCase());
  const replaced = normalized.replace(/[^a-z0-9]+/g, '-');
  const trimmed = replaced.replace(/^-+|-+$/g, '');
  const sliced = trimmed.slice(0, SLUG_MAX_LENGTH).replace(/-+$/g, '');
  return sliced || 'art';
}

export function composeSlugWithSuffix(base: string, suffixIndex: number): string {
  if (suffixIndex === 1) return base;
  const suffix = `-${suffixIndex}`;
  const maxBaseLength = SLUG_MAX_LENGTH - suffix.length;
  const truncatedBase = base.slice(0, Math.max(1, maxBaseLength)).replace(/-+$/g, '');
  return `${truncatedBase}-${suffixIndex}`;
}

export { SLUG_MAX_LENGTH };
