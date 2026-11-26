const { spawnSync } = require('node:child_process');
const { mkdtempSync, realpathSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { dirname, join, relative } = require('node:path');

const ids = [
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000002'
];

async function probe(phase, profile) {
  const { app, session } = require('electron');
  const { partitionFor } = require('../dist/main/shared/model.js');
  app.setPath('userData', profile);
  try {
    await app.whenReady();
    const first = session.fromPartition(partitionFor(ids[0]));
    const second = session.fromPartition(partitionFor(ids[1]));
    const read = ses => ses.cookies.get({ url: 'https://x.com/', name: 'xmw_probe' });
    if (phase === 'seed') {
      await first.cookies.set({ url: 'https://x.com/', name: 'xmw_probe', value: 'first', expirationDate: Math.floor(Date.now() / 1000) + 3600 });
      await first.flushStorageData();
      if ((await read(first)).length !== 1 || (await read(second)).length !== 0) throw new Error('Partitions were not isolated');
    } else if (phase === 'verify') {
      const cookies = await read(first);
      if (cookies.length !== 1 || cookies[0].value !== 'first' || (await read(second)).length !== 0) throw new Error('Persistent partition was not restored');
      await first.clearData();
      await first.clearCache();
      await first.flushStorageData();
      if ((await read(first)).length !== 0) throw new Error('Session data was not cleared');
    } else {
      throw new Error('Unknown test phase');
    }
    app.exit(0);
  } catch (error) {
    process.stderr.write(String(error) + '\n');
    app.exit(1);
  }
}

if (process.versions.electron) {
  void probe(process.argv.at(-2), process.argv.at(-1));
} else {
  const electronPath = require('electron');
  const profile = mkdtempSync(join(tmpdir(), 'xmw-session-check-'));
  try {
    for (const phase of ['seed', 'verify']) {
      const env = { ...process.env };
      delete env.ELECTRON_RUN_AS_NODE;
      const result = spawnSync(electronPath, [__filename, phase, profile], { env, encoding: 'utf8', timeout: 30000 });
      if (result.status !== 0) throw new Error(`${phase}: ${result.error || result.stderr || `exit ${result.status}`}`);
    }
    process.stdout.write('Dummy session isolation, restart, and deletion passed.\n');
  } finally {
    const root = realpathSync(tmpdir());
    const target = realpathSync(profile);
    const inside = relative(root, target);
    if (!inside || inside.startsWith('..') || dirname(target) !== root) throw new Error('Unsafe temporary test path');
    rmSync(target, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
}
