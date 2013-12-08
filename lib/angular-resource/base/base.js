angular
  .module('ActiveResource')
  .provider('ARBase', function() {
    this.$get = ['ARAPI', 'ARCollection', '$http', '$q',
      function(API, Collection, $http, $q) {

      String.prototype.downcase = function() {
        return this.toLowerCase();
      }

      function Base() {
        var _this          = this;
        var hasMany        = [];
        var belongsTo      = undefined;
        this.api           = new API(this);
        
        if (!_this.cached) _this.cached = {};

        function establishBelongsTo() {
          if (belongsTo) {
            var belongs = this[belongsTo][this.constructor.name.pluralize().downcase()];
            belongs.push(this);
            if (!this.id) this.id = belongs.indexOf(this);
          }
        }

        _this.prototype.$save = function() {
          console.log('Persisting to backend');
          establishBelongsTo.call(this);
          this.constructor.cached[this.id] = this;
        };

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
        };

        _this.$create = function(data) {
          establishBelongsTo.call(this);
          var instance = new this(data);
          this.cached[instance.id] = instance;
          return instance;
        };

        _this.new = function(data) {
          if (data && !data.id) data = {id: data};
          if (data && this.cached[data.id]) return this.cached[data.id];
          var instance = new this(data);

          if (data && data.id) this.cached[data.id] = instance;
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
          var deferred = $q.defer();
          deferred.resolve(_this.new(data));
          return deferred.promise;
        };

        function resolveMultiGET(data) {
          var deferred = $q.defer();
          var results = [];
          for (var i in data) results.push(_this.new(data[i]));
          deferred.resolve(results);
          return deferred.promise;
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

        _this.hasMany             = function(table, providerArray) {
          var module              = providerArray[0];
          var providerName        = providerArray[1];
          module = makeModuleChain(module);
          var $injector = angular.injector(module);
          var provider  = $injector.get(providerName);
          var klass               = provider;
          _this[table.classify()] = provider;
          hasMany.push(klass);
          this.prototype[table]   = new Collection(klass, this);
          provider.belongsTo(_this.name.downcase());
        };

        _this.belongsTo = function(table) {
          belongsTo     = table;
        };

        return _this;
      };
      
      return Base;
    }];
  });
