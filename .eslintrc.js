module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      experimentalObjectRestSpread: true
    }
  },
  env: {
    browser: true,
    es6: true,
    node: true,
    jest: true
  },
  extends: ['airbnb'],
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  rules: {
    '@typescript-eslint/no-unused-vars': [1, { ignoreRestSiblings: true }],
    'import/prefer-default-export': 0,
    'import/no-unresolved': ['error', { ignore: ['^react$'] }],
    'max-len': [2, { code: 160 }],
    'no-shadow': 0,
    'no-console': [1, { allow: ['warn', 'error'] }],
    'object-curly-newline': 0,
    'react-hooks/rules-of-hooks': 2,
    'react-hooks/exhaustive-deps': 'warn',
    'react/jsx-filename-extension': 0
  },
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.js', '.ts', '.tsx', '.json']
    },
    'import/resolver': {
      // use <root>/tsconfig.json
      typescript: {}
    }
  }
};
