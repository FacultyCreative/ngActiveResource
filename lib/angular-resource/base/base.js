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

          // Set the belongsTo association for any dependents
          _.each(hasMany, function(collection) {
            instance[collection.name.pluralize().downcase()][this.name.downcase()] = instance;
          }, this);

          return instance;
        };

        _this.where = function(terms) {
          if (typeof terms != 'object') throw 'Argument to where must be an object';
          return _.where(this.cached, terms, this);
        };

        _this.find = function(terms) {
          if (typeof terms == 'number') terms = {id: terms};
          if (typeof terms != 'object') throw 'Argument to find must be an object';
          var cached = _.chain(this.cached).where(terms, this).first().value();

          if (cached !== undefined) {
            var deferred = $q.defer();
            deferred.resolve({data: cached});
            return deferred.promise;
          } else {
            // todo: add support for terms other than id
            var url = _this.api.findURL.replace(/\[\:\w+\]/, terms.id);
            return $http.get(url);
          }
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
