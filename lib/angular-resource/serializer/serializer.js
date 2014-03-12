angular
  .module('ActiveResource')
  .provider('ARSerializer', function() {
    this.$get = ['json', 'ARMixin', 'ARAssociations', 'ARHelpers', 'ARDeferred',
      function(json, mixin, Associations, Helpers, deferred) {
      function Serializer() {
        
        // function serialize(instance)
        //
        // @param instance {object} - Instance to serialize
        //
        // Transform associations to foreign keys; a parsable, non-circular JSON structure
        // ready to be sent over the wire.
        this.serialize = function(instance, options) {
          var obj = foreignkeyify(instance);
          return json.serialize(obj, options);
        };
        
        // function deserialize(httpResponse, instance, options)
        //
        // @param httpResponse {object} - The data received in an http response
        //
        // @param instance     {object} - An optional instance to update using the data received
        //
        // @param options      {object} - Additional options to further refine deserialization
        //
        // Deserialize takes an http response, and by default loads all associations for any
        // foreign keys on the response it receives (eager loading). Optionally, deserialize
        // can be set to lazy-load (lazy: true), which will load no associations, or 
        // to over-eager load (overEager: true), which will also load all associations found
        // on the associated instances (careful: this can pull down a huge amount of your database,
        // and issue many http requests). 
        this.deserialize = function(httpResponse, instance, options) {
          var json, options;
          if (httpResponse && httpResponse.data) json = httpResponse.data;
          else json = httpResponse;
          
          if (!options) options = {lazy: true};

          if (responseContainsForeignKeys(json, instance)) {
            return setAssociationsAndUpdate(instance, json, options);
          } else {
            return updateLocalInstance(instance, json, options)
              .then(function(response) { instance = response; return deferred(instance); });
          }
        };

        // function foreignkeyify (instance) 
        //
        // @param instance {object} - A model instance
        //
        // Takes all associations and transforms the necessary ones into foreign keys
        function foreignkeyify(instance) {
          var json         = mixin({}, instance, false);
          var associations = Associations.get(instance);
          _.each(associations.belongsTo, function(association) {
            var foreignKeyName       = association.foreignKey;
            var associatedName       = Helpers.getClassNameFor(association);
            var associatedInstance   = instance[associatedName];
            if (!associatedInstance) return;
            var primaryKeyName       = Helpers.getPrimaryKeyFor(associatedInstance);
            var foreignkey           = associatedInstance[primaryKeyName];
            json[foreignKeyName]     = foreignkey;
            json[associatedName]     = undefined;
          });
          return json;
        }

        // function responseContainsForeignKeys (response, instance)
        //
        // True/false - Response contains foreign keys
        function responseContainsForeignKeys(response, instance) {
          var answer = false;
          var associations = Associations.get(instance);
          _.each(associations.belongsTo, function(foreignRel) {
            var foreignKey = foreignRel.foreignKey;
            if (response[foreignKey] || response == foreignKey) answer = true;
          });
          return answer;
        }
      }

      function updateLocalInstance(instance, response, options) {
        if (options && options.update === false) return deferred(instance);
        instance.update(response);
        var primaryKey = Helpers.getPrimaryKeyFor(instance);
        instance.constructor.cached.cache(instance, primaryKey);

        instance.validations.updateInstance(instance);
        if (!options.lazy) return eagerLoad(instance).then(finishUpdate);
        return finishUpdate();

        function finishUpdate() {
          instance.establishBelongsTo();
          return deferred(instance);
        }
      }

      function setAssociationsAndUpdate(instance, response, options) {
        if (options && options.update === false) options.update = true;
        var associationsToUpdate = [];
        var associations = Associations.get(instance);
        if (associations.belongsTo.length >= 1) {
          _.each(associations.belongsTo, function(foreignRel) {
            if (!response[foreignRel.foreignKey]) return;
            var association    = foreignRel.klass;
            var associatedName = association.name.camelize();
            var foreignKey     = foreignRel.foreignKey;
            var query          = response[foreignKey];

            // Unless overEager is set, only eagerly load one level of associations.
            
            var queryOptions = {};
            for (var i in options) { queryOptions[i] = options[i]; }
            if (!options.overEager) queryOptions.lazy = true;

            associationsToUpdate.push(function(callback) {
              foreignRel.klass.find(query, queryOptions).then(function(association) {
                response[associatedName] = association;
                delete response[foreignKey];
                callback(null, response);
              });
            });
          });
        }

        async.series(associationsToUpdate, function(err, response) {
          response = _.first(response);
          updateLocalInstance(instance, response, options);
        });

        return deferred(instance);
      }

      function eagerLoad(instance) {
        var queries      = [];
        var associations = Associations.get(instance);
        var dependentList = [associations.hasMany, associations.hasOne];
        _.each(dependentList, function(dependentsArray) {
          _.each(dependentsArray, function(association) {
            var dependent     = Associations.getDependents(association, instance);
            var foreignKey    = dependent.foreignKey;
            var query         = {};
            var primaryKey    = Helpers.getPrimaryKeyFor(instance);
            query[foreignKey] = instance[primaryKey];
            queries.push(function(callback) {
              association.klass.where(query, {lazy: true}).then(function(response) {
                _.each(response, function(associ) {
                  if (_.include(associations.hasMany, association)) {
                    var name = association.klass.name.pluralize().camelize();
                    instance[name].nodupush(associ);
                  } else {
                    var name = association.klass.name.singularize().camelize();
                    if (!instance[name]) instance[name] = associ;
                  }
                  callback(null, instance);
                });
              });
            });
          });
        });
        async.series(queries, function(err, callback) {});
        return deferred(instance);
      }

      return Serializer;
    }];
  });