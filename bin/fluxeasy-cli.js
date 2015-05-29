var fs = require('fs');
var fluxeasy = require('../src/fluxeasy');

var mapfile;
if (process.argv.length == 5) {
    if (process.argv[4] == '--map')
        mapfile = {
            source: process.argv[2]
        };
    else
        sintax_error();
} else if (process.argv.length != 4)
    sintax_error();

var source = fs.readFileSync(process.argv[2], {
    encoding: 'utf-8'
});

var generated = fluxeasy.transform_js(source, mapfile);

if (mapfile) {
    fs.writeFileSync(process.argv[3], generated.code, {
        encoding: 'utf-8'
    });
    fs.writeFileSync(/\.jsx?/.replace(process.argv[3], '') + '.map', generated.map, {
        encoding: 'utf-8'
    });
} else
    fs.writeFileSync(process.argv[3], generated, {
        encoding: 'utf-8'
    });

function sintax_error() {
    console.error('Sintase: flux-easy input output [--map]');
    process.exit(1);
}
