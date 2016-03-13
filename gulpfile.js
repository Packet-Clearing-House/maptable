/*eslint-disable */
var gulp = require('gulp');
var gulpSequence = require('gulp-sequence');

var rollup = require('rollup');
var babel = require('rollup-plugin-babel');

var browserSync = require('browser-sync');

var compressJs = require('gulp-uglify');
var rimraf = require('gulp-rimraf');

var rename = require('gulp-rename');

var reload = browserSync.reload;

// Browser
gulp.task('browser-sync', function() {
  browserSync.init({
    server: {
      baseDir: ["./examples", "./build"]
    },
    files: ['./examples/**/*.*', './build/**/*.*'],
    browser: 'google chrome',
    port: 5000,
  });
});

// Watch
gulp.task('watch', function() {
  gulp.watch('src/**/*.js', ['build:js']);
});

// Javascript VENDOR
gulp.task('build:js', function() {
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
    dest: './build/maptable.js'
   });
   browserSync.reload();
 });
});

// Compression
gulp.task('compress:js', function() {
  return gulp.src('build/*.js')
    .pipe(compressJs())
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest('./build'));
});

// Clean
gulp.task('clean:js', function() {
   return gulp.src('./build/*.js', { read: false })
		.pipe(rimraf({ force: true }));
});


gulp.task('default', gulpSequence('clean:js', 'build:js', 'browser-sync', 'watch'));
gulp.task('dist', gulpSequence('clean:js', 'build:js', 'compress:js'));
