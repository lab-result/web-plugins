const path = require('path');

// app version
process.env.VUE_APP_VERSION = require('./package.json').version;
if (process.env.NODE_ENV !== 'production') process.env.VUE_APP_VERSION += '-' + process.env.NODE_ENV;

module.exports = {
  transpileDependencies: [
    'vuetify',
    '@mycure/mf-commons',
    '@mycure/mf-auth',
    '@mycure/mf-organizations',
    '@mycure/sdk-js',
    '@mycure/vue-plugins',
  ],
  configureWebpack: {
    resolve: {
      alias: {
        // to ensure that the imported vue instance (on project and modules) is always the same
        vue: path.resolve(__dirname, 'node_modules/vue'),
        // vue$: path.resolve(__dirname, 'node_modules/vue/dist/vue.runtime.esm.js'),
        // alias mycure modules to process their tree-shakeable code
        '@mycure/mf-commons/lib': '@mycure/mf-commons/src',
        '@mycure/mf-auth/lib': '@mycure/mf-auth/src',
        '@mycure/mf-organizations/lib': '@mycure/mf-organizations/src',
        '@mycure/sdk-js': '@mycure/sdk-js/src',
        '@mycure/vue-plugins/lib': '@mycure/vue-plugins/src',
      },
    },
    externals: {
      // exclude momentjs in chart.js build
      moment: 'moment',
    },
  },
};
