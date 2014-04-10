// HELPER METHODS
//

// String.prototype.downcase
//
// Shorthand for toLowerCase()
String.prototype.downcase = function() {
  return this.toLowerCase();
}

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
            if (Object.keys(terms).length == 0) terms = undefined;
            return _.where(this, terms, this);
          }
        });
      };

      return Cache;
    };
  });

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
        };

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
        };
      };

      function updateLocalInstance(instance, response, options) {
        if (options && options.update == false) return deferred(instance);
        instance.update(response);
        var primaryKey = Helpers.getPrimaryKeyFor(instance);
        instance.constructor.cached.cache(instance, primaryKey);

        instance.validations.updateInstance(instance);
        if (!options.lazy) return eagerLoad(instance).then(finishUpdate);
        return finishUpdate();

        function finishUpdate() {
          instance.establishBelongsTo();
          return deferred(instance);
        };
      };

      function setAssociationsAndUpdate(instance, response, options) {
        if (options && options.update == false) options.update = true;
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
      };

      return Serializer;
    }];
  });

angular
  .module('ActiveResource')
  .provider('ARHelpers', function() {
    this.$get = function() {
      // Non-duplicating push. Will not add an instance to an array if it is already
      // a member.
      Object.defineProperty(Array.prototype, 'nodupush', {
        enumerable: false,
        configurable: true,
        value: function(val) {
          if (!_.include(this, val)) this.push(val);
        }
      });
      return {
        getClassNameFor: function(association) {
          return association.klass.name.camelize();
        },
        getPrimaryKeyFor: function(classOrInstance) {
          if (classOrInstance.constructor == 'Function') return classOrInstance.primaryKey;
          else return classOrInstance.constructor.primaryKey;
        }
      };
    };
  });

angular
  .module('ActiveResource')
  .provider('ARMixin', function() {
    this.$get = function() {
      return function(receiver, giver, excludeFunctions) {
        if (giver.constructor.name == 'Function') {
          giver = new giver();
        }
        for (var i in giver) {
          function mixinProp() {
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
          if (excludeFunctions) {
            if (typeof giver[i] !== 'function') {
              mixinProp();
            }
          } else {
            mixinProp();
          }
        }
        return receiver;
      };
    };
  });

angular
  .module('ActiveResource')
  .provider('ARDeferred', function() {
    this.$get = ['$q', function($q) {
      // function deferred(instance, error)
      //
      // @param {instance} - An instance to wrap in a deferred object
      // @param {error}    - Error to return
      //
      // Returns an object or error wrapped in a deferred. Responds to then() method. Shortcut
      // for establishing these boilerplate lines.
      return function deferred(instance, error) {
        var deferred = $q.defer();
        if (error) deferred.reject(error);
        else deferred.resolve(instance);
        return deferred.promise;
      };
    }];
  });

angular
  .module('ActiveResource')
  .provider('ARQuerystring', function() {
    this.$get = function() {
      var querystring = {
        stringify: function(object) {
          var string = '';
          _.map(object, function(val, key) {
            if (string.length == 0) string +=       key + '=' + val;
            else                    string += '&' + key + '=' + val;
          });
          return string;
        },
        parse: function(string) {
        }
      };
      return querystring;
    };
  });

angular
  .module('ActiveResource')
  .provider('ARParameterize', function() {
    this.$get = function() {
      return function(url, object) {
        if (!url)    return;
        if (!object) return url;
        return url.replace(/\:\_*[A-Za-z]+/g, function(param) { 
          param = param.replace(/\:*/, ''); 
          return object[param];
        });
      }
    };
  });

angular
  .module('ActiveResource')
  .provider('URLify', function() {
    this.$get = ['ARParameterize', 'ARQuerystring', function(parameterize, querystring) {
      return function(url, terms) {

        if (!url) return;
        if (!terms) return url;

        var qs = '';
        if (querystring.stringify(terms)) qs = '?' + querystring.stringify(terms);
        if (url.match(/\[\:[A-Za-z]+\]/))       url = url.replace(/\[\:[A-Za-z]+\]/, qs);
        else if (url.match(/\:\_*[A-Za-z]+/))   url = parameterize(url, terms);

        return url;
      };
    }];
  });

angular
  .module('ActiveResource')
  .provider('ARGET', function() {
    this.$get = ['$http', 'ARDeferred', 'ARAssociations', 'ARHelpers', 'URLify', 
      function($http, deferred, Associations, Helpers, URLify) {

      function resolveSingleGET(data, terms, options) {
        if (data && data.length >= 1) {
          if (options.noInstanceEndpoint) return _.first(_.where(data, terms));
          else return _.first(data);
        }
        return data;
      };

      function resolveMultiGET(data, terms, options) {
        return data;
      };

      function transformSearchTermsToForeignKeys(instance, terms) {
        var associatedInstance, propertyName;
        var associations = Associations.get(instance);
        if (!associations) return;
        associations     = associations.belongsTo;
        _.each(associations, function(association) {
          if (terms[association.propertyName]) {
            associatedInstance     = terms[association.propertyName];
            propertyName           = association.propertyName;
            var foreignKey         = association.foreignKey;
            var primaryKey         = Helpers.getPrimaryKeyFor(terms[association.propertyName]);
            terms[foreignKey]      = associatedInstance[primaryKey];
            if (terms[foreignKey]) delete terms[association.propertyName];
          }
        });
        return [associatedInstance, terms, propertyName];
      };

      function getAllParams(url) {
        var params = [];
        url.replace(/\:[a-zA-Z_]+/g, function(param) { params.push(param); });
        params = _.map(params, function(param) { return param.slice(1); });
        return params
      };

      function queryableByParams(url, terms) {
        var params = getAllParams(url);
        var truth = true;
        _.each(params, function(param) {
          if (terms[param] === undefined) truth = false;
        });
        _.each(terms, function(value, termName) {
          if (!_.include(params, termName)) truth = false;
        });
        return truth;
      };

      return function generateGET(instance, url, terms, options) {
          var instanceAndTerms = transformSearchTermsToForeignKeys(instance, terms);
          var associatedInstance, terms, propertyName;
          if (instanceAndTerms) {
            associatedInstance = instanceAndTerms[0];
            terms              = instanceAndTerms[1];
            propertyName       = instanceAndTerms[2];
          }
          var config = {};
          if (queryableByParams(url, terms)) {
            url = URLify(url, terms);
          } else if(Object.keys(terms).length) {
            url = url.replace(/\/\:[a-zA-Z_]+/g, '').replace(/\:[a-zA-Z_]+/g, '');
            config.params = terms;
          }
          return $http.get(url, config).then(function(response) {
            var data = response.data;
            if (propertyName && associatedInstance) {
              if (data && data.push) {
                _.each(data, function(datum) { datum[propertyName] = associatedInstance; });
              } else {
                data[propertyName] = associatedInstance;
              }
            }
            if (options.multi) return resolveMultiGET(data, terms, options);
            else               return resolveSingleGET(data, terms, options);
          });
      };
    }];
  });

angular
  .module('ActiveResource')
  .provider('ARBase', function() {
    this.$get = ['ARAPI', 'ARCollection', 'ARAssociation', 'ARAssociations',
      'ARCache', 'ARSerializer', 'AREventable', 'ARValidations', '$http', '$q',
      '$injector', 'ARDeferred', 'ARGET', 'ARMixin', 'URLify', 'ARHelpers',
      function(API, Collection, Association, Associations, 
        Cache, Serializer, Eventable, Validations, $http, $q, 
        $injector, deferred, GET, mixin, URLify, Helpers) {

      function Base() {
        var _this                = this;

        _this.watchedCollections = [];

        // By default, the primary key is set to 'id'. It can be overridden using the
        // Model.instance#primaryKey method. This local variable is used by the other methods
        // to set the correct data and construct API requests.
        var primaryKey       = 'id';

        Object.defineProperty(_this, 'primaryKey', {
          configurable: true,
          get: function()    { return primaryKey; },
          set: function(key) { primaryKey = key; this.api.updatePrimaryKey(primaryKey); }
        });

        // @ASSOCIATIONS
        // We use an associations object to store the hasMany and belongsTo associations for each
        // model. These are stored on associations.hasMany and associations.belongsTo respectively.
        var associations     = new Associations(_this);

        // Dependents to destroy when the primary resource is destroyed. Set with
        // _this.dependentDestroy(dependents)
        var dependentDestroy = [];

        // @API
        // Instantiates a new ActiveResource::API, which comes with methods for setting the
        // URLs used by functions like $save, $create, $delete, and $update. See
        // ActiveResource::API for more details.
        this.api             = new API(this);

        // @EVENT EMITTER
        // Make models event-driven
        mixin(_this, Eventable);

        // @MODEL CACHE
        //
        // Creates a cache for the model. The cache is used by methods like Model#find and
        // Model#where, to first check whether or not an instance with a given primary key
        // already exists on the client before querying the backend for it. Model#find will not
        // query the backend if it finds an instance in the cache. Model#where will combine
        // both the cached instances and those it retrieved from the backend.
        //
        // The cache is also used to ensure model instances are the same object across the
        // application. In different providers or directives, if two objects are meant to be
        // the exact same object (===), as represented by the primary key, then they must be
        // the exact same object in order for Angular's dirty checking functionality to
        // work as expected.
        if (!_this.cached) _this.cached = new Cache();

        // @MODEL CACHE
        //
        // function cacheInstance(instance) 
        //
        // A wrapper for cached.cache, which passes in the primary key that has been
        // set on the instance. Puts the instance in the cache.
        function cacheInstance(instance) {
          _this.cached.cache(instance, primaryKey);
        };

        function findCachedMatching(terms) {
          return _.where(_this.cached, terms, _this);
        };

        // @SERIALIZER
        //
        serializer = new Serializer();

        _this.prototype.toJSON    = function(options) {
          return _this.prototype.serialize.call(this, options);
        };

        _this.prototype.serialize = function(options) {
          return serializer.serialize(this, options);
        };
        
        // 
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
        _this.prototype.$save = function(instance, url, put) {
          
          if (!instance) instance = this;

          // If passed with no arguments, we attempt to parse what is meant by the $save.
          // If the instance contains a primary key, it should save to the updateURL as
          // a PUT request. Otherwise, it should be a new instance saved to the createURL.
          if (instance && instance[primaryKey] && !url) {
            url = URLify(_this.api.updateURL, instance);
            if (put !== false) put = true;
          } else if (!url) {
            url = _this.api.createURL;
          }

          _this.emit('$save:called', instance);
          var json = serializer.serialize(instance);

          if (instance.$invalid) {
            _this.emit('$save:fail', instance);
            return deferred(null, instance);
          }

          if (put) method = 'put';
          else     method = 'post';

          return $http[method](url, json)
            .then(function(response) {
              return serializer.deserialize(response, instance).then(function(instance) {
                _this.emit('$save:complete', {data: response, instance: instance});
                return deferred(instance);
              });
            });
        };

        // Model.instance#$update(data)
        //
        // @param data {object} - Optional data to use to update the instance
        //
        // Updates the instance, and then persists the instance to the database via the
        // $save method. Notice that methods prefaced with a dollar sign ($update, $save, 
        // $create, and $delete),perform unsafe API interactions, like PUT, POST, and DELETE.
        //
        // Model.instance#update below is distinct from $update, because it only works with the
        // in-memory copy of the data, and does not attempt to persist the changes to the API.
        _this.prototype.$update = function(data) {
          var instance = this;
          _this.emit('$update:called', {instance: instance, data: data});
          var url      = _this.api.updateURL;
          if (!url) return;
          if (url.match(/\:\w+/)) url = url.replace(/\:\w+/, this[primaryKey]);

          if (data) {
            return instance.update(data).then(function(response) {
              instance = response; 
              return save();
            });
          } else {
            return save();
          }

          function save() {
            return instance.$save(instance, url, 'put');
          }
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

          _this.emit('update:called', {data: data, instance: this});

          for (var attr in data) {
            if (instanceHasManyOf(attr))       updateHasManyRelationship.call(this, data[attr], attr);
            else if (instanceHasOneOf(attr))   updateHasOneRelationship.call(this, data[attr], attr);
            else if (instanceBelongsTo(attr))  updateBelongsRelationship.call(this, data[attr], attr)
            else if (isSettableProperty(attr)) this[attr] = data[attr];
          }

          var instance = this;

          return serializer.deserialize(data, instance, {lazy: true, update: false})
            .then(function(response) {
              _this.emit('update:complete', {data: data, instance: instance});
              return deferred(instance);
            });

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
          if (!data) data = {};
          _this.emit('$create:called', data);
          var instance = _this.new(data);
          instance.establishBelongsTo();
          
          return instance.$save().then(function(response) {
            instance = response;
            cacheInstance(instance);
            return deferred(instance);
          });
        };

        // Model#new(data)
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
          _this.emit('new:called', data);
          if (typeof data == 'Number') data = argify(data);
          if (data && this.cached[data[primaryKey]]) return this.cached[data[primaryKey]];

          _this.prototype.integer = function(propertyName) {
            var instance    = this;
            var validations = {};
            validations[propertyName] = {integer: {ignore: /\,/g } };
            instance.validates(validations);
            instance[propertyName] = data[propertyName];
          };

          _this.prototype.number = function(propertyName) {
            var instance = this;
            var validations = {};
            validations[propertyName] = {numericality: {ignore: /\,/g } };
            instance.validates(validations);
            instance[propertyName] = data[propertyName];
          };

          _this.prototype.boolean = function(propertyName) {
            var instance = this;
            var validations = {};
            validations[propertyName] = {boolean: true};
            instance.validates(validations);
            instance[propertyName] = data[propertyName];
          };

          _this.prototype.string = function(propertyName) {
            var instance = this;
            var validations = {};
            validations[propertyName] = {string: true};
            instance.validates(validations);
            instance[propertyName] = data[propertyName];
          };

          // Instance#computedProperty(name, valueFn, dependents)
          //
          // @param name       {string}         - The name of the property to be computed from other properties
          //
          // @param valueFn    {func}           - The function used to compute the new property from the others
          //
          // @param dependents {string | array} - The name of the property or list of the properties that this 
          //                                      property depends upon.
          //
          // Example:
          //
          //    function Tshirt(attributes) {
          //      this.number('price');
          //
          //      this.computedProperty('salePrice', function() {
          //        return this.price - (this.price * 0.2);
          //      }, 'price');
          //
          //      this.computedProperty('superSalePrice', function() {
          //        return this.price - this.salePrice;
          //      }, ['price', 'salePrice']);
          //    }
          //
          // The computed property function creates configurable getters and setters (that can thus be reconfigured).
          // In the first example, the price setter calls the salePrice setter whenever it updates. In the second
          // example, the salePrice setter continues to be called by the price setter, and additionally calls the
          // superSalePrice setter afterward.
          //
          // This chainability allows us to create complex inter-dependencies, where an update to one property
          // updates many others. In order to all this to occur, we use the `__lookupSetter__` function to retrieve
          // the value of the previous setter.
          _this.prototype.computedProperty = function(name, valueFn, dependents) {
            var instance = this;
            if (!dependents) dependents = [];
            if (!dependents.push) dependents = [dependents];

            var local2;
            Object.defineProperty(instance, name, {
              enumerable: true,
              configurable: true,
              get: function() { return local2; },
              set: function() {
                local2 = valueFn.apply(instance);
                return local2;
              }
            });

            _.each(dependents, function(dependent) {
              var local;
              var previousSetter = instance.__lookupSetter__(dependent);
              var dependentVal   = instance[dependent];
              Object.defineProperty(instance, dependent, {
                enumerable: true,
                configurable: true,
                get: function()    { return local; },
                set: function(val) {
                  if (val !== undefined && val != 'set') local = val;
                  if (previousSetter) {
                    if (local == val) previousSetter();
                    else local = previousSetter();
                  }
                  instance[name] = 'set';
                  return local;
                }
              });
              if (data && data[dependent]) instance[dependent] = data[dependent];
              else instance[dependent] = dependentVal;
            });
          };

          var instance = new this(data);

          setPrimaryKey(instance, data);

          cacheInstance(instance);

          _.each(associations.belongsTo, function(model) {
            var name = nameOfBelongsToModel(model);
            if (data && data[name] !== undefined) { 
              instance[name] = data[name]; 
            };
          });

          // Add any data passed to the hasMany relationships
          _.each(associations.hasMany, function(collection) {
            var name = collection.klass.name.pluralize().camelize();
            instance[name][this.name.camelize()] = instance;
            if (data[name] !== undefined) addNewDataToCollection(data, name, instance); 
          }, this);

          _.each(associations.hasOne, function(rel) {
            var name = rel.propertyName;
            if (data[rel.propertyName] !== undefined) addNewDataToHasOne(data, name, instance, rel);
          });

          addValidations(instance);

          _this.emit('new:complete', instance);
          return instance;
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

          // Generate start event
          _this.emit('where:called', terms);

          // Normalize variables
          if (typeof terms != 'object') throw 'Argument to where must be an object';
          if (!options) options = {lazy: false, overEager: false};
          var cached = _this.cached.where(terms);
          options.cached = cached;
          options.multi  = true;
          var url = _this.api.indexURL || _this.api.showURL;

          // Generate a GET request for all instances matching the given params, deserialize each
          // into the appropriate class, and return the found collection
          return GET(_this, url, terms, options).then(function(json) {
            var results = [];
            for (var i in json) {
              var instance = _this.new(json[i]);
              results.push(instance);
              serializer.deserialize(json[i], instance, options);
            }

            // Watch all collections that get assigned out as variables
            _this.watchedCollections.push(results);

            _this.emit('where:complete', {instance: results, data: json});
            return results;
          });
        };

        // Model#all()
        //
        // Returns all instances of a model. Equivalent to Model#where({})
        _this.all = function(options) {

          // Generate start event
          _this.emit('all:called');

          return _this.where({}, options).then(function(results) {
            var deferred = $q.defer();
            deferred.resolve(results);
            _this.emit('all:complete', results);
            return deferred.promise;
          });
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
          var cached;

          // Emit start event
          _this.emit('find:called', terms);

          // Normalize variables
          if (typeof terms == 'number' || typeof terms == 'string') terms = argify(terms);
          if (typeof terms != 'object') throw 'Argument to find must be an object';
          if (!options) options = {lazy: false};
          if (!options.forceGET) cached = _.first(_this.cached.where(terms));
          var url    = _this.api.showURL || _this.api.indexURL;

          // If no instance is found in the cache, generate a GET request, and return the
          // found instance, deserialized into the appropriate class
          if (cached !== undefined) {
            _this.emit('find:complete', {instance: cached, data: cached, message: 'Backend not queried. Found in cache'});
            return deferred(cached);
          } else {
            return GET(_this, url, terms, options).then(function(json) {
              var instance = _this.new(json);
              _this.emit('find:complete', {instance: instance, data: json});
              return serializer.deserialize(json, instance, options);
            });
          }
        };

        // Model.instance#$delete(terms)
        //
        // @param {terms} - JSON terms used to delete 
        // 
        _this.prototype.$delete = function() {
          var instance    = this;
          _this.emit('$delete:called', this);
          var queryterms  = {};
          var config = {};
          var url = _this.api.deleteURL;
          queryterms[primaryKey] = instance[primaryKey];
          // if user has provided an attr in their deleteURL definition
          // then we URLify the deleteURL. Else we pass in params as 
          if(_this.api.deleteURL.indexOf('/:') !== -1) {
            url = URLify(_this.api.deleteURL, queryterms);
          } else {
            config = {params: queryterms};
          }
          return $http.delete(url, config).then(function(response) {
            if (response.status == 200) {
              removeFromWatchedCollections(instance);
              _this.emit('$delete:complete', {data: response, instance: instance});
              if (dependentDestroy.length >= 1) return destroyDependents(instance);
              unlinkAssociations(instance);
              delete _this.cached[instance[primaryKey]];
            }
          });
        };

        function removeFromWatchedCollections(instance) {
          _.each(_this.watchedCollections, function(watchedCollection) {
            _.remove(watchedCollection, instance);
          });
        }

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
                if (belongs && belongs.push) belongs.nodupush(this);
                else belongs = this;
              }
            };
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

        function removeOldHasManyInstances(hasManyCollection, newHasManyObjects, 
            primaryKeyName, primaryKeys) {
          _.remove(hasManyCollection, function(hasManyInstance) {
            var keep = _.include(primaryKeys, hasManyInstance[primaryKeyName]);
            if (keep == false) {
              delete hasManyInstance.constructor.cached[hasManyInstance[primaryKeyName]];
              return true;
            }
          });
        }

        function createOrUpdateHasManyInstances(hasManyCollection, newHasManyObjects, 
            primaryKeyName, primaryKeys) {
          var _first, _cons, _cached;

          _first = _.first(hasManyCollection);
          if (_first !== undefined) _cons  = _first.constructor;
          if (_cons !== undefined) _cached = _cons.cached;

          _.each(newHasManyObjects, function(hasManyInstanceAttrs) {
            var instance;
            if (_cached !== undefined) {
              var search = {};
              search[primaryKeyName] = hasManyInstanceAttrs[primaryKeyName];
              instance = _cached.where(search);
            }
            if (instance && instance.length) {
              instance[0].update(hasManyInstanceAttrs);
            } else {
              hasManyCollection.new(hasManyInstanceAttrs);
            }
          }, this);
        }

        // Receives an array of new plain-old Javascript objects, and the name of a collection
        // to update, e.g.:
        //
        //    updateHasManyRelationship([{
        //      id: 1,
        //      name: 'Great post'
        //    }, 'posts']
        //
        // This removes any previously associated instances. The entire collection will be the new
        // instances added here.
        //
        // If you don't want to remove all old instances, and instead only add new instances, use
        // collection#new.
        function updateHasManyRelationship(newCollectionPOJOs, collectionName) {
          var hasManyCollection = this[collectionName.camelize()];
          var _first            = _.first(hasManyCollection);
          if (!_first) {
            return createOrUpdateHasManyInstances(hasManyCollection, newCollectionPOJOs);
          }

          var primaryKeyName    = Helpers.getPrimaryKeyFor(_first);
          var primaryKeys       = _.chain(newCollectionPOJOs)
                                   .map(function(o) { return o[primaryKeyName]; })
                                   .compact()
                                   .unique()
                                   .value();

          removeOldHasManyInstances(hasManyCollection, newCollectionPOJOs, primaryKeyName, primaryKeys);
          createOrUpdateHasManyInstances(hasManyCollection, newCollectionPOJOs, primaryKeyName, primaryKeys);
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
            'associations', 'primaryKey', 'hasMany', 'hasOne', 'belongsTo', 'validate', '$valid',
            '$invalid', '$errors', 'validations', 'validates'];
          _.remove(properties, function(prop) {
            return _.include(specialProps, prop);
          });
          return properties;
        };

        function addValidations(instance) { 
          if (instance.validations === undefined) {
            instance.validates({});
          };

          instance.validate = function(field) {
            return instance.validations.validate(field, instance);
          };

          instance.validateIfErrored = function(field) {
            if (instance.$errors[field]) instance.validate(field, instance);
          };

          Object.defineProperty(instance, '$valid', {
            get: function() { 
              return instance.validate(); 
            }
          });

          Object.defineProperty(instance, '$invalid', {
            get: function() { return !instance.$valid; }
          });

          Object.defineProperty(instance, '$errors', {
            get: function() {
              return instance.validations.$errors;
            }
          });

          instance.clearErrors = function(field) {
            instance.validations.clearErrors(field);
          }
        };

        function setPrimaryKey(instance, data) {
            instance[primaryKey] = data[primaryKey];
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
            var belongsToAssociations = Associations.get(rel).belongsTo;
            var thisAssociation;
            _.each(belongsToAssociations, function(association) {
              if (association.klass == instance.constructor) {
                thisAssociation = association;
              };
            });
            data[name][thisAssociation.propertyName] = instance;
            var val = rel.klass.new(data[name]);
          }
          Object.defineProperty(instance, name, {
            enumerable: true,
            configurable: true,
            value: val
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
            delete _this.cached[instance[primaryKey]];
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

        function emptyCollection(association) {
          _.remove(association, function(instance) { return instance; });
        }

        function argify(terms /* string or number */) {
          var key           = terms;
          terms             = {};
          terms[primaryKey] = key;
          return terms;
        };
        
        var validations;
        Object.defineProperty(_this.prototype, 'validates', {
          enumerable: false,
          value: function(newValidations) {
            Object.defineProperty(this, 'validations', {
              enumerable: false,
              configurable: true,
              get: function() { return validations; },
              set: function(newValidations) {
                if (validations === undefined) validations = new Validations(newValidations, this);
                validations.addValidations(newValidations);
              }
            });
            this.validations = newValidations;
          }
        });

        // Model.instance#hasMany(table, providerArray)
        //
        // @param {table}        - [String] The name of the attribute to be associated on the hasMany 
        //                         collection.
        // @param {providerName} - [Array]  The name of the module and provider where the associated 
        //                         class can be found.
        //
        // Used to generate a hasMany collection for an instance of the model:
        //
        //    this.hasMany('sensors', ['ActiveResource.Mocks', 'ARMockSensor']);
        //
        // The call above generates a `sensors` property on the instance, which will use the 
        // ARMockSensor provider, stored in the ActiveResource.Mocks module to instantiate sensor 
        // instances.
        //
        // The instantiated `sensors` property is an instance of ActiveResource::Collection. This 
        // gives it access to properties like:
        //
        //    system.sensors.new()
        //
        // Which will generate a new sensor instance pre-associated with the system instance on which 
        // it was called. For more details about the methods the hasMany collection gains, see 
        // ActiveResource::Collection. This method also calls Model.belongsTo on the associated model.
        _this.prototype.hasMany = function(name, options) {
          if (!options) options = {};

          var association = new Association('hasMany', this, name, options);
          associations.hasMany.add(association);

          _this[name.classify()]            = association.klass;

          this[name]                        = new Collection(association.klass, _this);
          this[name][_this.name.camelize()] = this;
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

        return _this;
      }
      return Base;
    }];
  });
