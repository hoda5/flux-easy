var fluxeasy = require('../src/fluxeasy');

var options = {
    range: true
};

if (process.argv.length == 5) {
    if (process.argv[4] == '--map') {
        options.sourceFileName = process.argv[2];
        options.sourceMapName = process.argv[3].replace(/\.jsx?$/gi, '') + '.map';
    } else
        sintax_error();;
} else if (process.argv.length != 4)
    sintax_error();

fluxeasy.transform_file(process.argv[2], process.argv[3], options);

function sintax_error() {
    console.error('Sintase: flux-easy input output [--map|mapfile]');
    process.exit(1);
}
