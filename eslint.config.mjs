import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({ baseDirectory: __dirname })

const config = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      // Allow explicit any only with a comment (strict mode is already enforced by tsc)
      '@typescript-eslint/no-explicit-any': 'warn',
      // Unused vars are a real bug signal
      '@typescript-eslint/no-unused-vars': ['error', {
        vars: 'all',
        args: 'after-used',
        ignoreRestSiblings: true,
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      // React hooks correctness
      'react-hooks/exhaustive-deps': 'warn',
      // Require key prop in lists
      'react/jsx-key': 'error',
    },
  },
]

export default config
