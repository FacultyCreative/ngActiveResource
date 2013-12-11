angular
  .module('ActiveResource')
  .provider('ARBase', function() {
    this.$get = ['ARAPI', 'ARCollection', '$http', '$q', 'json', '$rootScope',
      function(API, Collection, $http, $q, json, $rootScope) {

      String.prototype.downcase = function() {
        return this.toLowerCase();
      }

      function Base() {
        var _this          = this;
        var hasMany        = [];
        var belongsTo      = undefined;
        this.api           = new API(this);
        var base           = {};
        
        if (!_this.cached) _this.cached = {};

        base.$save = function(instance, url) {
          var jsonified = json.toJson(instance);
          return $http.post(url, jsonified).then(function(response) {
            instance = instance.update(response.data)
            cacheInstance(instance);
            instance.establishBelongsTo();
            return deferred(instance);
          });
        };

        // If the instance has an ID, add it to the cache of its constructor. E.g.:
        // sensor => {id: 1, name: "Johnny's Window"}
        // sensor.constructor = Sensor
        //
        // expect(Sensor.cached[1]).toEqual(sensor);
        function cacheInstance(instance) {
          instance.constructor.cacheInstance(instance);
        };

        _this.cacheInstance = function(instance, constructor) {
          if (!constructor)        constructor = instance.constructor;
          if (instance[belongsTo]) instance[belongsTo].constructor.cacheInstance(instance, constructor);
          if (instance.id) constructor.cached[instance.id] = instance;
        }

        // Returns an object wrapped in a deferred. Responds to then() method. Shortcut
        // for establishing these three boilerplate lines each time.
        function deferred(instance) {
          var deferred = $q.defer();
          deferred.resolve(instance);
          return deferred.promise;
        };

        // Model.instance#establishBelongsTo
        // 
        // Called internally to sync a resource with the collection it belongs to. If a System
        // has many Sensors, whenever a sensor instance needs to establish its initial belongs to
        // relationship, it calls this method to push itself into the right system instance.
        _this.prototype.establishBelongsTo = function() {
          if (belongsTo) {
            var belongs = this[belongsTo][this.constructor.name.pluralize().downcase()];
            if (!_.include(belongs, this)) belongs.push(this);
            if (!this.id) this.id = belongs.indexOf(this);
          }
        };

        // Model.instance#$save 
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

          if (belongsTo) return this[belongsTo].$save(instance, url);
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
        // When a model calls create, a new instance is built using the arugments passed in,
        // and immediately saved. This calls Model.instance#$save, which will attempt to persist
        // the instance to the backend. If the backend returns success, the new instance is added to
        // the cache and returned.
        _this.$create = function(data) {
          var instance = _this.new(data);
          instance.establishBelongsTo();
          return instance.$save().then(function(response) {
            instance = response;
            cacheInstance(instance);
            return instance;
          });
        };

        _this.new = function(data) {
          if (typeof data == 'Number') data = {id: data};
          if (data && this.cached[data.id]) return this.cached[data.id];
          var instance = new this(data);

          cacheInstance(instance);
          // Set the belongsTo association for any dependents
          _.each(hasMany, function(collection) {
            instance[collection.name.pluralize().downcase()][this.name.downcase()] = instance;
          }, this);
          return instance;
        };

        function resolveCached(cached) {
            var deferred = $q.defer();
            deferred.resolve(cached);
            return deferred.promise;
        };

        function resolveGET(terms, multi) {
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

        function resolveSingleGET(data) {
          if (data.length > 1) data = _.first(data);
          var instance = _this.new(data);
          return deferred(instance);
        };

        function resolveMultiGET(data) {
          var results = [];
          for (var i in data) results.push(_this.new(data[i]));
          return deferred(results);
        };

        _this.where = function(terms) {
          if (typeof terms != 'object') throw 'Argument to where must be an object';
          var cached = _.where(this.cached, terms, this);
          if (cached.length > 0) return resolveCached(cached);
          else                   return resolveGET(terms, true);
        };

        _this.find = function(terms) {
          if (typeof terms == 'number') terms = {id: terms};
          if (typeof terms != 'object') throw 'Argument to find must be an object';
          var cached = _.chain(this.cached).where(terms, this).first().value();

          if (cached !== undefined) return resolveCached(cached);
          else                      return resolveGET(terms);
        };

        function makeModuleChain(module) {
          var mod = module.split('.');
          for (var i = 0, l = mod.length; i<l; i++) {
            if (i != 0) {
              mod[i] = mod[i-1] + '.' + mod[i];
            }
          }
          return mod;
        }

        _this.prototype.hasMany   = function(table, providerArray) {
          var module              = providerArray[0];
          var providerName        = providerArray[1];

          module = makeModuleChain(module);

          var $injector = angular.injector(module);
          var provider  = $injector.get(providerName);
          var klass               = provider;

          _this[table.classify()] = provider;
          hasMany.push(klass);

          this[table] = new Collection(klass, _this);
          this[table][_this.name.downcase()] = this;
          provider.belongsTo(_this.name.downcase());
        };

        _this.belongsTo = function(table) {
          belongsTo     = table;
        };

        _this.prototype.belongsTo = function(table, providerArray) {
          var localTable = undefined;
          Object.defineProperty(this, table, {
            get: function()    { return localTable; },
            set: function(val) {
             if (!val || !val.constructor || !val.constructor.name == this.constructor.name) throw table + ' must be class of ' + table.toUpperCase(); 
             localTable = val;
             var thisTableName  = this.constructor.name.pluralize().downcase()
             var belongsToArray = localTable[thisTableName];
             if (this.id && !_.include(belongsToArray, this)) belongsToArray.push(this);
            }
          });
        };

        return _this;
      };
      
      return Base;
    }];
  });
