var gulp = require('gulp');
var replace = require('gulp-string-replace');
var exec = require('child_process').exec;

var endpoint;

gulp.task('getEndpoint', function (cb) {
  exec('serverless info', function (err, stdout, stderr) {
    var start = stdout.indexOf("POST - ") + 7;
    var end = stdout.indexOf("dev/") + 4;
    endpoint = stdout.substring(start, end);
    cb(err);
  });
});

gulp.task('default', ["getEndpoint"], function () {
  gulp.src(["./tests/**/e2e.spec.ts"])
    .pipe(replace(/\[\[ENDPOINT\]\]/g, endpoint))
    .pipe(gulp.dest('./tests/'))
});
