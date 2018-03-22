
// //////////////////////////////////////////////////
// Require packages
// //////////////////////////////////////////////////

const fs = require('fs');
const gulp = require('gulp');
const plumber = require('gulp-plumber')
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const browserSync = require('browser-sync');
const reload = browserSync.reload;
const sourcemaps = require('gulp-sourcemaps');
const mocha = require('gulp-mocha');
const rename = require('gulp-rename');
const inlinesource = require('gulp-inline-source');
const hashsum = require('gulp-hashsum');
const clean = require('gulp-clean');
const bump = require('gulp-bump');

const domain = 'coinglacier.org';
const mainFile = domain + '.html'; // 'coinglacier.org.html'
const temporaryFolder = 'temporary';
const hashsumFilename = 'mainFileSha256';
const packageFile = 'package.json';

// //////////////////////////////////////////////////
// JavaScript Task
// //////////////////////////////////////////////////

gulp.task('javascript', function () {
    var b = browserify({
        entries: ['src/js/app.js', 'src/js/bitcoin.js'],
        debug: true,
        standalone: 'bundle'
    });

    return b.bundle()
        .pipe(plumber())
        .pipe(source('bundle.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(sourcemaps.write('../maps/'))
        .pipe(gulp.dest('./src/js'))
        .pipe(reload({stream:true}));
});


// //////////////////////////////////////////////////
// Browser-Sync Task
// //////////////////////////////////////////////////
gulp.task('browser-sync', function () {
    browserSync({
        server:{
            baseDir: './',
            index: 'index.html'
        },
        startPath: './src'
    });
});


// //////////////////////////////////////////////////
// HTML Reload Watcher Task
// //////////////////////////////////////////////////

gulp.task('html', function () {
    gulp.src('src/**/*.html')
        .pipe(reload({stream:true}));
});


// //////////////////////////////////////////////////
// Watch Task
// //////////////////////////////////////////////////

gulp.task('watch', function () {
    gulp.watch(['src/js/**/*.js', '!src/js/**/bundle.js', 'test/**/*.js'], gulp.parallel('javascript', 'tests'));
    gulp.watch('src/**/*.html', gulp.parallel('html'));
});


// //////////////////////////////////////////////////
// Unit Tests Task
// //////////////////////////////////////////////////

gulp.task('tests', function () {
    return gulp.src('./test/testsWrapper.js')
        .pipe(mocha());
});


// //////////////////////////////////////////////////
// Default Task
// //////////////////////////////////////////////////

gulp.task('default', gulp.parallel('tests', 'javascript', 'browser-sync', 'watch'));


// //////////////////////////////////////////////////
// Build Task
// //////////////////////////////////////////////////

var semverType = 'patch';

gulp.task('build:remove-old-mainFile', function () {
    return gulp.src('./' + domain + '_*.html*', {read:false})
        .pipe(clean());

});

gulp.task('build:bump-version', function(){
    return gulp.src('./' + packageFile)
        .pipe(bump({type: semverType}))
        .pipe(gulp.dest('./'));
});

gulp.task('build:bundle-html', function () {

    return gulp.src('src/index.html')
        .pipe(inlinesource({ compress: false }))
        .pipe(rename(mainFile)) // rename to coinglacier.org.html
        .pipe(gulp.dest('./' + temporaryFolder));
});

gulp.task('build:create-checksum-file', function () {

    // write hashsum to file ./temporary/mainFileSha256
    return gulp.src(temporaryFolder + '/' + mainFile)
        .pipe(rename('sha256'))
        .pipe(hashsum({hash: 'sha256', json: true, filename: temporaryFolder + '/' + hashsumFilename}));

});

gulp.task('build:rename-main-file', function () {

    // read hashsum into variable
    var sha256 = JSON.parse(fs.readFileSync('./' + temporaryFolder + '/' + hashsumFilename)).sha256;

    // write hash to package.json
    var packageJson = JSON.parse(fs.readFileSync('./' + packageFile));
    packageJson.sha256sum = sha256;

    fs.writeFile('./' + packageFile, JSON.stringify(packageJson, null, 2), function(err) {
        if(err) {
            console.log(err);
        }
        else {
            console.log('JSON saved to ' + packageFile);
        }
    });

    // get Version
    var version = packageJson.version;

    // rename the main file and put the version and the files hashsum into its name
    return gulp.src(temporaryFolder + '/' + mainFile)
        .pipe(rename(domain + '_v' + version + '_' + 'SHA256-' + sha256 + '.html'))
        .pipe(gulp.dest('./'));

});

gulp.task('build:remove-temp-folder', function () {

    return gulp.src(temporaryFolder, {read:false})
        .pipe(clean());

});

gulp.task('build', gulp.series(

    // go through the unit tests
    // build will fail, if any unit test fails
    'tests',
    // remove the old build [eg mainFile], as a new on will be created
    'build:remove-old-mainFile',
    // create new version in package.json
    'build:bump-version',
    // bundle everything into one single HTML file
    'build:bundle-html',
    // create a SHA256 checksum for the resulting HTML file
    'build:create-checksum-file',
    // inlude the version and sha256 hash in the filename of the main file
    'build:rename-main-file',
    // remove the temp folder which was used for the build
    'build:remove-temp-folder'
));

gulp.task('dummy-minor', function () {
    semverType = 'minor';
    return gulp.src('./');
});

gulp.task('build-minor', gulp.series('dummy-minor', 'build'));

gulp.task('dummy-major', function () {
    semverType = 'major';
    return gulp.src('./');
});

gulp.task('build-major', gulp.series('dummy-major', 'build'));
