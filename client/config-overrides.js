const {
  override,
  addBabelPlugins,
  addWebpackModuleRule,
} = require('customize-cra');

module.exports = {
  webpack: override(
    addBabelPlugins(
      ['styled-jsx/babel', {
        "plugins": ["styled-jsx-plugin-postcss"]
      }]
    ),
    addWebpackModuleRule({test: /\.svg$/, use: 'url-loader'})
  )
}
