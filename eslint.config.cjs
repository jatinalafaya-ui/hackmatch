const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  {
    ignores: ['web/**', 'mobile/**', 'node_modules/**'],
  },
  js.configs.recommended,
  {
    files: ['server/**/*.js', 'api/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: {
      eqeqeq: ['error', 'always'],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
];
