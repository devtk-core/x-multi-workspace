import { describe, expect, it } from 'vitest';
import { isTrustedUiUrl, xNavigationDecision } from './security';

describe('trusted management UI', () => {
  const devUrl = 'http://127.0.0.1:5173/';
  const packagedUrl = 'file:///C:/Program%20Files/X%20Multi%20Workspace/resources/app.asar/dist/renderer/index.html';

  it('accepts only the exact development page', () => {
    expect(isTrustedUiUrl(devUrl, devUrl)).toBe(true);
    expect(isTrustedUiUrl('http://localhost:5173/', devUrl)).toBe(false);
    expect(isTrustedUiUrl('http://127.0.0.1:5174/', devUrl)).toBe(false);
    expect(isTrustedUiUrl('http://127.0.0.1:5173/other', devUrl)).toBe(false);
    expect(isTrustedUiUrl('http://127.0.0.1:5173/?next=https://evil.example', devUrl)).toBe(false);
  });

  it('accepts only the packaged management document', () => {
    expect(isTrustedUiUrl(packagedUrl, packagedUrl)).toBe(true);
    expect(isTrustedUiUrl('file:///C:/Program%20Files/X%20Multi%20Workspace/resources/app.asar/dist/renderer/other.html', packagedUrl)).toBe(false);
    expect(isTrustedUiUrl('https://x.com/home', packagedUrl)).toBe(false);
    expect(isTrustedUiUrl(packagedUrl + '#other', packagedUrl)).toBe(false);
  });
});

describe('X view navigation', () => {
  it('keeps X in its workspace and opens user-selected external HTTPS links outside', () => {
    expect(xNavigationDecision('https://x.com/home', true, false)).toBe('allow');
    expect(xNavigationDecision('https://example.com/article', true, false)).toBe('external');
  });

  it('blocks redirects and unsafe top-level destinations', () => {
    expect(xNavigationDecision('https://example.com/article', true, true)).toBe('block');
    expect(xNavigationDecision('file:///C:/Windows/system.ini', true, false)).toBe('block');
    expect(xNavigationDecision('javascript:alert(1)', true, false)).toBe('block');
  });

  it('allows third-party subframes needed by the official X website', () => {
    expect(xNavigationDecision('https://video.example/embed', false, false)).toBe('allow');
  });
});
