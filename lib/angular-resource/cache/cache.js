angular
  .module('ActiveResource')
  .provider('ARCache', function() {
    this.$get = function() {
      function Cache() {

        // function cache(instance, primaryKey)
        //
        // @param {instance} - Model instance to store in the model's cache
        //
        // If the instance has an ID, add it to the cache of its constructor. E.g.:
        //    sensor => {id: 1, name: "Johnny's Window"}
        //    sensor.constructor = Sensor
        //
        //    expect(Sensor.cached[1]).toEqual(sensor);
        Object.defineProperty(this, 'cache', {
          enumerable: false,
          value: function(instance, primaryKey) {
            if (instance && instance[primaryKey] !== undefined) {
              instance.constructor.cached[instance[primaryKey]] = instance;
            }
          }
        });

        // function isEmpty()
        //
        // True/false cache is empty
        Object.defineProperty(this, 'isEmpty', {
          enumerable: false,
          value: function() {
            return !!(!Object.keys(this).length);
          }
        });

        // function where(terms)
        //
        // @param {terms} - Search terms used to find instances in the cache
        //
        // Returns all cached instances that match the given terms
        Object.defineProperty(this, 'where', {
          enumerable: false,
          value: function(terms) {
            if (Object.keys(terms).length === 0) terms = undefined;
            return _.where(this, terms, this);
          }
        });
      }

      return Cache;
    };
  });