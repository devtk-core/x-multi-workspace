import { describe, expect, it } from 'vitest';
import { compareVersions, parseVersion, updateFromRelease } from './updates';

describe('manual update check', () => {
  it('compares stable release versions numerically', () => {
    expect(compareVersions('v1.10.0', '1.9.9')).toBe(1);
    expect(compareVersions('v1.1.3', '1.1.3')).toBe(0);
    expect(compareVersions('1.1.2', '1.1.3')).toBe(-1);
  });
  it('rejects malformed or prerelease tags', () => {
    expect(parseVersion('v1.2.3-rc.1')).toBeNull();
    expect(parseVersion('v1.2.3/other')).toBeNull();
    expect(parseVersion('v1.02.3')).toBeNull();
    expect(parseVersion('v99999999999999999999.1.0')).toBeNull();
  });
  it('uses only a valid release tag from the remote response', () => {
    expect(updateFromRelease({ tag_name: 'v1.2.0', html_url: 'https://evil.example' }, '1.1.3'))
      .toEqual({ status: 'available', currentVersion: '1.1.3', latestVersion: '1.2.0' });
    expect(updateFromRelease({ tag_name: 'v1.1.3' }, '1.1.3').status).toBe('current');
    expect(updateFromRelease({ tag_name: 'bad' }, '1.1.3').status).toBe('unavailable');
    expect(updateFromRelease(null, '1.1.3').status).toBe('unavailable');
  });
});
