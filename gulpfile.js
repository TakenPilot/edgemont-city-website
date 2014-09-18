var gulp = require('gulp');
var webP = require('gulp-webp');
var imageMin = require('gulp-imagemin');
var pngCrush = require('imagemin-pngcrush');
var data = require('gulp-data');
var source = require('vinyl-source-stream');
var browserify = require('browserify');
var notify = require('gulp-notify');
var config = require('./app/config.json');
var concat = require('gulp-concat');
var rimraf = require('rimraf');
var sitemap = require('gulp-sitemap');
var manifest = require('gulp-manifest');
var _ = require('lodash');
var webserver = require('gulp-webserver');
var gm = require('gulp-gm');
var limitComplexity = require('gulp-limit-complexity');
var es = require('event-stream');
var rename = require('gulp-rename');
var googleSpreadsheet = require('./googleSpreadsheet');
var Promise = require('bluebird');
var util = require('util');

var siteUrl = 'http://www.edgemontcity.ca';
var dest = './dist/';
var src = './app/';
var layout = {
  dest: {
    dir: '',
    js: 'js',
    hbs: 'hbs',
    css: 'css',
    img: 'img',
    font: 'font'
  },
  src: {
    dir: '',
    hbs: '**/*.hbs',
    hbsIndex: 'index.hbs',
    js: 'js/**/*.js',
    jsRoot: 'js/app.js',
    styl: 'css/**/*.styl',
    jade: '**/*.jade',
    jadeIndex: '**/index.jade',
    img: 'img/*',
    font: 'font/*.ttf'
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
};


function getConfig(languages) {
  return Promise.all([
    googleSpreadsheet.getListByProperty({key: config.googleDocs.detail.key}, 'name'),
    googleSpreadsheet.getList({
      key: config.googleDocs.menu.key,
      categories: config.googleDocs.menu.categories
    }),
    googleSpreadsheet.getList({
      key:config.googleDocs.groupMenu.key,
      categories: config.googleDocs.groupMenu.categories
    })
  ]).spread(function(detail, menu, groupMenu) {

    var config = {};
    _.each(languages, function (language) {
      config[language] = _.mapValues(detail, function (item) { return googleSpreadsheet.removeSuffix(item, '_' + language); });
      config[language].menu = menu;
      config[language].groupMenu = groupMenu;
      config[language].lang = language;
      _.assign(config[language], _.pick(require('./app/config.json'), ['sitemap']));
    });

    return config;
  }).catch(function (err) {
    console.error(err);
  });
}

/**
 * Compile templates for dynamic data
 */
gulp.task('hbs', function () {
  var handlebars = require('gulp-handlebars'),
    wrap = require('gulp-wrap'),
    declare = require('gulp-declare'),
    concat = require('gulp-concat'),
    notify = require('gulp-notify');

  return gulp.src(path.src.hbs)
    .pipe(handlebars({
      handlebars: require('handlebars')
    }))
    .pipe(wrap('Handlebars.template(<%= contents %>)'))
    .pipe(declare({
      namespace: 'Templates',
      noRedeclare: true // Avoid duplicate declarations
    }))
    .pipe(concat('templates.js'))
    .pipe(gulp.dest(path.dest.js))
    .pipe(notify({ message: 'Handlebars complete', onLast: true }));
});

gulp.task('lint', function () {
  var jshint = require('gulp-jshint'),
    stylish = require('jshint-stylish');

  return gulp.src(path.src.js)
    .pipe(jshint({
      "globals": {
        "Promise": true
      }
    }))
    .pipe(jshint.reporter(stylish));

});

gulp.task('complexity', function () {
  return gulp.src(path.src.js)
    .pipe(limitComplexity({
      halstead: {
        operands: {
          distinct: 20
        }
      }
    }));
});

gulp.task('mocha', function () {
  var mocha = require('gulp-mocha');

  //fixtures for all tests
  var window = require('./test/fixture/window');
  var templates = require('./test/fixture/templates');

  return gulp.src('./test/unit/**/*.js', {read: false})
    .pipe(mocha({
      reporter: 'mocha-spec-reporter-async',
      growl: true,
      ui: 'bdd'
    }));
});

/**
 * Compile javascript
 */
gulp.task('js', ['hbs'], function () {
  return browserify(path.src.jsRoot).bundle()
    .pipe(source('app.js'))
    .pipe(gulp.dest(path.dest.js))
    .pipe(notify({ message: 'JavaScript complete', onLast: true }));
});

gulp.task('css', function () {
  var stylus = require('gulp-stylus'),
    nib = require('nib'),
    notify = require('gulp-notify');

  return gulp.src(path.src.styl)
    .pipe(stylus({use: [nib()]}))
    .pipe(gulp.dest(path.dest.css))
    .pipe(notify({ message: 'CSS complete' }));
});

gulp.task('sitemap', ['html'], function () {
  return gulp.src('build/**/*.html', { read: false })
    .pipe(sitemap({ siteUrl: siteUrl }))
    .pipe(gulp.dest(path.dest.dir));
});

gulp.task('manifest', ['hbs', 'css', 'js', 'img', 'html', 'sitemap'], function () {
  return gulp.src([path.dest.dir + '*'])
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
gulp.task('html', function () {
  var handlebars = require('gulp-static-handlebars');

  var configPromise = getConfig(['en', 'zh']);

  var english = gulp.src(path.src.hbsIndex)
      .pipe(handlebars(configPromise.get('en'), {partials: gulp.src('./app/hbs/partials/**/*.hbs')}))
      .pipe(rename({suffix: '.en', extname: '.html'})),
    mandarin = gulp.src(path.src.hbsIndex)
      .pipe(handlebars(configPromise.get('zh'), {partials: gulp.src('./app/hbs/partials/**/*.hbs')}))
      .pipe(rename({suffix: '.zh', extname: '.html'}));

  return es.merge(english, mandarin)
    .pipe(gulp.dest(path.dest.dir))
    .pipe(notify({ message: 'Html complete', onLast: true }));
});

gulp.task('font', function () {
  return gulp.src(path.src.font)
    .pipe(gulp.dest(path.dest.font));
});

/**
 * Optimize images
 *
 * must have ImageMagick installed with
 *  brew install imagemagick --with-webp
 */
gulp.task('img', function () {
  return gulp.src(path.src.img)
    .pipe(imageMin({
      progressive: true,
      svgoPlugins: [
        {removeViewBox: false}
      ],
      use: [pngCrush()]
    }))
    .pipe(webP())
    .pipe(gulp.dest(path.dest.img))
    .pipe(gm(function (file) { return file.resize('200%'); }, { imageMagick: true }))
    .pipe(rename({suffix:'@2x'}))
    .pipe(gulp.dest(path.dest.img))
    .pipe(notify({ message: 'Image optimization complete', onLast: true }));
});

gulp.task('clean', function (done) {
  rimraf(path.dest.dir, done);
});

/**
 * Watch all app files and only run the process they need for output
 */
gulp.task('watch', ['build'], function () {
  gulp.watch([path.src.hbs], ['html']);
  gulp.watch([path.src.styl], ['css']);
  gulp.watch([path.src.hbs], ['hbs']);
  gulp.watch([path.src.js], ['js']);
  gulp.watch([path.src.font], ['font'])
});

gulp.task('server', ['watch'], function () {
  return gulp.src('dist')
    .pipe(webserver({
      root: 'dist',
      directoryListing: false,
      livereload: true,
      port: 8000
    }));
});

gulp.task('test', ['mocha', 'lint', 'complexity']);
gulp.task('build', ['font', 'hbs', 'css', 'js', 'img', 'html', 'sitemap']);
gulp.task('prod', ['build', 'manifest']);
gulp.task('serve', ['test', 'build', 'watch', 'server']);
gulp.task('default', ['test', 'build']);