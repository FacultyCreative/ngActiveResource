var express    = require('express');
var app        = module.exports = express();
var db         = require('./lib/mongooseModels');
var facultyAPI = require('faculty-api');
var path       = require('path');

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
}

app.configure(function() {
  app.use(express.methodOverride());
  app.use(express.bodyParser());
  app.use(allowCrossDomain);
  app.use(express.static(path.join(__dirname, '../bower_components/')));
  app.use(express.static(path.join(__dirname, '../lib/')));
  app.use(express.static(path.join(__dirname, '../dist/')));
  app.use(express.static(path.join(__dirname, '../example')));
  app.use(express.errorHandler({
    dumpExceptions: true,
    showStack: true
  }));
  app.use(app.router);
});

facultyAPI.addResource({
  app: app,
  resourceName: 'systems',
  collection: db.system
});

facultyAPI.addResource({
  app: app,
  resourceName: 'sensors',
  collection: db.sensor
});

facultyAPI.addResource({
  app: app,
  resourceName: 'post',
  collection: db.post
});

facultyAPI.addResource({
  app: app,
  resourceName: 'comment',
  collection: db.comment
});

app.set('port', process.env.PORT || 3000);

