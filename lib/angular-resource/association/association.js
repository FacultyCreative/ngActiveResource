angular
  .module('ActiveResource')
  .provider('ARAssociation', function() {
    this.$get = ['$injector', 'ARBelongsTo', function($injector, BelongsTo) {
      function Association(type, instance, table, options) {
        if (options.provider)   var providerName = options.provider;
        else                    var providerName = table.classify();

        if (type == 'BelongsTo') {
          if (options.foreignKey) this.foreignKey = options.foreignKey;
          else                    this.foreignKey = table.singularize() + "_id";
          BelongsTo(this, instance, table, options);
        }

        this.klass = $injector.get(providerName);
        this.propertyName = table;
        this.type = type;
        Association.cached[instance.constructor.name.toLowerCase() + ':' + table] = this;
      }; 
      Association.cached = {};
      return Association;
    }];
  })
  .provider('ARBelongsTo', function() {
    this.$get = ['ARAssociations', 'ARHelpers', function(Associations, Helpers) {
      function BelongsTo(association, instance, table, options) {
        var localTable = undefined;
        Object.defineProperty(instance, table, {
          enumerable: true,
          get: function()    { return localTable; },
          set: function(val) {
           if (val === undefined) { localTable = val; return; }
           var primaryKey = Helpers.getPrimaryKeyFor(instance);
           if (val.constructor.name == 'String' || val.constructor.name == 'Number') {
             association.klass.find(val).then(function(response) { 
               localTable = response; 
               var thisTableName  = instance.constructor.name.pluralize().camelize()
               var belongsToArray = localTable[thisTableName];
               if (instance[primaryKey] && belongsToArray && !_.include(belongsToArray, instance)) belongsToArray.push(instance);
             });
           } else if (association.klass.name == val.constructor.name) {
             localTable = val;
             var foreignAssociations = Associations.get(val);
             var thisAssociation;
             var thisTableName;
             _.each([foreignAssociations.hasMany, foreignAssociations.hasOne],
               function(associations) {
                 _.each(associations, function(association) {
                   if (association.klass == instance.constructor) {
                     thisAssociation = association;
                     thisTableName   = association.klass.name.camelize();
                     if (thisAssociation.type == 'hasMany') {
                       thisTableName = thisTableName.pluralize();
                     }
                   }
                 });
             });
             var foreignAssociation = localTable[thisTableName];
             if (instance[primaryKey] !== undefined && foreignAssociation) {
               if (thisAssociation.type == 'hasMany') {
                 if (!_.include(foreignAssociation, instance)) {
                   foreignAssociation.push(instance);
                 };
               } else if (thisAssociation.type == 'hasOne') {
                 Object.defineProperty(localTable, thisTableName, {
                   enumerable: true,
                   configurable: true,
                   value: instance
                 });
               }
             }
           }
          }
        });
      };
      return BelongsTo;
    }];
  })
  .provider('ARAssociations', function() {
    this.$get = ['$q', function($q) {
      function Associations(klass) {
        var name           = klass.name.toLowerCase();
        this.belongsTo     = [];
        this.hasMany       = [];
        this.hasOne        = [];
        this.belongsTo.add = add;
        this.hasMany.add   = add;
        this.hasOne.add    = add;

        function add(association) {
          var shouldPush = true;
          _.each(this, function(assoc) { if (assoc.klass == association.klass) shouldPush = false; });
          if (shouldPush) this.push(association);
          if (association.type == 'hasOne') {
            association.klass.prototype.find = function() {
              var inverseAssociations = Associations.get(association.klass).belongsTo;
              var query = {};
              _.each(inverseAssociations, function(inverseAssociation) {
                query[inverseAssociation.propertyName] = this[inverseAssociation.propertyName];
              }, this);
              return association.klass.find(query);
            };
          };
        };

        if (!Associations.cached[name]) Associations.cached[name] = this;
      }
      Associations.cached = {};
      Associations.get    = function(klass) {
        if (klass.klass) model = klass.klass;
        else model = klass;
        // If we have an instance, rather than a constructor,
        // we know it's already been instantiated. So we also
        // don't need to instantiate it, which will cause a
        // stack overflow.
        if (model.constructor.name !== 'Function') {
          model = model.constructor;
        } else {
          model.new();
        }
        return Associations.cached[model.name.toLowerCase()];
      };
      Associations.getBelongs = function(klass, instance) {
        var associations = Associations.get(klass);
        var belongs = undefined;
        _.each(associations.belongsTo, function(association) {
          if (association.klass == instance.constructor) belongs = association;
        });
        return belongs;
      };
      Associations.getDependents = function(klass, instance) {
        var associations = Associations.getBelongs(klass, instance);
        return associations;
      };
      return Associations;
    }];
  })
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

        Object.defineProperty(collection, 'where', {
          enumerable: false,
          value: function(data) {
            if (!data) data = {};
            data[belongs] = collection[belongs];
            return klass.where(data);
          }
        });

        Object.defineProperty(collection, 'find', {
          enumerable: false,
          value: function(data) {
            if (!data) data = {};
            data[belongs] = collection[belongs];
            return klass.find(data);
          }
        });

        Object.defineProperty(collection, 'all', {
          enumerable: false,
          value: function(data) {
            if (!data) data = {};
            data[belongs] = collection[belongs];
            return klass.where(data);
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
