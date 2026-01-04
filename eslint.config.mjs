import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';
import nextPlugin from '@next/eslint-plugin-next';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  resolvePluginsRelativeTo: __dirname,
});

const coreWebVitals = { ...nextPlugin.configs['core-web-vitals'] };
delete coreWebVitals.name;

export default [
  ...compat.config(coreWebVitals),
  {
    ignores: ['node_modules', '.next', 'out', 'dist'],
  },
];
