const transformImportMeta = ({ types: t }) => ({
  visitor: {
    MetaProperty(path) {
      if (path.node.meta.name === 'import' && path.node.property.name === 'meta') {
        path.replaceWith(
          t.objectExpression([
            t.objectProperty(
              t.identifier('env'),
              t.objectExpression([
                t.objectProperty(
                  t.identifier('MODE'),
                  t.memberExpression(
                    t.memberExpression(t.identifier('process'), t.identifier('env')),
                    t.identifier('NODE_ENV')
                  )
                ),
              ])
            ),
          ])
        );
      }
    },
  },
});

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      transformImportMeta,
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: { '@': './src' },
          extensions: ['.ios.js', '.android.js', '.js', '.jsx', '.ts', '.tsx', '.json'],
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
