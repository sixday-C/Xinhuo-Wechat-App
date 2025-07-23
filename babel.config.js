module.exports = {
  presets: [
    [
      '@vue/app',
      {
        useBuiltIns: 'entry',
        corejs: 3 // 明确指定 core-js 版本
      }
    ]
  ],
  plugins: [
    // 添加 transform-runtime 插件解决 regenerator 问题
    [
      '@babel/plugin-transform-runtime',
      {
        regenerator: true, // 启用 regenerator 支持
        corejs: false, // 不使用 core-js polyfill (由 useBuiltIns 处理)
        helpers: true,
        useESModules: false
      }
    ],
    
    // 保留原有的私有属性支持
    '@babel/plugin-proposal-private-property-in-object',
    '@babel/plugin-proposal-private-methods',
    '@babel/plugin-proposal-class-properties'
  ]
};
