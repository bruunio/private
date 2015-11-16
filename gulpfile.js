var gulp        = require('gulp'),
    browserSync = require('browser-sync'),
    concat      = require('gulp-concat'),
    sass        = require('gulp-sass'),
    prefix      = require('gulp-autoprefixer'),
    cp          = require('child_process'),
    ftp         = require('vinyl-ftp'),
    gutil       = require('gulp-util');

var messages = {
    jekyllBuild: '<span style="color: grey">Running:</span> $ jekyll build'
};

var ftpHost = 'linux91.unoeuro.com',
    ftpUser = 'jeppesmith.dk',
    ftpPswd = 'ajinvest',
    ftpDir = '/emdash/';

gulp.task('deploy', function() {
  var conn = ftp.create({

      // FTP credentials
      host: ftpHost,
      user: ftpUser,
      password: ftpPswd,

      // Log progress to the terminal/console
      log: gutil.log
  });

  // Enter the folders and files you want to upload
  var globs = [

    './**',
    './css/**',
    './js/dist/**',
    './img/**',
    './jekyll/**'

  ];

  return gulp.src( globs, { cwd: './_site/', buffer: false } )

      // Check if files are newer than the ones on the server
      .pipe(conn.newer( ftpDir ))

      // Upload newer files
      .pipe(conn.dest( ftpDir ))
});

/**
 * Build the Jekyll Site
 */
gulp.task('jekyll-build', function (done) {
    browserSync.notify(messages.jekyllBuild);
    return cp.spawn('jekyll', ['build'], {stdio: 'inherit'})
        .on('close', done);
});

/**
 * Rebuild Jekyll & do page reload
 */
gulp.task('jekyll-rebuild', ['jekyll-build'], function () {
    browserSync.reload();
});

/**
 * Wait for jekyll-build, then launch the Server
 */
gulp.task('browser-sync', ['sass', 'jekyll-build'], function() {
    browserSync({
        server: {
            baseDir: '_site'
        }
    });
});

/**
 * Concatenate scripts
 */
gulp.task('scripts', function() {

  // Select all .js files in /js
  gulp.src('./js/*.js')

    // Output all files as main.min.js
    .pipe(concat('main.min.js'))

    // Output the file to /js/dist
    .pipe(gulp.dest('_site/js/dist/'))
    .pipe(browserSync.reload({stream:true}))
    .pipe(gulp.dest('js/dist/'));
});

/**
 * Compile files from _scss into both _site/css (for live injecting) and site (for future jekyll builds)
 */
gulp.task('sass', function () {
    return gulp.src('_sass/main.sass')
        .pipe(sass({
            includePaths: ['sass'],
            onError: browserSync.notify
        }))
        .pipe(prefix(['last 15 versions', '> 1%', 'ie 8', 'ie 7'], { cascade: true }))
        .pipe(gulp.dest('_site/css'))
        .pipe(browserSync.reload({stream:true}))
        .pipe(gulp.dest('css'));
});

/**
 * Watch scss files for changes & recompile
 * Watch html/md files, run jekyll & reload BrowserSync
 */
gulp.task('watch', function () {
    gulp.watch('_sass/**/*.sass', ['sass']);
    gulp.watch('js/*.js', ['scripts']);
    gulp.watch(['*.html', '_layouts/*.html', '_includes/*.html', '_posts/*'], ['jekyll-rebuild']);
});

/**
 * Default task, running just `gulp` will compile the sass,
 * compile the jekyll site, launch BrowserSync & watch files.
 */
gulp.task('default', ['browser-sync', 'watch', 'sass', 'scripts']);
