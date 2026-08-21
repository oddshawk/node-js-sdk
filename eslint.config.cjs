'use strict';

const { FlatCompat } = require('@eslint/eslintrc');
const globals = require('globals');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  resolvePluginsRelativeTo: __dirname
});

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'reports/**'
    ]
  },
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.mocha
      }
    }
  },
  ...compat.extends('semistandard').map((cfg) => ({
    ...cfg,
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    languageOptions: {
      ...cfg.languageOptions,
      parserOptions: {
        ...(cfg.languageOptions && cfg.languageOptions.parserOptions),
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    }
  }))
];
