import coreWebVitals from 'eslint-config-next/core-web-vitals'
import typescript from 'eslint-config-next/typescript'

export default [
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      // The Next 16+ flat config enables some very strict hook/purity rules that
      // flag common patterns (data fetch in effects, event handlers using Date.now, etc).
      // We keep the core Next rules but relax these to avoid noisy false positives.
      'react-hooks/immutability': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/set-state-in-effect': 'off',

      // Prefer warnings over hard failures for repo-wide polish.
      '@typescript-eslint/no-explicit-any': 'warn',

      // Our eslint config file exports an array (flat config).
      'import/no-anonymous-default-export': 'off',
    },
  },
]

