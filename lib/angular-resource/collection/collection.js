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

        return collection;
      }

      return Collection;
    };
  });
