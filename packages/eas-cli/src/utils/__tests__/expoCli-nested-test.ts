import os from 'os';
import path from 'path';

import fs from 'fs-extra';

import {
  shouldUseVersionedExpoCLIExpensive,
  shouldUseVersionedExpoCLIWithExplicitPlatformsExpensive,
} from '../expoCli';

async function writePackageAsync(dir: string, name: string, version: string): Promise<void> {
  await fs.outputJson(path.join(dir, 'package.json'), { name, version, main: 'index.js' });
  await fs.outputFile(path.join(dir, 'index.js'), '');
}

describe('versioned Expo CLI detection', () => {
  let projectDir: string;

  beforeEach(async () => {
    projectDir = await fs.realpath(
      await fs.mkdtemp(path.join(os.tmpdir(), 'eas-cli-expo-cli-test-'))
    );
    delete process.env.EXPO_USE_LOCAL_CLI;
  });

  afterEach(async () => {
    await fs.remove(projectDir);
  });

  // npm can install `@expo/cli` under `node_modules/expo/node_modules` instead of hoisting it.
  // `expo/bin/cli` resolves `@expo/cli` from the `expo` package, so it still runs the versioned CLI.
  it('finds @expo/cli nested under the expo package', async () => {
    const expoDir = path.join(projectDir, 'node_modules', 'expo');
    await writePackageAsync(expoDir, 'expo', '57.0.30');
    await writePackageAsync(
      path.join(expoDir, 'node_modules', '@expo', 'cli'),
      '@expo/cli',
      '57.0.9'
    );

    expect(shouldUseVersionedExpoCLIExpensive(projectDir, { sdkVersion: '57.0.0' })).toBe(true);
    expect(shouldUseVersionedExpoCLIWithExplicitPlatformsExpensive(projectDir)).toBe(true);
  });

  it('finds @expo/cli hoisted to the project node_modules', async () => {
    await writePackageAsync(path.join(projectDir, 'node_modules', 'expo'), 'expo', '57.0.30');
    await writePackageAsync(
      path.join(projectDir, 'node_modules', '@expo', 'cli'),
      '@expo/cli',
      '57.0.9'
    );

    expect(shouldUseVersionedExpoCLIExpensive(projectDir, { sdkVersion: '57.0.0' })).toBe(true);
    expect(shouldUseVersionedExpoCLIWithExplicitPlatformsExpensive(projectDir)).toBe(true);
  });

  it('returns false when @expo/cli is not installed', async () => {
    await writePackageAsync(path.join(projectDir, 'node_modules', 'expo'), 'expo', '45.0.0');

    expect(shouldUseVersionedExpoCLIExpensive(projectDir, { sdkVersion: undefined })).toBe(false);
    expect(shouldUseVersionedExpoCLIWithExplicitPlatformsExpensive(projectDir)).toBe(false);
  });
});
