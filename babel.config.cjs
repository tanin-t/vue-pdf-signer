module.exports = {
  presets: [
    ['@vue/cli-plugin-babel/preset', {
      // Disable all polyfill injection - consuming apps handle their own polyfills
      useBuiltIns: false,
      polyfills: []
    }]
  ]
}
