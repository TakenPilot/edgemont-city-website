var $ = require('jquery');

function scrollTop(hash, $target) {
  $('html, body').stop().animate({'scrollTop': $target.offset().top}, 900, 'swing', function () {
    window.location.hash = hash;
    return false;
  });
}

$(function() {
  $('a[href^="#"]').on('click',function (e) {
    e.preventDefault();
    var hash = this.hash;

    var $target = $(hash);
    $target = $target.length ? $target : $('[name=' + hash.slice(1) +']');

    if ($target.length) {
      scrollTop(hash, $target);
    }
  });
});