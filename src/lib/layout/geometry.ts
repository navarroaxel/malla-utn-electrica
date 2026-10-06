/**
 * Sizes and positions shared by the build-time layout and the browser. Kept apart from
 * layout.ts so client code never imports ELK (a 1.6 MB library only needed at build time).
 */

export const NODE_WIDTH = 210;
export const NODE_HEIGHT = 64;
export const COLUMN_GAP = 120;
export const ROW_GAP = 20;

export interface Position {
  x: number;
  y: number;
}
export type Layout = Record<string, Position>;

/** Left edge of the column for a level (levels start at 1). */
export function columnX(level: number): number {
  return (level - 1) * (NODE_WIDTH + COLUMN_GAP);
}
