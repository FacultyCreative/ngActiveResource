angular
  .module('ActiveResource')
  .provider('ARCollection', function() {
    this.$get = function() {
      function Collection(klass, belongsTo) {
        var belongs    = belongsTo.name.toLowerCase();
        var collection = [];

        Object.defineProperty(collection, 'new', {
          enumerable: false,
          value: function(data) {
            if (!data) data = {};
            data[belongs] = collection[belongs];
            return klass.new(data);
          }
        });

        Object.defineProperty(collection, '$create', {
          enumerable: false,
          value: function(data) {
            if (!data) data = {};
            data[belongs] = collection[belongs];
            return klass.$create(data);
          }
        });

        Object.defineProperty(collection, 'first', {
          enumerable: false,
          get: function() { return collection[0]; }
        });

        Object.defineProperty(collection, 'last', {
          enumerable: false,
          get: function() { return collection.slice(-1)[0]; }
        });

        return collection;
      }

      return Collection;
    };
  });
