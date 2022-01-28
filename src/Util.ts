/**
 * Unifies usage between absolute and URI style paths.
 */
export function asPath(str: string): string;
export function asPath(str?: string): string | undefined;
export function asPath(str?: string) {
  if (str == null || !str.startsWith('file://')) {
    return str;
  }
  return str.substring(7);
}
