
// //////////////////////////////////////////////////
// Require packages
// //////////////////////////////////////////////////

const fs = require('fs');
const gulp = require('gulp');
const plumber = require('gulp-plumber');
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
const sass = require('gulp-sass');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const replace = require('gulp-replace');
const autoprefixer = require('gulp-autoprefixer');
const iife = require("gulp-iife");

const domain = 'coinglacier.org';
const mainFile = domain + '.html'; // 'coinglacier.org.html'
const temporaryFolder = 'temporary';
const concatFile = 'temporary_concat.js';
const encWorkerBundleFile = 'encryptionWorker_bundled.min.js';
const hashsumFilename = 'mainFileSha256';
const packageFile = 'package.json';
const readmeFile = 'README.md';
const changelogFile = 'CHANGELOG.md';

// //////////////////////////////////////////////////
// JavaScript Task
// //////////////////////////////////////////////////

gulp.task('concat-app-and-loader', function () {
    return gulp.src(['src/js/bitcoin_loader.js', 'src/js/app.js'], { sourcemaps: true })
        .pipe(concat(concatFile))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('./src/js'));
});

gulp.task('bundle', function () {
    let b = browserify({
        entries: ['./src/js/' + concatFile],
        debug: true,
        standalone: 'bundle'
    });

    return b.bundle()
        .pipe(plumber())
        .pipe(source('bundle.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(iife({
            useStrict: true,
            trimCode: false,
            prependSemicolon: false,
            bindThis: false,
            params: ["window", "document", "$", "undefined"],
            args: ["window", "document", "jQuery"]
        }))
        .pipe(sourcemaps.write('../../maps/'))
        .pipe(gulp.dest('./src/js/compiled'));
});

gulp.task('create-bundle',  gulp.series('concat-app-and-loader', 'bundle'));

gulp.task('prepare-worker-code', function () {
    return gulp.src(['src/js/compiled/' + encWorkerBundleFile])
        .pipe(replace('\\', '\\\\')) // escape the backslashes (replace \ by \\)
        .pipe(replace('\'', '\\\'')) // escape the quotes (replace ' by \')
        .pipe(replace(/(\r\n\t|\n|\r\t)/gm, '')) // remove new lines
        .pipe(gulp.dest('./src/js/compiled'))
});

gulp.task('inject-worker-code', function () {
    let workerFileContent = fs.readFileSync('src/js/compiled/' + encWorkerBundleFile, 'utf8');

    return gulp.src(['src/js/compiled/bundle.js'])
        .pipe(replace('is replaced with actual JS code by gulp task', 'code injected by gulp task'))
        .pipe(replace('WORKER_CODE_PLACEHOLDER', workerFileContent))
        .pipe(gulp.dest('./src/js/compiled'))
        .pipe(reload({stream: true}))
});

gulp.task('remove-temporary-files', function () {
    return gulp.src(['./src/js/' + concatFile, 'src/js/compiled/' + encWorkerBundleFile], {read:false})
        .pipe(clean());
});

gulp.task('create-main', gulp.series('create-bundle', 'prepare-worker-code', 'inject-worker-code', 'remove-temporary-files'));


// //////////////////////////////////////////////////
// create web worker
// //////////////////////////////////////////////////

gulp.task('create-webworker', function () {

    let b = browserify({
        entries: ['./src/js/encryptionWorker.js']
    });

    return b.bundle()
        .pipe(plumber())
        .pipe(source(encWorkerBundleFile))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(uglify())
        .pipe(sourcemaps.write( ))
        .pipe(gulp.dest('./src/js/compiled'));
});

gulp.task('javascript', gulp.series('create-webworker', 'create-main'));


// //////////////////////////////////////////////////
// Compass / Sass Task
// //////////////////////////////////////////////////

gulp.task('sass', function () {
    return gulp.src('src/scss/coinglacier.org.scss')
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(autoprefixer())
        .pipe(sass().on('error', sass.logError))
        .pipe(sourcemaps.write('../maps/'))
        .pipe(gulp.dest('src/css'))
        .pipe(reload({stream:true}));
});


// //////////////////////////////////////////////////
// Copy JavaScript and CSS dependencies to src folder
// //////////////////////////////////////////////////

gulp.task('move-dependencies', function () {
    gulp.src(
        [
            'node_modules/bootstrap/dist/js/bootstrap.bundle.js',
            'node_modules/jquery/dist/jquery.js',
            'node_modules/mocha/mocha.js'
        ])
        .pipe(gulp.dest('src/js/libs'));

    gulp.src('node_modules/mocha/mocha.css')
        .pipe(gulp.dest('src/css/libs'));

    gulp.src('node_modules/bootstrap/scss/*.scss')
        .pipe(gulp.dest('src/scss/vendors/bootstrap'));

    gulp.src('node_modules/bootstrap/scss/mixins/*.scss')
        .pipe(gulp.dest('src/scss/vendors/bootstrap/mixins'));

    gulp.src('node_modules/bootstrap/scss/vendor/*.scss')
        .pipe(gulp.dest('src/scss/vendors/bootstrap/vendor'));

    return gulp.src('node_modules/bootstrap/scss/utilities/*.scss')
        .pipe(gulp.dest('src/scss/vendors/bootstrap/utilities'));

});


// //////////////////////////////////////////////////
// Browser-Sync Task
// //////////////////////////////////////////////////
gulp.task('browser-sync', function () {
    browserSync({
        server:{
            baseDir: 'src',
            index: 'index.html'
        }
    });
});


// //////////////////////////////////////////////////
// HTML Reload Watcher Task
// //////////////////////////////////////////////////

gulp.task('html', function () {
    return gulp.src('src/**/*.html')
        .pipe(reload({stream:true}));
});


// //////////////////////////////////////////////////
// Watch Task
// //////////////////////////////////////////////////

gulp.task('watch', function () {
    gulp.watch([
        'src/js/**/*.js',
        '!src/js/compiled/bundle.js',
        '!src/js/' + concatFile,
        '!src/js/encryptionWorker.js',
        '!src/js/compiled/' + encWorkerBundleFile,
        'test/**/*.js'
    ], gulp.parallel('javascript'));
});

gulp.task('watch-worker', function () {
    gulp.watch(['src/js/**/encryptionWorker.js'], gulp.parallel('javascript'));
});



gulp.task('watch-scss', function () {
    gulp.watch('src/**/*.scss', gulp.parallel('sass'));
});

gulp.task('watch-html', function () {
    gulp.watch('src/**/*.html', gulp.parallel('html'));
});

gulp.task('watch-ui', gulp.parallel('watch-scss', 'watch-html'));

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

gulp.task('watcher-tasks', gulp.parallel('browser-sync', 'watch', 'watch-ui', 'watch-worker'));
gulp.task('compile', gulp.parallel('javascript', 'sass'));
gulp.task('page-setup', gulp.series('move-dependencies', 'compile', 'watcher-tasks'));
gulp.task('default', gulp.parallel('page-setup', 'tests'));


// //////////////////////////////////////////////////
// Build Task
// //////////////////////////////////////////////////

let semverType = 'patch';

gulp.task('build:remove-old-mainFile', function () {
    return gulp.src('./' + domain + '_*.html', {read:false})
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

gulp.task('build:update-package-json', function () {
    // write hash to package.json
    let packageJson = JSON.parse(fs.readFileSync('./' + packageFile));
    packageJson.sha256sum = getSha256sum();

    fs.writeFile('./' + packageFile, JSON.stringify(packageJson, null, 2), function(err) {
        if(err) {
            console.error(err);
        }
        else {
            console.log('JSON saved to ' + packageFile);
        }
    });

    return gulp.src('./' + packageFile); // need to return a gulp stream to  finish the task
});

gulp.task('build:rename-main-file', function () {

    let fileName = getMainFileName();

    // rename the main file and put the version and the files hashsum into its name
    return gulp.src(temporaryFolder + '/' + mainFile)
        .pipe(rename(fileName))
        .pipe(gulp.dest('./'));

});

gulp.task('build:replace-filenames-in-readme', function () {

    let fileName = getMainFileName();

    return gulp.src('./' + readmeFile)
        .pipe(replace(/coinglacier.org_v.*?.html/g, fileName))
        .pipe(gulp.dest('./'))
});

//todo
gulp.task('build:update-changelog', function () {

    let currentFile = fs.readFileSync('./' + changelogFile);
    let d = new Date();
    let date = [
        d.getFullYear(),
        makeNumberDoubleDigit(d.getMonth() + 1),
        makeNumberDoubleDigit(d.getDate())
    ];

    let newEntry = '# ' + getVersion() +
        '\n-------------------------------------' +
        '\ndate: ' + date.join('-') + '  ' +
        '\nSHA256 checksum: ' + getSha256sum() +
        '\n* ADD' +
        '\n* CHANGES' +
        '\n* HERE' +
        '\n\n';

    fs.writeFile('./' + changelogFile, newEntry + currentFile, function(err) {
        if(err) {
            console.error(err);
        }
        else {
            console.log('JSON saved to ' + packageFile);
        }
    });

    return gulp.src('./' + changelogFile); // need to return a gulp stream to  finish the task
});


gulp.task('build:remove-temp-folder', function () {

    return gulp.src(temporaryFolder, {read:false})
        .pipe(clean());

});

gulp.task('build', gulp.series(

    // go through the unit tests
    // build will fail, if any unit test fails
    // 'tests',
    // remove the old build [eg mainFile], as a new on will be created
    'build:remove-old-mainFile',
    // create new version in package.json
    'build:bump-version',
    // bundle everything into one single HTML file
    'build:bundle-html',
    // create a SHA256 checksum for the resulting HTML file
    'build:create-checksum-file',
    // update sha256sum in package.json
    'build:update-package-json',
    // inlude the version and sha256 hash in the filename of the main file
    'build:rename-main-file',
    // Add new version number, hash and date to the change log
    'build:update-changelog',
    // rewrite all the filenames containing the sha256 hash in README.md
    'build:replace-filenames-in-readme',
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


function getMainFileName(){
    return domain + '_v' + getVersion() + '_' + 'SHA256-' + getSha256sum() + '.html';
}

function getSha256sum(){
    return JSON.parse(fs.readFileSync('./' + temporaryFolder + '/' + hashsumFilename)).sha256;
}

function getVersion(){
    return JSON.parse(fs.readFileSync('./' + packageFile)).version;
}

function makeNumberDoubleDigit(number){
    if(number < 10){
        return '0' + number;
    }else{
        return number;
    }
}