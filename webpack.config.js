const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: 'production',
  entry: './src/browser.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'legal-markdown.umd.min.js',
    library: 'LegalMarkdown',
    libraryTarget: 'umd',
    globalObject: 'this',
    umdNamedDefine: true
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  externals: {
    // Exclude Node.js-specific modules that don't work in browser
    'puppeteer': 'puppeteer',
    'fs/promises': 'fs/promises',
    'child_process': 'child_process',
    // Exclude pandoc-wasm to reduce bundle size
    'pandoc-wasm': 'pandoc-wasm'
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@core': path.resolve(__dirname, 'src/core'),
      '@types': path.resolve(__dirname, 'src/types'),
      '@constants': path.resolve(__dirname, 'src/constants'),
      '@lib': path.resolve(__dirname, 'src/lib'),
      '@extensions': path.resolve(__dirname, 'src/extensions'),
      '@errors': path.resolve(__dirname, 'src/errors')
    },
    fallback: {
      "fs": false,
      "path": require.resolve("path-browserify"),
      "child_process": false,
      "process": false,
      "util": false
    }
  },
  optimization: {
    usedExports: true,
    sideEffects: false,
    minimize: true,
    splitChunks: false // Disable for UMD build
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.env.DEBUG': JSON.stringify(false),
      'process': JSON.stringify({}),
      'global': 'globalThis'
    })
  ],
  devtool: 'source-map'
};