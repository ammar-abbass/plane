const WORKSPACE_SLUG_REGEX = /^[a-z0-9-]+$/;
const MAX_SLUG_LENGTH = 48;

export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, MAX_SLUG_LENGTH);

  return base;
}

export function isValidSlug(slug: string): boolean {
  return WORKSPACE_SLUG_REGEX.test(slug) && slug.length > 0 && slug.length <= MAX_SLUG_LENGTH;
}
