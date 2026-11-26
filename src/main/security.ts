import { safeExternalUrl, safeXUrl } from '../shared/model';

export function isTrustedUiUrl(value: string, expected: string): boolean {
  try {
    const actual = new URL(value);
    return actual.href === expected && !actual.username && !actual.password && !actual.search && !actual.hash;
  } catch { return false; }
}

export type NavigationDecision = 'allow' | 'external' | 'block';
export function xNavigationDecision(url: string, isMainFrame: boolean, isRedirect: boolean): NavigationDecision {
  // X can embed third-party frames. They have no Node integration and stay under Chromium's web security.
  if (!isMainFrame) return 'allow';
  if (safeXUrl(url)) return 'allow';
  if (!isRedirect && safeExternalUrl(url)) return 'external';
  return 'block';
}
