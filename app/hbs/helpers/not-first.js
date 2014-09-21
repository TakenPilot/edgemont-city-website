module.exports = function (options) {
  if (!options.data.first) {
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
};