/*eslint-disable */
var gulp = require('gulp');
var gulpSequence = require('gulp-sequence');

var rollup = require('rollup');
var babel = require('rollup-plugin-babel');

var browserSync = require('browser-sync');

var compressJs = require('gulp-uglify');
var compressCss = require('gulp-cssnano');
var headerComment = require('gulp-header-comment');

var rimraf = require('gulp-rimraf');

var rename = require('gulp-rename');
var _ = require('underscore');

var reload = browserSync.reload;

var package = require('./package.json');

// Browser
gulp.task('browser-sync', function() {
  browserSync.init({
    server: {
      baseDir: ["./docs", "./dev"]
    },
    files: ['./docs/**/*.*', './dev/**/*.*'],
    port: 5000,
  });
});

// Watch
gulp.task('watch', function() {
  gulp.watch('src/**/*.js', ['build:js:dev']);
  gulp.watch('src/*.css', ['build:css:dev']);
});

// Javascript
function buildJs(dest) {
  return rollup.rollup({
    entry: './src/index.js',
    plugins: [
      babel({ runtimeHelpers: true })
    ]
  }).then( function ( bundle ) {
    return bundle.write({
      format: 'iife',
      moduleName: 'd3.maptable',
      globals: {
        d3: 'd3',
        topojson: 'topojson'
     },
     sourceMap: true,
     dest: dest + '/maptable.js'
    });
  })
  .then(() => {
    return gulp.src([dest + '/maptable.js', dest + '/maptable.css']).pipe(gulp.dest('./docs/'));
  })
  .then(() => {
    return browserSync.reload();
  });
}

// Build for distribution
gulp.task('build:js:dist', function() {
 return buildJs('./dist');
});

// Build for developmeent environment
gulp.task('build:js:dev', function() {
 return buildJs('./dev');
});

// Compression
gulp.task('compress:js', function() {
  return gulp.src('dist/*.js')
    .pipe(compressJs())
    .pipe(headerComment('MapTable '+ package.version + ' - License MIT - Build: ' + (new Date()).toString()))
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest('./dist'))
    .pipe(gulp.dest('./docs'));
});

// CSS
function buildCss(dest) {
  return gulp.src('./src/*.css')
  .pipe(compressCss())
  .pipe(gulp.dest(dest))
  .pipe(gulp.dest('./docs'))
  .pipe(reload({stream:true}));
}
gulp.task('build:css:dev', function() {
  return buildCss('./dev');
});
gulp.task('build:css:dist', function() {
  return buildCss('./dist');
});

// Clean
gulp.task('clean:js:dist', function() {
   return gulp.src('./dist/*.js', { read: false })
		.pipe(rimraf({ force: true }));
});

gulp.task('clean:js:dev', function() {
   return gulp.src('./dev/*.js', { read: false })
		.pipe(rimraf({ force: true }));
});


gulp.task('default', gulpSequence('clean:js:dev', ['build:js:dev', 'build:css:dev'], 'browser-sync', 'watch'));
gulp.task('dist', gulpSequence('clean:js:dist', ['build:js:dist', 'build:css:dist'], 'compress:js'));
