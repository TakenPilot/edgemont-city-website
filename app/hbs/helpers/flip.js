module.exports = function (index, amount, scope) {
  if ( ++index % amount ) {
    return scope.fn(this) + scope.inverse(this);
  } else {
    return scope.inverse(this) + scope.fn(this);
  }
};