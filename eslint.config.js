import nextVitals from 'eslint-config-next/core-web-vitals'

const eslintConfig = [
  ...nextVitals,
  {
    ignores: ['dist/**', 'src/**'],
  },
]

export default eslintConfig
