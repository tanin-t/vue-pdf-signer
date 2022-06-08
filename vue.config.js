const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    allowedHosts: 'all',
    hot: false,
    liveReload: false
  },
  configureWebpack: {
    output: {
      libraryExport: 'default'
    }
  }
})
