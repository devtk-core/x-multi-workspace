export type UpdateStatus = 'available' | 'current' | 'unavailable';
export type UpdateCheck = { status: UpdateStatus; currentVersion: string; latestVersion?: string };

export function parseVersion(value: unknown): [number, number, number] | null {
  if (typeof value !== 'string' || !/^(?:v)?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value)) return null;
  const parts = value.replace(/^v/, '').split('.').map(Number);
  return parts.every(Number.isSafeInteger) ? parts as [number, number, number] : null;
}

export function compareVersions(a: string, b: string): number | null {
  const left = parseVersion(a);
  const right = parseVersion(b);
  if (!left || !right) return null;
  for (let i = 0; i < 3; i++) {
    if (left[i] !== right[i]) return Math.sign(left[i] - right[i]);
  }
  return 0;
}

export function updateFromRelease(payload: unknown, currentVersion: string): UpdateCheck {
  const tag = payload && typeof payload === 'object' && !Array.isArray(payload)
    ? (payload as Record<string, unknown>).tag_name : null;
  const comparison = compareVersions(tag as string, currentVersion);
  if (typeof tag !== 'string' || comparison === null) return { status: 'unavailable', currentVersion };
  return comparison > 0
    ? { status: 'available', currentVersion, latestVersion: tag.replace(/^v/, '') }
    : { status: 'current', currentVersion };
}
