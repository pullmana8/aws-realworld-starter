var gulp = require('gulp');
var replace = require('gulp-string-replace');
var exec = require('child_process').exec;

var endpoint;

gulp.task('getEndpoint', function (cb) {
  exec('serverless info', function (err, stdout, stderr) {
    // console.log(stdout);
    reg = new RegExp("(https://.+/dev/)").exec(stdout);
    endpoint = reg[0];
    // console.log(endpoint);
    cb(err);
  });
});

gulp.task('default', ["getEndpoint"], function () {
  gulp.src(["./tests/**/e2e.spec.ts", "./tests/**/*.env.json"])
    .pipe(replace(/\[\[ENDPOINT\]\]/g, endpoint))
    .pipe(gulp.dest('./tests/'))
});
