module.exports = {
  env: {
    browser: true,
    es2021: true,
    jest: true,
  },
  overrides: [
    {
      files: ['**/*.stories.*'],
    },
  ],
  extends: [
    'react-app',
    'react-app/jest',
    'airbnb',
    'airbnb-typescript',
    'plugin:import/typescript',
    'plugin:prettier/recommended',
    'plugin:storybook/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    project: 'tsconfig.eslint.json',
    sourceType: 'module',
  },
  plugins: ['react', '@typescript-eslint', 'prettier'],
  rules: {
    'react/jsx-filename-extension': [
      'warn',
      {
        extensions: ['.tsx'],
      },
    ],
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        ts: 'never',
        tsx: 'never',
      },
    ],
    '@typescript-eslint/no-explicit-any': 'off',
    'import/no-extraneous-dependencies': 'off',
    'no-use-before-define': 'off',
    '@typescript-eslint/no-use-before-define': ['off'],
    'react/jsx-uses-react': ['off'],
    'react/react-in-jsx-scope': ['off'],
    'react/default-props-match-prop-types': ['off'],
    'react/require-default-props': ['off'],
    'react/jsx-props-no-spreading': ['off'],
    'no-shadow': 'off',
    'no-console': 'off',
    'react/button-has-type': [
      'warn',
      {
        button: true,
        submit: true,
        reset: false,
      },
    ],
    'import/no-anonymous-default-export': 'off',
    'react/function-component-definition': [
      2,
      {
        namedComponents: 'arrow-function',
        unnamedComponents: 'arrow-function',
      },
    ],
    'no-param-reassign': 0,
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
};
