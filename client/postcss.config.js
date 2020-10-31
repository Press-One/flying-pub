const tailwindcss = require('tailwindcss');

module.exports = {
  plugins: [
    tailwindcss('./tailwind.config.js'),
    require('autoprefixer'),
    process.env.NODE_ENV === 'production' && (require('cssnano'))
  ],
};