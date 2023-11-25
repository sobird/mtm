module.exports = {
  root: true,
  "env": {
    "browser": true,
  },
  extends: [
    'sobird/typescript-react.cjs',
    // https://legacy.reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html#removing-unused-react-imports
    // "plugin:react/jsx-runtime",
  ],
  rules: {
  },
}
