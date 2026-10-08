import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  { ignores: ['dist/'] },
  js.configs.recommended,
  reactHooks.configs['recommended-latest'],
  { rules: { 'no-unused-vars': ['error', { varsIgnorePattern: '^React$' }] } },
];
