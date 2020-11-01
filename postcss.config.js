/* eslint-disable import/no-extraneous-dependencies */
const autoprefixer = require('autoprefixer');
const flexbugFixer = require('postcss-flexbugs-fixes');

module.exports = {
  plugins: [
    autoprefixer,
    flexbugFixer,
  ],
};
