import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { LEGACY_USER_DATA_DIRECTORY } from './identity';
import { partitionFor } from './model';

const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));

describe('rebrand compatibility', () => {
  it('retains storage and installer identifiers while changing the public name', () => {
    expect(pkg.name).toBe('xnarabi');
    expect(pkg.build.productName).toBe('Xnarabi');
    expect(pkg.build.appId).toBe('local.xmultiworkspace.app');
    expect(LEGACY_USER_DATA_DIRECTORY).toBe('x-multi-workspace');
    expect(partitionFor('00000000-0000-4000-8000-000000000001'))
      .toBe('persist:xmw-00000000-0000-4000-8000-000000000001');
  });
});
