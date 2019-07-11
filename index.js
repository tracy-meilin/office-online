var express = require('express');
var path = require('path');
var app = express();

var indexRouter = require("./routers/index");

app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    next();
});

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(__dirname + '/public'));
app.use("/", indexRouter);


var server = app.listen(8080, function() {
    var host = server.address().address;
    var port = server.address().port;

    console.log("listening in http://%s:%s", host, port);
})