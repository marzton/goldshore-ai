module.exports = {
  customSyntax: 'postcss-html',
  rules: {
    'declaration-property-value-disallowed-list': {
      '/color$/': [
        '/#(?:[0-9a-fA-F]{3,8})/',
      ],
      '/^(margin|padding|gap|row-gap|column-gap)(-.+)?$/': [
        '/\\b\\d+(?:\\.\\d+)?px\\b/'
      ],
    },
  },
};
