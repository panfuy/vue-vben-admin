import { defineConfig } from '@vben/eslint-config';

export default defineConfig([
  {
    files: ['**/*.{js,ts,vue}'],
    rules: {
      'no-debugger': 'off',
      'no-restricted-syntax': [
        'error',
        'LabeledStatement',
        'WithStatement',
        'TSEnumDeclaration[const=true]',
        'TSExportAssignment',
      ],
      'vue/no-restricted-syntax': [
        'error',
        'LabeledStatement',
        'WithStatement',
      ],
    },
  },
]);
