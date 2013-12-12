angular
  .module('ActiveResource')
  .provider('ARBase', function() {
    this.$get = ['ARAPI', 'ARCollection', '$http', '$q', 'json', '$rootScope', '$injector',
      function(API, Collection, $http, $q, json, $rootScope, $injector) {

      // String.prototype#downcase
      //
      // Copy of the Ruby method that lowercases a string. Used for brevity.
      String.prototype.downcase = function() {
        return this.toLowerCase();
      }

      function Base() {
        var _this          = this;

        // We use a closure to store the hasMany relationships defined on a given model.
        // The objects stored in the hasMany array are the constructors of the associated models.
        // These are used throughout the rest of ActiveResource.Base to ensure data passed in
        // to model attributes that are associations gets instantiated with the associated class.
        var hasMany        = [];

        // Similarly, belongsTo stores the name of the model that the model belongsTo. 
        var belongsTo      = [];

        // Instantiates a new ActiveResource::API, which comes with methods for setting the
        // URLs used by functions like $save, $create, $delete, and $update. See
        // ActiveResource::API for more details.
        this.api           = new API(this);

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
          if (instance && instance.id) instance.constructor.cached[instance.id] = instance;
        };

        // The base object stores some common functionality.
        var base           = {};

        function updateLocalInstance(instance, response) {
            instance = instance.update(response)
            cacheInstance(instance);
            instance.establishBelongsTo();
            return deferred(instance);
        };

        base.$save = function(instance, url) {
          var jsonified = json.toJson(instance);
          return $http.post(url, jsonified).then(function(response) {
            response = response.data
            if (responseContainsPrimaryKeys(response)) return setAssociationsAndUpdate(instance, response);
            return updateLocalInstance(instance, response);
          });
        };
        
        function responseContainsPrimaryKeys(response) {
          return !!(belongsTo.length && response[belongsTo[0].name.downcase()]);
        };

        function setAssociationsAndUpdate(instance, response) {
          if (belongsTo.length && response[belongsTo[0].name.downcase()]) {
              var association    = belongsTo[0];
              var associatedName = association.name.downcase();
              return belongsTo[0].find({id: response[associatedName]}).then(function(association) {
                response[associatedName] = association;
                return updateLocalInstance(instance, response);
              });
          };
        };

        // function deferred(instance)
        //
        // @param {instance} - An instance to wrap in a deferred object
        //
        // Returns an object wrapped in a deferred. Responds to then() method. Shortcut
        // for establishing these three boilerplate lines.
        function deferred(instance) {
          var deferred = $q.defer();
          deferred.resolve(instance);
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
          if (!model || !model.name) return;
          return model.name.downcase();
        };

        // Model.instance#establishBelongsTo
        // 
        // Called internally to sync a resource with the collection(s) it belongs to. If a System
        // has many Sensors, whenever a sensor instance needs to establish its initial belongs to
        // relationship, it calls this method to push itself into the right system instance.
        _this.prototype.establishBelongsTo = function() {
          if (belongsTo) {
            for (var i in belongsTo) {
              var association     = belongsTo[i];
              var associationName = nameOfBelongsToModel(association);
              if (instanceIsAssociatedWith(this, association)) {
                var belongs = this[associationName][this.constructor.name.pluralize().downcase()];

                if (!_.include(belongs, this)) belongs.push(this);
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

          if (belongsTo && this[belongsTo]) return this[belongsTo].$save(instance, url);
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
        _this.prototype.update = function(data) {
          var hasManyNames = _.map(hasMany, function(klass) {
            var kstr = klass.toString()
            kstr     = kstr.replace(/function\s/, '');
            return kstr.slice(0, kstr.match(/\(/).index).pluralize().downcase();
          });
          
          for (var attr in data) {
            if (_.include(hasManyNames, attr.downcase())) {
              this[attr] = _.map(data[attr], function(idata) { return new this.constructor[attr.classify(idata)]; }, this);
            } else {
              this[attr] = data[attr];
            }
          }
          return this;
        };

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
          var instance = _this.new(data);
          instance.establishBelongsTo();
          return instance.$save().then(function(response) {
            instance = response;
            cacheInstance(instance);
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
          if (typeof data == 'Number') data = {id: data};
          if (data && this.cached[data.id]) return this.cached[data.id];
          var instance = new this(data);

          cacheInstance(instance);
          // Set the belongsTo association for any dependents
          _.each(hasMany, function(collection) {
            instance[collection.name.pluralize().downcase()][this.name.downcase()] = instance;
          }, this);
          _.each(belongsTo, function(model) {
            var name = nameOfBelongsToModel(model);
            if (data && data[name]) instance[name] = data[name];
          });
          return instance;
        };

        // function generateGET(terms, multi)
        //
        // @param {terms} - JSON terms used to create a GET request. These will be parsed into a query string.
        // @param {multi} - Boolean. If false, the GET request will return the first instance it finds. If true,
        //                  it will return a collection of all instances that match the query.
        //
        // Used to generate a GET request for a JSON object (`terms`). The terms will be parsed into a query string
        // for the GET request. The request will use the ActiveResource::API#findURL associated with the model to
        // generate the request, subbing in the query string for the terms. If `multi` is set to true, the request
        // will return a collection matching the query. If `multi` is set to false, the first result found will
        // be returned.
        function generateGET(terms, multi) {
            var querystring = '?';
            _.map(terms, function(val, key) { 
              if(querystring.slice(-1) == '?') querystring += key + '=' + val; 
              else                             querystring += '&' + key + '=' + val;
            });
            var url = _this.api.findURL.replace(/\[\:\w+\]/, querystring);
            return $http.get(url).then(function(response) {
              var data = response.data;
                  
              if (multi) return resolveMultiGET(data);
              else       return resolveSingleGET(data);
            });
        };

        // function resolveSingleGET(data)
        //
        // @param {data} - JSON data returned from the API request to be used to create a new instance.
        //
        // Resolves the result of a GET request into a new instance of the model wrapped in a deferred object.
        // Used with Model#find(id) to locate a resource that is not stored in the cache. Instantiating the new
        // resource will add it to the cache.
        function resolveSingleGET(data) {
          if (data.length > 1) data = _.first(data);
          var instance = _this.new(data);
          if (responseContainsPrimaryKeys(data)) return setAssociationsAndUpdate(instance, data);
          return updateLocalInstance(instance, data);
        };

        // function resolveMultiGET(data)
        //
        // @param {data} - JSON data returned from the API request to be used to create a collection of new instances.
        // 
        // Resolves the result of a GET request into a collection of instances found on the API. Used with
        // Model#where(terms) to return results stored on the database.
        function resolveMultiGET(data) {
          var results = [];
          for (var i in data) results.push(_this.new(data[i]));
          return deferred(results);
        };

        // Model.instance#$delete(terms)
        //
        // @param {terms} - JSON terms used to delete 
        // 
        _this.prototype.$delete = function() {
          var url         = _this.api.deleteURL;
          var querystring = '?id=' + this.id;
          var instance    = this;

          url = url.replace(/\[\:\w*\]/, querystring);
          return $http.delete(url).then(function(response) {
            if (response.status == '200') {
              _.each(belongsTo, function(belongsInstance) {
                var association = instance[belongsInstance.name.downcase()];
                var name        = instance.constructor.name.pluralize().downcase();
                _.remove(association[name], instance);
              });
              delete _this.cached[this.id];
            }
          });
        };

        // Model#where(terms)
        //
        // @param {terms} - JSON terms used to find all instances of an object matching specific parameters
        //
        // Used to find all instances of a model matching specific parameters:
        //
        //    System.where({placement: "window"})
        //
        // Returns a collection of system instances where the placement attribute is set to "window"
        _this.where = function(terms) {
          if (typeof terms != 'object') throw 'Argument to where must be an object';
          var cached = _.where(this.cached, terms, this);
          if (cached.length > 0) return deferred(cached);
          else                   return generateGET(terms, true);
        };

        // Model#find(terms)
        //
        // @param {terms} - JSON terms used to find a single instance of the model matching the given parameters
        //
        // Used to find the first instance of a model that matches the parameters given:
        //
        //    System.find({id: 1})
        //
        // Returns the system with an id of 1.
        _this.find = function(terms) {
          if (typeof terms == 'number') terms = {id: terms};
          if (typeof terms != 'object') throw 'Argument to find must be an object';
          var cached = _.chain(this.cached).where(terms, this).first().value();

          if (cached !== undefined) return deferred(cached);
          else                      return generateGET(terms);
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
        _this.prototype.hasMany   = function(table, providerArray) {
          var module              = providerArray[0];
          var providerName        = providerArray[1];

          module = makeModuleChain(module);

          var provider  = $injector.get(providerName);
          var klass     = provider;

          _this[table.classify()] = provider;
          hasMany.push(klass);

          this[table] = new Collection(klass, _this);
          this[table][_this.name.downcase()] = this;
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
        _this.prototype.belongsTo = function(table, providerArray) {
          var localTable = undefined;
          var provider   = $injector.get(providerArray[1]);
          if (!_.include(belongsTo, provider)) belongsTo.push(provider);
          Object.defineProperty(this, table, {
            get: function()    { return localTable; },
            set: function(val) {
             if (!val || !val.constructor || !val.constructor.name == this.constructor.name) throw table + ' must be class of ' + table.toUpperCase(); 
             localTable = val;
             var thisTableName  = this.constructor.name.pluralize().downcase()
             var belongsToArray = localTable[thisTableName];
             if (this.id && belongsToArray && !_.include(belongsToArray, this)) belongsToArray.push(this);
            }
          });
        };

        return _this;
      };
      
      return Base;
    }];
  });
