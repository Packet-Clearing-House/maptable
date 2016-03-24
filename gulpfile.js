/*eslint-disable */
var gulp = require('gulp');
var gulpSequence = require('gulp-sequence');

var rollup = require('rollup');
var babel = require('rollup-plugin-babel');

var browserSync = require('browser-sync');

var compressJs = require('gulp-uglify');
var rimraf = require('gulp-rimraf');

var rename = require('gulp-rename');
var jeditor = require('gulp-json-editor');
var _ = require('underscore');

var reload = browserSync.reload;

// Browser
gulp.task('browser-sync', function() {
  browserSync.init({
    server: {
      baseDir: ["./examples", "./dev"]
    },
    files: ['./examples/**/*.*', './dev/**/*.*'],
    browser: 'google chrome',
    port: 5000,
  });
});

// Watch
gulp.task('watch', function() {
  gulp.watch('src/**/*.js', ['build:js:dev']);
});

// Javascript
function buildJs(dest) {
  return rollup.rollup({
    entry: './src/index.js',
    plugins: [
      babel({ runtimeHelpers: true })
    ]
  }).then( function ( bundle ) {
    bundle.write({
      format: 'iife',
      moduleName: 'd3.maptable',
      globals: {
        d3: 'd3',
        topojson: 'topojson'
     },
     sourceMap: true,
     dest: dest + '/maptable.js'
    });
    browserSync.reload();
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
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest('./dist'));
});

// Bower
gulp.task('bower', function () {
  return gulp.src('./package.json')
    .pipe(rename('bower.json'))
    .pipe(jeditor(function (json) {
      return _.pick(json, [
        'name',
        'version',
        'description',
        'main',
        'keywords',
        'author',
        'license',
        'dependencies'
      ]);
    }))
    .pipe(gulp.dest('.'));
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


gulp.task('default', gulpSequence('clean:js:dev', 'build:js:dev', 'browser-sync', 'watch'));
gulp.task('dist', gulpSequence('clean:js:dist', 'build:js:dist', 'compress:js', 'bower'));
