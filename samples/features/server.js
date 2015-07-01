var express = require('express'),
    app = express();
app.use(express.static(__dirname + '/'));
app.get('/', function (req, res) {
    res.send('index.html');
});
app.listen(3000);
