/**
 * Where the site is published. Set at build time:
 *   NEXT_PUBLIC_SITE_URL   origin, e.g. https://example.org (needed for absolute URLs in metadata)
 *   NEXT_PUBLIC_BASE_PATH  sub-path, e.g. /malla-utn-electrica (GitHub Pages project sites)
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export const SITE_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Base for relative URLs in metadata (`metadataBase`). */
export const SITE_URL = new URL(`${BASE_PATH}/`, SITE_ORIGIN);

export function subjectPath(id: string): string {
  return `/materias/${id}/`;
}

/** Absolute URL of a path inside the site. */
export function absoluteUrl(path: string): string {
  return new URL(path.replace(/^\//, ""), SITE_URL).toString();
}

/** Social preview image, generated from the map itself with `npm run og:image`. */
export const OG_IMAGE = { url: "/og.png", width: 1200, height: 630 };
