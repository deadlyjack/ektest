import os from 'node:os';
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import packageJson from './package.json' with { type: 'json' };

const TEST_DIR = resolve(os.tmpdir(), 'test-ektest');

if (existsSync(TEST_DIR)) {
  if (os.platform() === 'win32') {
    execSync(`rmdir /s /q ${TEST_DIR}`, { stdio: 'inherit' });
  } else {
    execSync(`rm -rf ${TEST_DIR}`, { stdio: 'inherit' });
  }
}

mkdirSync(TEST_DIR, { recursive: true });

writeFileSync(resolve(TEST_DIR, 'index.test.js'), `
test('Test function', () => {
  expect('2 + 2', 2+2).toBe(4);
});
`);

writeFileSync(resolve(TEST_DIR, 'package.json'), `
{
  "name": "test-ektest",
  "version": "1.0.0",
  "type": "module",
  "description": "Test project for ektest",
  "main": "index.js"
}
`);

execSync(`npm install --save-dev ${process.cwd()}/ektest-${packageJson.version}.tgz`, { cwd: TEST_DIR });
execSync('npx ektest', { cwd: TEST_DIR, stdio: 'inherit' });