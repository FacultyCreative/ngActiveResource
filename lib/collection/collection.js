'use strict';

var Inflector  = require('../../bower_components/active-support/active-support-node.js');
var _          = require('lodash');

function Collection(klass, belongsTo) {
  var belongs    = belongsTo.name.toLowerCase();
  var collection = [];

  function instantiate(data) {
    var instance      = klass.new(data);
    instance[belongs] = collection[belongs];
    return instance;
  }

  Object.defineProperty(collection, 'new', {
    enumerable: false,
    value: function(data) {
      return instantiate(data);
    }
  });

  Object.defineProperty(collection, '$create', {
    enumerable: false,
    value: function(data) {
      var instance = instantiate(data);
      collection.push(instance);
      return instance;
    }
  });

  Object.defineProperty(collection, '$delete', {
    enumerable: false,
    value: function(id) {
      if (id.id) id = id.id;
      // Lodash#remove is a mutating method
      _.remove(collection, function(instance) {
        return instance.id == id;
      });
    }
  });
  
  return collection;
}

module.exports = Collection;
