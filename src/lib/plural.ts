/** Returns `singular` when count is 1, otherwise `plural`. */
export function pluralize(
  count: number,
  singular: string,
  plural: string,
): string {
  return count === 1 ? singular : plural;
}
