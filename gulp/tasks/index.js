var jade = require('gulp-jade');
var gulp = require('gulp');
var data = require('gulp-data');
var source = require('vinyl-source-stream');

module.exports = function() {
    return gulp.src('./app/*.jade')
        .pipe(data('/app/config.json'))
        .pipe(jade())
        .pipe(gulp.dest('./build/'));
};