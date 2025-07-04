module.exports = {
  presets: [
    [
      '@vue/app',
      {
        useBuiltIns: 'entry'
      }
    ]
  ],
  plugins: [
    // 添加以下插件解决私有属性问题
    '@babel/plugin-proposal-private-property-in-object',
    '@babel/plugin-proposal-private-methods',
    '@babel/plugin-proposal-class-properties'
  ]
};
