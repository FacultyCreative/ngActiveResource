module.exports.addResource = function(options) {

  var app          = options.app;
  var prefix       = options.urlPrefix || "/api";
  var resourceName = options.resourceName;
  var collection   = options.collection;
  var schema       = options.collection.schema;
  var paths        = Object.keys(schema.paths);

  if (prefix[0] != '/') {
    prefix = '/' + prefix;
  }

  var baseUrl = prefix + '/' + resourceName;

  //*****************************// Schema //**********************************//
  app.get(baseUrl + '/schema', function(req, res) {
    res.json(schema);
  });

  //*****************************// Index //**********************************//
  app.get(baseUrl, function(req, res) {
    var cb = function(error, resources) {
      if (!error) {
        res.json(resources); // Write the jsonified resources to the response object
      } else {
        res.json(error);
      }
    };
    resources = collection.find(cb);
  });

  //******************************// Show //**********************************//
  app.get(baseUrl + '/:id', function(req, res) {
    collection.find({
        "_id": req.params.id
      },
      function(error, resource) {
        if (!error) {
          if (resource.length) {
            res.json(resource[0]);
          } else {
            res.json({
              message: resourceName + 'Not Found'
            });
          }
        } else {
          res.json(error);
        }
      });
  });

  //*****************************// Create //*********************************//
  app.post(baseUrl, function(req, res) {

    var data = req.body;
    postHash = {};
    paths.forEach(function(key) { postHash[key] = data[key] || undefined; });

    collection.create(postHash, function(error, resource) {
      if (!error) {
        res.json(resource);
      } else {
        res.json(error);
      }
    });
  });

  //*****************************// Update //*********************************//
  app.put(baseUrl + '/:id', function(req, res) {
    var data = req.body;
    collection.update(req.params.id, req.body, function(error, resource) {
      if (error) {
        return res.send(error);
      } else {
        res.json(resource);
      }
    });
  });

  //*****************************// Destroy //********************************//
  app.delete(baseUrl + '/:id', function (req, res){
    return collection.remove({_id: req.params.id}, function (error) {
      if (!error) {
        res.send('');
      } else {
        res.send(error);
      }
    });
  });

};
