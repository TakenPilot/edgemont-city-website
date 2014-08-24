var gulp = require('./gulp')([
    'templates',
    'stylesheets',
    'scripts',
    'images',
    'watch',
    'serve'
]);

gulp.task('build', ['templates', 'stylesheets', 'scripts', 'images']);
gulp.task('default', ['build', 'watch', 'serve']);