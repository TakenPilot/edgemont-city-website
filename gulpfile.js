var gulp = require('gulp');
var webP = require('gulp-webp');
var imageMin = require('gulp-imagemin');
var pngCrush = require('imagemin-pngcrush');
var jade = require('gulp-jade');
var data = require('gulp-data');
var source = require('vinyl-source-stream');
var browserify = require('browserify');
var handlebars = require('gulp-handlebars');
var notify = require('gulp-notify');
var jsHint = require('gulp-jshint');
var liveReload = require('gulp-livereload');
var config = require('./app/config.json');
var wrap = require('gulp-wrap');
var declare = require('gulp-declare');
var concat = require('gulp-concat');
var rimraf = require('gulp-rimraf');
var stylus = require('gulp-stylus');
var nib = require('nib');
var sitemap = require('gulp-sitemap');
var manifest = require('gulp-manifest');
var _ = require('lodash');

var siteUrl = 'http://www.edgemontcity.ca';
var dest = './dist/';
var src = './app/';
var layout = {
    dest: {
        dir: '',
        js: 'js',
        hbs: 'hbs',
        css: 'css',
        img: 'img'
    },
    src: {
        dir: '',
        hbs: 'hbs/**/*.hbs',
        js: 'js/**/*.js',
        jsRoot: 'js/app.js',
        styl: 'css/**/*.styl',
        jade: '**/*.jade',
        img: 'img/*.[jpg|png|svg]'
    }
};

//paths used in gulp tasks restricted to appropriate dirs
var path = {
    dest: _.mapValues(layout.dest, function (str) {
        return dest + str;
    }),
    src: _.mapValues(layout.src, function (str) {
        return src + str;
    })
}

console.log(path);

function getConfig() {
    return config;
}

/**
 * Compile templates for dynamic data
 */
gulp.task('hbs', function() {
    return gulp.src(path.src.hbs)
        .pipe(handlebars())
        .pipe(wrap('Handlebars.template(<%= contents %>)'))
        .pipe(declare({
            namespace: 'Templates',
            noRedeclare: true // Avoid duplicate declarations
        }))
        .pipe(concat('templates.js'))
        .pipe(gulp.dest(path.dest.js))
        .pipe(notify({ message: 'Handlebars complete', onLast: true }))
        .pipe(liveReload({ auto: false }));
});

/**
 * Compile javascript
 */
gulp.task('js', function() {
    return browserify(path.src.jsRoot).bundle()
        .pipe(source('app.js'))
        .pipe(gulp.dest(path.dest.js))
        .pipe(notify({ message: 'JavaScript complete', onLast: true }))
        .pipe(liveReload({ auto: false }));
});

gulp.task('css', function () {
   gulp.src(path.src.styl)
       .pipe(stylus({use: [nib()]}))
       .pipe(gulp.dest(path.dest.css))
       .pipe(notify({ message: 'CSS complete' }))
       .pipe(liveReload({ auto: false }));
});


gulp.task('sitemap', ['html'], function () {
    gulp.src('build/**/*.html', { read: false })
        .pipe(sitemap({ siteUrl: siteUrl }))
        .pipe(gulp.dest(path.dest.dir));
});

gulp.task('manifest', ['hbs', 'css', 'js', 'img', 'html', 'sitemap'], function() {
    gulp.src([path.dest.dir + '*'])
        .pipe(manifest({
            hash: true,
            preferOnline: true,
            network: [siteUrl],
            filename: 'app.manifest',
            exclude: 'app.manifest' //exclude self
        }))
        .pipe(gulp.dest(path.dest.dir));
});


/**
 * Compile html
 */
gulp.task('html', function() {
    return gulp.src(path.src.jade)
        .pipe(data(getConfig))
        .pipe(jade())
        .pipe(gulp.dest(path.dest.dir))
        .pipe(notify({ message: 'Html complete', onLast: true }))
        .pipe(liveReload({ auto: false }));
});

/**
 * Optimize images
 *
 * must have ImageMagick installed with
 *  brew install imagemagick --with-webp
 */
gulp.task('img', function() {
    return gulp.src(path.src.img)
        .pipe(imageMin({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngCrush()]
        }))
        .pipe(webP())
        .pipe(gulp.dest(path.dest.img))
        .pipe(notify({ message: 'Image optimization complete', onLast: true }))
        .pipe(liveReload({ auto: false }));
});

gulp.task('clean', function (done) {
    rimraf(path.dest.dir, done);
});

/**
 * Watch all app files and only run the process they need for output
 */
gulp.task('watch', function () {
    liveReload.listen();
    gulp.watch([path.src.jade], ['html']);
    gulp.watch([path.src.styl], ['css']);
    gulp.watch([path.src.hbs], ['hbs']);
    gulp.watch([path.src.js], ['js'])
});

gulp.task('serve', ['build'], function (next) {
    var connect = require('connect'),
        server = connect(),
        port = process.env.PORT || 8080;
    server.use(connect
        .static(path.dest.dir))
        .listen(process.env.PORT || 8080, function () {
            console.log('listening on', port);
            next.apply(null, arguments);
        });
});

gulp.task('build', ['hbs', 'css', 'js', 'img', 'html', 'sitemap', 'manifest']);
gulp.task('default', ['clean', 'build', 'watch', 'serve']);