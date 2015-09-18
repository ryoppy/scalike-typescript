gulp = require 'gulp'
gutil = require 'gulp-util'
typescript = require 'gulp-typescript'
plumber = require 'gulp-plumber'
browserify = require 'browserify'
source = require 'vinyl-source-stream'
merge = require 'merge2'
uglify = require 'gulp-uglify'
sourcemaps = require 'gulp-sourcemaps'
rename = require 'gulp-rename'
tslint = require 'gulp-tslint'

###
compile TypeScript.
###
gulp.task 'compile', ->
  proj = typescript.createProject 'tsconfig.json'
  res = proj.src()
    .pipe plumber()
    .pipe(typescript proj)
  merge [
    res.dts.pipe gulp.dest './app/build'
    res.js.pipe gulp.dest './app/build'
  ]

###
resolve dependency and concat.
###
gulp.task 'build', ['compile'], ->
  browserify
    entries: './app/build/scalike.js'
    standalone: 'scalike'
  .bundle()
  .pipe plumber()
  .pipe source 'scalike.js'
  .pipe gulp.dest './dist'

###
for publish. minify and generate sourcemap.
###
gulp.task 'bundle', ['build'], ->
  gulp.src('dist/scalike.js')
    .pipe sourcemaps.init()
    .pipe uglify()
    .pipe rename('scalike.min.js')
    .pipe sourcemaps.write('.')
    .pipe gulp.dest 'dist'

###
type script lint.
###
gulp.task 'lint', ->
  gulp.src('./app/src/*.ts')
    .pipe tslint()
    .pipe tslint.report('verbose')