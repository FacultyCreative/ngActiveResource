angular
  .module('ActiveResource')
  .provider('ARBase', function() {
    this.$get = ['ARAPI', 'ARCollection', 'ARAssociation', 'ARAssociations',
      'AREventEmitter', '$http', '$q', 'json', '$injector',
      function(API, Collection, Association, Associations, 
        EventEmitter, $http, $q, json, $injector) {

      // String.prototype#downcase
      //
      // Copy of the Ruby method that lowercases a string. Used for brevity.
      String.prototype.downcase = function() {
        return this.toLowerCase();
      }

      function Base() {
        var _this            = this;

        // By default, the primary key is set to 'id'. It can be overridden using the
        // Model.instance#primaryKey method. This local variable is used by the other methods
        // to set the correct data and construct API requests.
        var primaryKey       = 'id';

        // We use an associations object to store the hasMany and belongsTo associations for each
        // model. These are stored on associations.hasMany and associations.belongsTo respectively.
        var associations     = new Associations(_this);

        // Dependents to destroy when the primary resource is destroyed. Set with
        // _this.dependentDestroy(dependents)
        var dependentDestroy = [];

        // Instantiates a new ActiveResource::API, which comes with methods for setting the
        // URLs used by functions like $save, $create, $delete, and $update. See
        // ActiveResource::API for more details.
        this.api             = new API(this);

        var eventEmitter     = new EventEmitter();

        this.before          = eventEmitter.before;
        this.after           = eventEmitter.after;

        // Creates a cache for the model. The cache is used by methods like Model#find and
        // Model#where, to first check whether or not an instance with a given primary key
        // already exists on the client before querying the backend for it.
        if (!_this.cached) _this.cached = {};

        // function cacheInstance(instance)
        //
        // @params {instance} - Model instance to store in the model's cache
        //
        // If the instance has an ID, add it to the cache of its constructor. E.g.:
        //    sensor => {id: 1, name: "Johnny's Window"}
        //    sensor.constructor = Sensor
        //
        //    expect(Sensor.cached[1]).toEqual(sensor);
        function cacheInstance(instance) {
          if (instance && instance[primaryKey]) instance.constructor.cached[instance[primaryKey]] = instance;
        };

        // The base object stores some common functionality.
        var base           = {};

        function updateLocalInstance(instance, response, options) {
            instance.update(response);
            cacheInstance(instance);
            if (!options.lazy) return eagerLoad(instance).then(finishUpdate);
            return finishUpdate();

            function finishUpdate() {
              instance.establishBelongsTo();
              return deferred(instance);
            };
        };

        function eagerLoad(instance) {
          var queries = [];
          var dependentList = [associations.hasMany, associations.hasOne];
          _.each(dependentList, function(dependentsArray) {
            _.each(dependentsArray, function(association) {
              var dependent     = Associations.getDependents(association, instance);
              var foreignKey    = dependent.foreignKey;
              var query         = {};
              query[foreignKey] = instance[primaryKey];
              queries.push(function(callback) {
                association.klass.where(query, {lazy: true}).then(function(response) {
                  _.each(response, function(associ) {
                    if (_.include(associations.hasMany, association)) {
                      var name = association.klass.name.pluralize().camelize();
                      if (!_.include(instance[name], associ)) instance[name].push(associ);
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
        };

        function mixinProps(receiver, giver) {
          for (var i in giver) {
            if (typeof giver[i] !== 'function') {
              if (!receiver.hasOwnProperty(i)) {
                (function() {
                  var local;
                  Object.defineProperty(receiver, i, {
                    enumerable: true,
                    get: function()    { return local; },
                    set: function(val) { local = val; }
                  });
                })();
                receiver[i] = giver[i];
              }
            }
          }
          return receiver;
        };

        function foreignkeyify(instance) {
          var json = mixinProps({}, instance);
          _.each(associations.belongsTo, function(association) {
            var foreignKeyName       = association.foreignKey;
            var associatedName       = association.klass.name.camelize();
            var associatedInstance   = instance[associatedName];
            if (!associatedInstance) return;
            var primaryKeyName       = associatedInstance.constructor.primaryKey;
            var foreignkey           = associatedInstance[primaryKeyName];
            json[foreignKeyName]     = foreignkey;
            json[associatedName]     = undefined;
          });
          return json;
        };

        function jsonifyForeignKeys(instance) {
          var obj = foreignkeyify(instance);
          return JSON.stringify(obj);
        };

        base.$save = function(instance, url) {
          eventEmitter.emit('$save:called', instance);
          var jsonified = jsonifyForeignKeys(instance);
          return $http.post(url, jsonified).then(function(response) {
            response = response.data
            if (responseContainsForeignKeys(response)) return setAssociationsAndUpdate(instance, response, {lazy: true}).then(finish(instance))

            return finish(instance);
            function finish(instance) {
              updateLocalInstance(instance, response, {lazy: true})
                .then(function(response) { instance = response; });
              eventEmitter.emit('$save:complete', instance);
              return deferred(instance);
            }
          });
        };

        // function responseContainsForeignKeys(response)
        //
        // Returns true if any belongs to relationship, or its foreign key, is mentioned in the response
        function responseContainsForeignKeys(response) {
          var answer = false;
          _.each(associations.belongsTo, function(foreignRel) {
            var foreignKey = foreignRel.foreignKey;
            if (response[foreignKey] || response == foreignKey) answer = true;
          });
          return answer;
        };

        function setAssociationsAndUpdate(instance, response, options) {
          var associationsToUpdate = [];
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
                })
              });
            });
          }

          async.series(associationsToUpdate, function(err, response) {
            response = _.first(response);
            updateLocalInstance(instance, response, options);
          });

          return deferred(instance);
        };

        
        // function deferred(instance)
        //
        // @param {instance} - An instance to wrap in a deferred object
        //
        // Returns an object wrapped in a deferred. Responds to then() method. Shortcut
        // for establishing these three boilerplate lines.
        function deferred(instance, error) {
          var deferred = $q.defer();
          if (error) deferred.reject(error);
          else deferred.resolve(instance);
          return deferred.promise;
        };

        // function instanceIsAssociatedWith(instance, association)
        //
        // @param {instance}    - The instance in question
        // @param {association} - The name of the associated model
        //
        // Checks whether or not an instance is associated with an instance of another model.
        // In the event a "Sensor" model belongs to a "System" model, returns true if an instance
        // of sensor contains a property called "system" that is an instance of the System model.
        function instanceIsAssociatedWith(instance, association) {
          var associationName = nameOfBelongsToModel(association);
          return !!(instance[associationName] && instance[associationName].constructor == association);
        };

        // function nameOfBelongsToModel(model)
        //
        // @param {model} - [Constructor] Model to retrieve name from
        //
        // Returns name of model if the model is a constructor. Else returns undefined.
        function nameOfBelongsToModel(model) {
          if (!model) return;
          if (!model.klass && !model.name) return;
          if (!model.klass) return model.name.camelize();
          return model.klass.name.camelize();
        };

        // Model.instance#establishBelongsTo
        // 
        // Called internally to sync a resource with the collection(s) it belongs to. If a System
        // has many Sensors, whenever a sensor instance needs to establish its initial belongs to
        // relationship, it calls this method to push itself into the right system instance.
        _this.prototype.establishBelongsTo = function() {
          if (associations.belongsTo.length) {
            for (var i in associations.belongsTo) {
              var association     = associations.belongsTo[i].klass;
              var associationName = nameOfBelongsToModel(association);
              if (instanceIsAssociatedWith(this, association)) {
                var belongs = this[associationName][this.constructor.name.pluralize().camelize()];

                if (!_.include(belongs, this) && belongs && belongs.push) {
                  belongs.push(this);
                } else if (belongs && !belongs.push) {
                  belongs = this;
                }
              }
            };
          }
        };

        // Model.instance#$save 
        //
        // Persists an instance of a model to the backend via the API. A convention used
        // in ActiveResource is that methods prefaced with `$` interact with the backend.
        //
        // Calls the createURL defined on the API of the model. The createURL can either
        // be set via Model.api.set('http://defaulturl.com') or overridden specifically
        // by setting Model.api.createURL = 'http://myoverriddenURL.com'
        //
        // The API should respond with either a representation of the same resource, or 
        // an error.
        //
        // If a representation of the resource is received, Model.instance calls
        // Model.instance#update passing in the data received from the server. If the
        // resource has a hasMany relationship, and receives a representation of its child
        // resources, the child resources will also be updated.
        //
        // To avoid having to call $scope.$apply with nested resources, nested resources
        // call up to the highest-level resource to perform the $save. The $save still only
        // calls the resource-in-question, and not its parent or parent's parent, but the
        // parent is being actively watched for $http requests, while the child is not
        // when created via the nested structure (e.g. $scope.system.sensors.new())
        _this.prototype.$save = function(instance, url) {
          if (!url)      url      = _this.api.createURL;
          if (!instance) instance = this;

          return base.$save(instance, url);
        };

        // Model.instance#update
        //
        // Resource representations may be received many times over during the course of a
        // session in a single page application. Whenever a new representation is received
        // from the server, if a model instance of that representation already exists, it
        // should be updated across the application.
        //
        // Model.instance#update receives server representations and updates the appropriate
        // model objects with them. If an instance has a has many relationship to another model,
        // and the representation received includes a reference to the has many relationship,
        // the data on that reference will be used to update the foreign relationship.
        //
        // Update ensures random properties are not set on the instance. Only properties
        // defined in the body of the constructor or via Object.defineProperty are considered
        // "settable" via the model, although Javascript normally will allow you to set any
        // property on any object using a setter. To ensure the sanctity of your data, use
        // instance#update to set properties.
        _this.prototype.update = function(data) {

          eventEmitter.emit('update:called', {data: data, instance: this});

          if (this == data) data = _.mixin({}, data);

          for (var attr in data) {
           if (instanceHasManyOf(attr)) { 
              updateHasManyRelationship.call(this, data[attr], attr);
           } else if (instanceHasOneOf(attr)) {
              updateHasOneRelationship.call(this, data[attr], attr);
           } else if (instanceBelongsTo(attr)) {
              updateBelongsRelationship.call(this, data[attr], attr)
           } else if (isSettableProperty(attr)) {
              this[attr] = data[attr];
            }
          }

          var instance = this;

          function finish(instance) {
            eventEmitter.emit('update:complete', {data: data, instance: instance});
            return deferred(instance);
          }

          if (responseContainsForeignKeys(data)) {
            return setAssociationsAndUpdate(instance, data, {lazy: true}).then(function(response) {
              return deferred(instance);
            });
          } else {
            return finish(instance);
          }

        };

        function isSettableProperty(attr) {
          return _.include(getSettableProperties(_this), attr);
        }; 

        function instanceBelongsTo(attr) {
          return _.include(getBelongsToNames(), attr.camelize());
        };

        function instanceHasManyOf(attr) {
          return _.include(getHasManyNames(), attr.camelize());
        };

        function instanceHasOneOf(attr) {
          return _.include(getHasOneNames(), attr.camelize());
        };

        function updateBelongsRelationship(collection, name) {
          if (collection.constructor.name == 'Number' || collection.constructor.name == 'String') {
            collection = undefined;
          }
          if (collection) this[name] = collection;
        };

        function updateHasManyRelationship(collection, name) {
          if (collection.length > 0) this[name] = _.map(collection, function(instance) {
            return this.constructor[name.classify()].new(instance)}, this);
        };

        function updateHasOneRelationship(association, name) {
          _.each(associations.hasOne, function(related) {
            if (related.klass.name == name.classify()) {
              Object.defineProperty(this, name, {
                enumerable: true,
                configurable: true,
                value: related.klass.new(association)
              });
              var relatedBelongs = Associations.cached[related.klass.name.downcase()].belongsTo;
              _.each(relatedBelongs, function(belongs) {
                if (belongs.klass == this.constructor) {
                  this[name][belongs.propertyName] = this;
                }
              }, this);

            };
          }, this);
        };

        // function getBelongsToNames()
        //
        // Returns an array containing the names of the classes the model belongs to. E.g. if
        // a Comment belongs to an Author and Post, getBelongsToNames will return ['author', 'post'] 
        function getBelongsToNames() {
          return _.map(associations.belongsTo, function(association) { return association.klass.name.camelize(); });
        };

        // function getHasManyNames()
        //
        // Returns an array of the names of the classes the model has a has-many relationship with. E.g.
        // If an author has many posts and has many comments, getHasManyNames will return ['posts', 'comments']
        function getHasManyNames() {
          return _.map(associations.hasMany, function(association) { return association.klass.name.camelize().pluralize(); });
        };

        function getHasOneNames() {
          return _.map(associations.hasOne, function(association) 
              { return association.klass.name.camelize(); });
        }

        // function getSettableProperties(model)
        //
        // @param {model} - Model to get the settable properties of.
        //
        // Returns the properties (enumerable or not) that are settable on a model. It instantiates
        // the model and checks its properties to see what properties were defined either in the
        // body of the constructor or via Object.defineProperty.
        //
        // The `primaryKey` property 
        function getSettableProperties(model) { 
          var instance       = model.new();
          var nonenumerables = Object.getOwnPropertyNames(instance);
          var properties     = [];

          for (var prop in instance)            { properties.nodupush(prop); };
          _.each(nonenumerables, function(prop) { properties.nodupush(prop); });
          properties.nodupush(primaryKey);

          var specialProps = ['establishBelongsTo', '$save', 'update', '$delete', 
            'associations', 'primaryKey', 'hasMany', 'hasOne', 'belongsTo'];
          _.remove(properties, function(prop) {
            return _.include(specialProps, prop);
          });
          return properties;
        };

        Object.defineProperty(Array.prototype, 'nodupush', {
          enumerable: false,
          configurable: true,
          value: function(val) {
            if (!_.include(this, val)) this.push(val);
          }
        });

        // Model#$create
        // 
        // When a model calls $create, a new instance is built using the arguments passed in,
        // and immediately saved. This calls Model.instance#$save, which will attempt to persist
        // the instance to the backend. If the backend returns success, the new instance is added to
        // the cache and returned.
        //
        //    System.$create({placement: 'window'}).then(function(response) { system = response; });
        //
        // Model.$create is equivalent to calling Model.new().save()
        _this.$create = function(data) {
          if (!data) data = {};
          eventEmitter.emit('$create:called', data);
          var instance = _this.new(data);
          instance.establishBelongsTo();
          
          return instance.$save().then(function(response) {
            instance = response;
            cacheInstance(instance);
            eventEmitter.emit('$create:complete', instance);
            return deferred(instance);
          });
        };

        // Model.new(data)
        // 
        // @param {data} - JSON data used to instantiate a new instance of the model. 
        //
        // New creates a new instance of the model. If an id is passed in, new first checks
        // whether or not an object is stored in the cache with that id; if it is, it is returned.
        // The new instance is added to the cache. If the instance has any hasMany relationships
        // associated with it, those relationships are instantiated via an empty ActiveResource::Collection.
        // The new collection associates this instance with it, so that calling:
        //
        //    system.sensors.new()
        //
        // Associates the sensor with the system. E.g.:
        //
        //    var sensor = system.sensors.new()
        //    expect(sensor.system).toEqual(system);
        //
        _this.new = function(data) {
          if (!data) data = {};
          eventEmitter.emit('new:called', data);
          if (typeof data == 'Number') data = argify(data);
          if (data && this.cached[data[primaryKey]]) return this.cached[data[primaryKey]];
          var instance = new this(data);

          setPrimaryKey(instance, data);

          cacheInstance(instance);
          _.each(associations.belongsTo, function(model) {
            var name = nameOfBelongsToModel(model);
            if (data && data[name]) {
              instance[name] = data[name];
            };
          });
          // Add any data passed to the hasMany relationships
          _.each(associations.hasMany, function(collection) {
            var name = collection.klass.name.pluralize().camelize();
            instance[name][this.name.camelize()] = instance;
            if (data[name]) addNewDataToCollection(data, name, instance); 
          }, this);

          _.each(associations.hasOne, function(rel) {
            var name = rel.propertyName;
            if (data[rel.propertyName]) addNewDataToHasOne(data, name, instance, rel);
          });

          eventEmitter.emit('new:complete', instance);
          return instance;
        };

        function setPrimaryKey(instance, data) {
          if (!instance[primaryKey]) {
            instance[primaryKey] = data[primaryKey];
          };
        };

        function addNewDataToCollection(data, name, instance) {
          _.each(data[name], function(associatedInstance) {
            instance[name].new(associatedInstance);
          });
        };

        function addNewDataToHasOne(data, name, instance, rel) {
          var dataprop = data[rel.propertyName];
          if (dataprop && dataprop.constructor.name == rel.klass.name) {
            var val      = dataprop;
            var forAssoc = Associations.get(dataprop).belongsTo;
            _.each(forAssoc, function(association) {
              if (association.klass == instance.constructor) {
                dataprop[association.propertyName] = instance;
              }
            });
          } else {
            var val = rel.klass.new(data[name]);
          }
          Object.defineProperty(instance, name, {
            enumerable: true,
            configurable: true,
            value: val
          });
        };

        // function generateGET(terms, options)
        //
        // @param {terms}   - JSON terms used to create a GET request. These will be parsed into a query
        //                    string.
        // @param {options} - Options include:
        //                      * Multi: whether or not to query for all results
        //                      * Cached: cached results to include in the result set
        //                      * Lazy: Whether or not to lazy load associations
        //
        // Used to generate a GET request for a JSON object (`terms`). The terms will be parsed into a
        // query string for the GET request. The request will use the ActiveResource::API#findURL 
        // associated with the model to generate the request, subbing in the query string for the 
        // terms. If `multi` is set to true, the request will return a collection matching the query. 
        // If `multi` is set to false, the first result found will be returned. If cached objects are
        // passed, they will be returned in the results set. If lazy is set to true, associated models
        // will be lazily loaded; otherwise, they will be eagerly loaded.
        function generateGET(terms, options) {
            var querystring = '?';
            _.map(terms, function(val, key) { 
              if(querystring.slice(-1) == '?') querystring += key + '=' + val; 
              else                             querystring += '&' + key + '=' + val;
            });
            var url = _this.api.findURL.replace(/\[\:\w+\]/, querystring);
            return $http.get(url).then(function(response) {
              var data = response.data;
                  
              if (options.multi) return resolveMultiGET(data, options);
              else               return resolveSingleGET(data, options);
            });
        };

        // function resolveSingleGET(data, options)
        //
        // @param {data} - JSON data returned from the API request to be used to create a new instance.
        //
        // Resolves the result of a GET request into a new instance of the model wrapped in a deferred object.
        // Used with Model#find(id) to locate a resource that is not stored in the cache. Instantiating the new
        // resource will add it to the cache.
        function resolveSingleGET(data, options) {
          if (data.length >= 1) data = _.first(data);
          var instance = _this.new(data);
          eventEmitter.emit('find:complete', instance);
          if (responseContainsForeignKeys(data)) return setAssociationsAndUpdate(instance, data, options);
          return updateLocalInstance(instance, data, options);
        };

        // function resolveMultiGET(data)
        //
        // @param {data} - JSON data returned from the API request to be used to create a collection of new instances.
        // 
        // Resolves the result of a GET request into a collection of instances found on the API. Used with
        // Model#where(terms) to return results stored on the database.
        function resolveMultiGET(data, options) {
          var results = [];
          var tasks   = [];
          for (var i in data) {
            var instance = _this.new(data[i]);
            results.push(instance);
            if (responseContainsForeignKeys(data[i])) setAssociationsAndUpdate(instance, data[i], options);
            else updateLocalInstance(instance, data[i], options);
          }
          eventEmitter.emit('where:complete', results);
          return deferred(results);
        };

        // Model.instance#$delete(terms)
        //
        // @param {terms} - JSON terms used to delete 
        // 
        _this.prototype.$delete = function() {
          eventEmitter.emit('$delete:called', this);
          var url         = _this.api.deleteURL;
          var querystring = '?' + primaryKey + '=' + this[primaryKey];
          var instance    = this;

          url = url.replace(/\[\:\w*\]/, querystring);
          return $http.delete(url).then(function(response) {
            if (response.status == 200) {
              eventEmitter.emit('$delete:complete', instance);
              if (dependentDestroy.length >= 1) return destroyDependents(instance);
              unlinkAssociations(instance);
              delete _this.cached[instance.id];
            }
          });
        };

        function destroyDependents(instance) {
          _.each(dependentDestroy, function(dependent) {
            var associations = instance[dependent];
            _.each(associations, function(association) { 
              association.$delete();
            });
          });
          _.defer(function() { 
            unlinkAssociations(instance); 
            delete _this.cached[instance.id];
          });
        };

        function unlinkAssociations(instance) {
          _.each(associations.hasMany, function(hasManyInstance) {
            var associations = instance[hasManyInstance.klass.name.pluralize().camelize()];
            var name         = instance.constructor.name.camelize();
            _.each(associations, function(association) { association[name] = undefined; });
          });
          _.each(associations.belongsTo, function(belongsInstance) {
            var association = instance[belongsInstance.klass.name.camelize()];
            if (!association) return;
            var name        = instance.constructor.name.pluralize().camelize();
            _.remove(association[name], instance);
          });
        };

        // Model#where(terms, options)
        //
        // @param {terms} - JSON terms used to find all instances of an object matching specific parameters
        //
        // Used to find all instances of a model matching specific parameters:
        //
        //    System.where({placement: "window"})
        //
        // Returns a collection of system instances where the placement attribute is set to "window"
        _this.where = function(terms, options) {
          if (typeof terms != 'object') throw 'Argument to where must be an object';
          eventEmitter.emit('where:called', terms);
          if (!options) options = {lazy: false, overEager: false};
          var cached = _.where(this.cached, terms, this);
          options.cached = cached;
          options.multi  = true;
          return generateGET(terms, options);
        };

        // Model#find(terms, options)
        //
        // @param {terms}   - JSON terms used to find a single instance of the model matching the given 
        //                    parameters
        // @param {options} - Options include:
        //                      * Lazy: Whether or not to lazy-load options.
        //
        // Used to find the first instance of a model that matches the parameters given:
        //
        //    System.find({id: 1})
        //
        // Returns the system with an id of 1. By default, find eager-loads associated models. Passing
        // the lazy option will cause find not to query for associated models.
        _this.find = function(terms, options) {
          eventEmitter.emit('find:called', terms);
          if (typeof terms == 'number' || typeof terms == 'string') terms = argify(terms);
          if (typeof terms != 'object') throw 'Argument to find must be an object';
          if (!options) options = {lazy: false};
          var cached = _.chain(this.cached).where(terms, this).first().value();

          if (cached !== undefined) {
            eventEmitter.emit('find:complete', cached);
            return deferred(cached);
          } else {                      
            return generateGET(terms, options);
          }
        };

        function argify(terms /* string or number */) {
          var key           = terms;
          terms             = {};
          terms[primaryKey] = key;
          return terms;
        };

        // function makeModuleChain(module)
        //
        // @param {module} - String of a module name to generate a module chain:
        //
        //    "ActiveResource.API"
        //
        // Would return ['ActiveResource', 'ActiveResource.API'].
        //
        // Used to create an injector capable of finding a service, since it needs to have access
        // to a nested module's parents to work properly.
        //
        // This method is no longer in use in ActiveResource. It's been replaced by injecting the
        // $injector service, which is already instantiated with all modules in the application.
        // This function may still prove useful in later iterations.
        function makeModuleChain(module) {
          var mod = module.split('.');
          for (var i = 0, l = mod.length; i<l; i++) {
            if (i != 0) {
              mod[i] = mod[i-1] + '.' + mod[i];
            }
          }
          return mod;
        }

        // Model.instance#hasMany(table, providerArray)
        //
        // @param {table}        - [String] The name of the attribute to be associated on the hasMany collection.
        // @param {providerName} - [Array]  The name of the module and provider where the associated class can be found.
        //
        // Used to generate a hasMany collection for an instance of the model:
        //
        //    this.hasMany('sensors', ['ActiveResource.Mocks', 'ARMockSensor']);
        //
        // The call above generates a `sensors` property on the instance, which will use the ARMockSensor provider,
        // stored in the ActiveResource.Mocks module to instantiate sensor instances.
        //
        // The instantiated `sensors` property is an instance of ActiveResource::Collection. This gives it access
        // to properties like:
        //
        //    system.sensors.new()
        //
        // Which will generate a new sensor instance pre-associated with the system instance on which it was called.
        // For more details about the methods the hasMany collection gains, see ActiveResource::Collection. This method
        // also calls Model.belongsTo on the associated model.
        _this.prototype.hasMany   = function(table, options) {
          if (!options) options = {};

          var association = new Association('hasMany', this, table, options);
          associations.hasMany.add(association);

          _this[table.classify()]            = association.klass;
          this[table]                        = new Collection(association.klass, _this);
          this[table][_this.name.camelize()] = this;
        };

        _this.prototype.hasOne = function(table, options) {
          if (!options) options = {};
          var association = new Association('hasOne', this, table, options);
          associations.hasOne.add(association);
          if (!this[table]) {
            Object.defineProperty(this, table, {
              enumerable: false,
              configurable: true,
              value: association.klass.new()
            });
          }
          var inverseAssociation = Associations.getBelongs(association.klass, this);
          this[table][inverseAssociation.propertyName] = this;
        };

        // Model.instance#belongsTo(table, providerArray)
        //
        // @param {table}         - [String] The name of the model that this model belongs to.
        // @param {providerArray} - [Array]  The module and provider name of the associated model.
        //
        // Establishes a belongsTo relationship:
        //
        //    this.belongsTo('system', ['ActiveResource.Mocks', 'ARMockSystem']);
        //
        // Creates a `system` property on the instance of the model, and establishes a getter and a setter
        // for the `system` property. The value of the `system` property is stored in the closure created by
        // this function on the `localTable` property.
        //
        // The setter ensures that the hasMany relationship is only set on instances of the hasMany class. In
        // this case, the `system` attribute can only be set to objects of the class ARMockSystem defined in the
        // ActiveResource.Mocks module.
        _this.prototype.belongsTo = function(table, options) {
          if (!options) options = {};
          var association       = new Association('BelongsTo', this, table, options); 
          associations.belongsTo.add(association);
        };

        // function dependentDestroy(dependents)
        //
        // @param {dependents} - [Array or String] Comma separated list of dependents to destroy
        //                                         when the primary resource is destroyed
        // 
        // Registers dependencies to destroy when the primary resource is destroyed
        _this.dependentDestroy = function(dependents) {
          if (dependents.constructor.name != 'Array') dependents = [dependents];
          for (var i in dependents) { dependentDestroy.push(dependents[i]); };
        }

        Object.defineProperty(_this, 'primaryKey', {
          configurable: true,
          get: function()    { return primaryKey; },
          set: function(key) { primaryKey = key;  }
        });

        return _this;
      }
      return Base;
    }];
  });
