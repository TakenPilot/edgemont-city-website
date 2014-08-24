var gulp = require('./gulp')([
    'templates',
    'stylesheets',
    'scripts',
    'images',
    'index',
    'watch',
    'serve'
]);

gulp.task('build', ['templates', 'stylesheets', 'scripts', 'images', 'index']);
gulp.task('default', ['build', 'watch', 'serve']);