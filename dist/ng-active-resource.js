angular.module('dojo', []).provider('stamp', function () {
  this.$get = function () {
    var stamp = {};
    stamp.fromISOString = function (formattedString, defaultTime) {
      if (!stamp._isoRegExp) {
        stamp._isoRegExp = /^(?:(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?)?(?:T(\d{2}):(\d{2})(?::(\d{2})(.\d+)?)?((?:[+-](\d{2}):(\d{2}))|Z)?)?$/;
      }
      var match = stamp._isoRegExp.exec(formattedString), result = null;
      if (match) {
        match.shift();
        if (match[1]) {
          match[1]--;
        }
        if (match[6]) {
          match[6] *= 1000;
        }
        if (defaultTime) {
          defaultTime = new Date(defaultTime);
          array.forEach(array.map([
            'FullYear',
            'Month',
            'Date',
            'Hours',
            'Minutes',
            'Seconds',
            'Milliseconds'
          ], function (prop) {
            return defaultTime['get' + prop]();
          }), function (value, index) {
            match[index] = match[index] || value;
          });
        }
        result = new Date(match[0] || 1970, match[1] || 0, match[2] || 1, match[3] || 0, match[4] || 0, match[5] || 0, match[6] || 0);
        if (match[0] < 100) {
          result.setFullYear(match[0] || 1970);
        }
        var offset = 0, zoneSign = match[7] && match[7].charAt(0);
        if (zoneSign != 'Z') {
          offset = (match[8] || 0) * 60 + (Number(match[9]) || 0);
          if (zoneSign != '-') {
            offset *= -1;
          }
        }
        if (zoneSign) {
          offset -= result.getTimezoneOffset();
        }
        if (offset) {
          result.setTime(result.getTime() + offset * 60000);
        }
      }
      return result;
    };
    stamp.toISOString = function (dateObject, options) {
      var _ = function (n) {
        return n < 10 ? '0' + n : n;
      };
      options = options || {};
      var formattedDate = [], getter = options.zulu ? 'getUTC' : 'get', date = '';
      if (options.selector != 'time') {
        var year = dateObject[getter + 'FullYear']();
        date = [
          '0000'.substr((year + '').length) + year,
          _(dateObject[getter + 'Month']() + 1),
          _(dateObject[getter + 'Date']())
        ].join('-');
      }
      formattedDate.push(date);
      if (options.selector != 'date') {
        var time = [
            _(dateObject[getter + 'Hours']()),
            _(dateObject[getter + 'Minutes']()),
            _(dateObject[getter + 'Seconds']())
          ].join(':');
        var millis = dateObject[getter + 'Milliseconds']();
        if (options.milliseconds) {
          time += '.' + (millis < 100 ? '0' : '') + _(millis);
        }
        if (options.zulu) {
          time += 'Z';
        } else if (options.selector != 'time') {
          var timezoneOffset = dateObject.getTimezoneOffset();
          var absOffset = Math.abs(timezoneOffset);
          time += (timezoneOffset > 0 ? '-' : '+') + _(Math.floor(absOffset / 60)) + ':' + _(absOffset % 60);
        }
        formattedDate.push(time);
      }
      return formattedDate.join('T');
    };
    return stamp;
  };
}).provider('json', function () {
  this.$get = [
    'stamp',
    function (stamp) {
      djson = {};
      djson.fromJson = function (js) {
        return eval('(' + js + ')');
      };
      djson._escapeString = JSON.stringify;
      djson.toJsonIndentStr = '\t';
      djson.toJson = function (it, prettyPrint) {
        return JSON.stringify(it, function (key, value) {
          if (value) {
            var tf = value.__json__ || value.json;
            if (typeof tf == 'function') {
              return tf.call(value);
            }
          }
          return value;
        }, prettyPrint && djson.toJsonIndentStr);
      };
      var json = {};
      json.resolveJson = function (root, args) {
        args = args || {};
        var idAttribute = args.idAttribute || 'id';
        var refAttribute = this.refAttribute;
        var idAsRef = args.idAsRef;
        var prefix = args.idPrefix || '';
        var assignAbsoluteIds = args.assignAbsoluteIds;
        var index = args.index || {};
        var timeStamps = args.timeStamps;
        var ref, reWalk = [];
        var pathResolveRegex = /^(.*\/)?(\w+:\/\/)|[^\/\.]+\/\.\.\/|^.*\/(\/)/;
        var addProp = this._addProp;
        var F = function () {
        };
        function walk(it, stop, defaultId, needsPrefix, schema, defaultObject) {
          var i, update, val, id = idAttribute in it ? it[idAttribute] : defaultId;
          if (idAttribute in it || id !== undefined && needsPrefix) {
            id = (prefix + id).replace(pathResolveRegex, '$2$3');
          }
          var target = defaultObject || it;
          if (id !== undefined) {
            if (assignAbsoluteIds) {
              it.__id = id;
            }
            if (args.schemas && !(it instanceof Array) && (val = id.match(/^(.+\/)[^\.\[]*$/))) {
              schema = args.schemas[val[1]];
            }
            if (index[id] && it instanceof Array == index[id] instanceof Array) {
              target = index[id];
              delete target.$ref;
              delete target._loadObject;
              update = true;
            } else {
              var proto = schema && schema.prototype;
              if (proto) {
                F.prototype = proto;
                target = new F();
              }
            }
            index[id] = target;
            if (timeStamps) {
              timeStamps[id] = args.time;
            }
          }
          while (schema) {
            var properties = schema.properties;
            if (properties) {
              for (i in it) {
                var propertyDefinition = properties[i];
                if (propertyDefinition && propertyDefinition.format == 'date-time' && typeof it[i] == 'string') {
                  it[i] = stamp.fromISOString(it[i]);
                }
              }
            }
            schema = schema['extends'];
          }
          var length = it.length;
          for (i in it) {
            if (i == length) {
              break;
            }
            if (it.hasOwnProperty(i)) {
              val = it[i];
              if (typeof val == 'object' && val && !(val instanceof Date) && i != '__parent') {
                ref = val[refAttribute] || idAsRef && val[idAttribute];
                if (!ref || !val.__parent) {
                  if (it != reWalk) {
                    val.__parent = target;
                  }
                }
                if (ref) {
                  delete it[i];
                  var path = ref.toString().replace(/(#)([^\.\[])/, '$1.$2').match(/(^([^\[]*\/)?[^#\.\[]*)#?([\.\[].*)?/);
                  if (index[(prefix + ref).replace(pathResolveRegex, '$2$3')]) {
                    ref = index[(prefix + ref).replace(pathResolveRegex, '$2$3')];
                  } else if (ref = path[1] == '$' || path[1] == 'this' || path[1] == '' ? root : index[(prefix + path[1]).replace(pathResolveRegex, '$2$3')]) {
                    if (path[3]) {
                      path[3].replace(/(\[([^\]]+)\])|(\.?([^\.\[]+))/g, function (t, a, b, c, d) {
                        ref = ref && ref[b ? b.replace(/[\"\'\\]/, '') : d];
                      });
                    }
                  }
                  if (ref) {
                    val = ref;
                  } else {
                    if (!stop) {
                      var rewalking;
                      if (!rewalking) {
                        reWalk.push(target);
                      }
                      rewalking = true;
                      val = walk(val, false, val[refAttribute], true, propertyDefinition);
                      val._loadObject = args.loader;
                    }
                  }
                } else {
                  if (!stop) {
                    val = walk(val, reWalk == it, id === undefined ? undefined : addProp(id, i), false, propertyDefinition, target != it && typeof target[i] == 'object' && target[i]);
                  }
                }
              }
              it[i] = val;
              if (target != it && !target.__isDirty) {
                var old = target[i];
                target[i] = val;
                if (update && val !== old && !target._loadObject && !(i.charAt(0) == '_' && i.charAt(1) == '_') && i != '$ref' && !(val instanceof Date && old instanceof Date && val.getTime() == old.getTime()) && !(typeof val == 'function' && typeof old == 'function' && val.toString() == old.toString()) && index.onUpdate) {
                  index.onUpdate(target, i, old, val);
                }
              }
            }
          }
          if (update && (idAttribute in it || target instanceof Array)) {
            for (i in target) {
              if (!target.__isDirty && target.hasOwnProperty(i) && !it.hasOwnProperty(i) && !(i.charAt(0) == '_' && i.charAt(1) == '_') && !(target instanceof Array && isNaN(i))) {
                if (index.onUpdate && i != '_loadObject' && i != '_idAttr') {
                  index.onUpdate(target, i, target[i], undefined);
                }
                delete target[i];
                while (target instanceof Array && target.length && target[target.length - 1] === undefined) {
                  target.length--;
                }
              }
            }
          } else {
            if (index.onLoad) {
              index.onLoad(target);
            }
          }
          return target;
        }
        if (root && typeof root == 'object') {
          root = walk(root, false, args.defaultId, true);
          walk(reWalk, false);
        }
        return root;
      };
      json.fromJson = function (str, args) {
        function ref(target) {
          var refObject = {};
          refObject[this.refAttribute] = target;
          return refObject;
        }
        try {
          var root = eval('(' + str + ')');
        } catch (e) {
          throw new SyntaxError('Invalid JSON string: ' + e.message + ' parsing: ' + str);
        }
        if (root) {
          return this.resolveJson(root, args);
        }
        return root;
      };
      json.toJson = function (it, prettyPrint, idPrefix, indexSubObjects, options) {
        if (!options)
          options = {};
        if (options.instance)
          it = options.instance;
        var useRefs = this._useRefs;
        var addProp = this._addProp;
        var refAttribute = this.refAttribute;
        idPrefix = idPrefix || '';
        var paths = {};
        var generated = {};
        function serialize(it, path, _indentStr) {
          if (typeof it == 'object' && it) {
            var value;
            if (it instanceof Date) {
              return '"' + stamp.toISOString(it, { zulu: true }) + '"';
            }
            var id = it.__id;
            if (id) {
              if (path != '#' && (useRefs && !id.match(/#/) || paths[id])) {
                var ref = id;
                if (id.charAt(0) != '#') {
                  if (it.__clientId == id) {
                    ref = 'cid:' + id;
                  } else if (id.substring(0, idPrefix.length) == idPrefix) {
                    ref = id.substring(idPrefix.length);
                  } else {
                    ref = id;
                  }
                }
                var refObject = {};
                refObject[refAttribute] = ref;
                return djson.toJson(refObject, prettyPrint);
              }
              path = id;
            } else {
              it.__id = path;
              generated[path] = it;
            }
            paths[path] = it;
            _indentStr = _indentStr || '';
            var nextIndent = prettyPrint ? _indentStr + djson.toJsonIndentStr : '';
            var newLine = prettyPrint ? '\n' : '';
            var sep = prettyPrint ? ' ' : '';
            if (it instanceof Array) {
              var res = _.map(it, function (obj, i) {
                  var val = serialize(obj, addProp(path, i), nextIndent);
                  if (typeof val != 'string') {
                    val = 'undefined';
                  }
                  return newLine + nextIndent + val;
                });
              return '[' + res.join(',' + sep) + newLine + _indentStr + ']';
            }
            var output = [];
            for (var i in it) {
              if (it.hasOwnProperty(i)) {
                var keyStr;
                if (typeof i == 'number') {
                  keyStr = '"' + i + '"';
                } else if (typeof i == 'string' && (i.charAt(0) != '_' || i.charAt(1) != '_')) {
                  keyStr = djson._escapeString(i);
                } else {
                  continue;
                }
                var val = serialize(it[i], addProp(path, i), nextIndent);
                if (val === undefined && options.includeEmptyKeys === true)
                  val = '" "';
                if (typeof val != 'string') {
                  continue;
                }
                output.push(newLine + nextIndent + keyStr + ':' + sep + val);
              }
            }
            return '{' + output.join(',' + sep) + newLine + _indentStr + '}';
          }
          return djson.toJson(it);
        }
        var json = serialize(it, '#', '');
        if (!indexSubObjects) {
          for (var i in generated) {
            delete generated[i].__id;
          }
        }
        return json;
      };
      json._addProp = function (id, prop) {
        return id + (id.match(/#/) ? id.length == 1 ? '' : '.' : '#') + prop;
      };
      json.refAttribute = '$ref';
      json._useRefs = false;
      json.serializeFunctions = false;
      json.serialize = function (instance, options) {
        var prettyPrint;
        if (!options)
          options = {};
        if (options.prettyPrint)
          prettyPrint = true;
        return json.toJson(instance, prettyPrint, '', false, options);
      };
      return json;
    }
  ];
});
Function.prototype.inherits = function (base) {
  var _constructor;
  _constructor = this;
  return _constructor = base.apply(_constructor);
};
angular.module('ActiveResource', [
  'ng',
  'dojo'
]).provider('ActiveResource', function () {
  this.$get = [
    'ARBase',
    function (Base) {
      ActiveResource = {};
      ActiveResource.Base = Base;
      return ActiveResource;
    }
  ];
});
angular.module('ActiveResource').provider('ARAPI', function () {
  this.$get = [
    'ARHelpers',
    function (Helpers) {
      function API(klass, pk) {
        var className = klass.name.hyphenate();
        var singular = className.toLowerCase();
        var plural = singular.pluralize();
        var primaryKey = pk || 'id';
        this.indexURL = '';
        this.createURL = '';
        this.showURL = '';
        this.deleteURL = '';
        this.updateURL = '';
        this.set = function (url) {
          if (url.slice(-1) != '/')
            url = url + '/';
          this.createURL = url + plural;
          this.updateURL = url + plural + '/:' + primaryKey;
          this.showURL = this.indexURL = this.deleteURL = url + plural + '/[:attrs]';
          return this;
        };
        this.updatePrimaryKey = function (pk) {
          primaryKey = pk;
          this.updateURL = this.updateURL.replace(/\:\w+/, ':' + pk);
        };
      }
      return API;
    }
  ];
});
angular.module('ActiveResource').provider('ARAssociation', function () {
  this.$get = [
    '$injector',
    'ARBelongsTo',
    function ($injector, BelongsTo) {
      function Association(type, instance, table, options) {
        if (options.provider)
          var providerName = options.provider;
        else
          var providerName = table.classify();
        if (type == 'BelongsTo') {
          if (options.foreignKey)
            this.foreignKey = options.foreignKey;
          else
            this.foreignKey = table.singularize() + '_id';
          BelongsTo(this, instance, table, options);
        }
        this.klass = $injector.get(providerName);
        this.propertyName = table;
        this.type = type;
        Association.cached[instance.constructor.name.toLowerCase() + ':' + table] = this;
      }
      ;
      Association.cached = {};
      return Association;
    }
  ];
}).provider('ARBelongsTo', function () {
  this.$get = [
    'ARAssociations',
    'ARHelpers',
    function (Associations, Helpers) {
      function BelongsTo(association, instance, table, options) {
        var localTable = undefined;
        Object.defineProperty(instance, table, {
          enumerable: true,
          get: function () {
            return localTable;
          },
          set: function (val) {
            if (val === undefined) {
              localTable = val;
              return;
            }
            var primaryKey = Helpers.getPrimaryKeyFor(instance);
            if (val.constructor.name == 'String' || val.constructor.name == 'Number') {
              association.klass.find(val).then(function (response) {
                localTable = response;
                var thisTableName = instance.constructor.name.pluralize().camelize();
                var belongsToArray = localTable[thisTableName];
                if (instance[primaryKey] && belongsToArray && !_.include(belongsToArray, instance))
                  belongsToArray.push(instance);
              });
            } else if (association.klass.name == val.constructor.name) {
              localTable = val;
              var foreignAssociations = Associations.get(val);
              var thisAssociation;
              var thisTableName;
              _.each([
                foreignAssociations.hasMany,
                foreignAssociations.hasOne
              ], function (associations) {
                _.each(associations, function (association) {
                  if (association.klass == instance.constructor) {
                    thisAssociation = association;
                    thisTableName = association.klass.name.camelize();
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
                  }
                  ;
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
      }
      ;
      return BelongsTo;
    }
  ];
}).provider('ARAssociations', function () {
  this.$get = [
    '$q',
    function ($q) {
      function Associations(klass) {
        var name = klass.name.toLowerCase();
        this.belongsTo = [];
        this.hasMany = [];
        this.hasOne = [];
        this.belongsTo.add = add;
        this.hasMany.add = add;
        this.hasOne.add = add;
        function add(association) {
          var shouldPush = true;
          _.each(this, function (assoc) {
            if (assoc.klass == association.klass)
              shouldPush = false;
          });
          if (shouldPush)
            this.push(association);
          if (association.type == 'hasOne') {
            association.klass.prototype.find = function () {
              var inverseAssociations = Associations.get(association.klass).belongsTo;
              var query = {};
              _.each(inverseAssociations, function (inverseAssociation) {
                query[inverseAssociation.propertyName] = this[inverseAssociation.propertyName];
              }, this);
              return association.klass.find(query);
            };
          }
          ;
        }
        ;
        if (!Associations.cached[name])
          Associations.cached[name] = this;
      }
      Associations.cached = {};
      Associations.get = function (klass) {
        if (klass.klass)
          model = klass.klass;
        else
          model = klass;
        if (model.constructor.name !== 'Function') {
          model = model.constructor;
        } else {
          model.new();
        }
        return Associations.cached[model.name.toLowerCase()];
      };
      Associations.getBelongs = function (klass, instance) {
        var associations = Associations.get(klass);
        var belongs = undefined;
        _.each(associations.belongsTo, function (association) {
          if (association.klass == instance.constructor)
            belongs = association;
        });
        return belongs;
      };
      Associations.getDependents = function (klass, instance) {
        var associations = Associations.getBelongs(klass, instance);
        return associations;
      };
      return Associations;
    }
  ];
}).provider('ARCollection', function () {
  this.$get = function () {
    function Collection(klass, belongsTo) {
      var belongs = belongsTo.name.toLowerCase();
      var collection = [];
      Object.defineProperty(collection, 'new', {
        enumerable: false,
        value: function (data) {
          if (!data)
            data = {};
          data[belongs] = collection[belongs];
          return klass.new(data);
        }
      });
      Object.defineProperty(collection, '$create', {
        enumerable: false,
        value: function (data) {
          if (!data)
            data = {};
          data[belongs] = collection[belongs];
          return klass.$create(data);
        }
      });
      Object.defineProperty(collection, 'where', {
        enumerable: false,
        value: function (data) {
          if (!data)
            data = {};
          data[belongs] = collection[belongs];
          return klass.where(data);
        }
      });
      Object.defineProperty(collection, 'find', {
        enumerable: false,
        value: function (data) {
          if (!data)
            data = {};
          data[belongs] = collection[belongs];
          return klass.find(data);
        }
      });
      Object.defineProperty(collection, 'all', {
        enumerable: false,
        value: function (data) {
          if (!data)
            data = {};
          data[belongs] = collection[belongs];
          return klass.where(data);
        }
      });
      Object.defineProperty(collection, 'first', {
        enumerable: false,
        get: function () {
          return collection[0];
        }
      });
      Object.defineProperty(collection, 'last', {
        enumerable: false,
        get: function () {
          return collection.slice(-1)[0];
        }
      });
      return collection;
    }
    return Collection;
  };
});
String.prototype.downcase = function () {
  return this.toLowerCase();
};
angular.module('ActiveResource').provider('ARCache', function () {
  this.$get = function () {
    function Cache() {
      Object.defineProperty(this, 'cache', {
        enumerable: false,
        value: function (instance, primaryKey) {
          if (instance && instance[primaryKey] !== undefined) {
            instance.constructor.cached[instance[primaryKey]] = instance;
          }
        }
      });
      Object.defineProperty(this, 'isEmpty', {
        enumerable: false,
        value: function () {
          return !!!Object.keys(this).length;
        }
      });
      Object.defineProperty(this, 'where', {
        enumerable: false,
        value: function (terms) {
          if (Object.keys(terms).length == 0)
            terms = undefined;
          return _.where(this, terms, this);
        }
      });
    }
    ;
    return Cache;
  };
});
angular.module('ActiveResource').provider('ARSerializer', function () {
  this.$get = [
    'json',
    'ARMixin',
    'ARAssociations',
    'ARHelpers',
    'ARDeferred',
    function (json, mixin, Associations, Helpers, deferred) {
      function Serializer() {
        this.serialize = function (instance, options) {
          var obj = foreignkeyify(instance);
          return json.serialize(obj, options);
        };
        this.deserialize = function (httpResponse, instance, options) {
          var json, options;
          if (httpResponse && httpResponse.data)
            json = httpResponse.data;
          else
            json = httpResponse;
          if (!options)
            options = { lazy: true };
          if (responseContainsForeignKeys(json, instance)) {
            return setAssociationsAndUpdate(instance, json, options);
          } else {
            return updateLocalInstance(instance, json, options).then(function (response) {
              instance = response;
              return deferred(instance);
            });
          }
        };
        function foreignkeyify(instance) {
          var json = mixin({}, instance, false);
          var associations = Associations.get(instance);
          _.each(associations.belongsTo, function (association) {
            var foreignKeyName = association.foreignKey;
            var associatedName = Helpers.getClassNameFor(association);
            var associatedInstance = instance[associatedName];
            if (!associatedInstance)
              return;
            var primaryKeyName = Helpers.getPrimaryKeyFor(associatedInstance);
            var foreignkey = associatedInstance[primaryKeyName];
            json[foreignKeyName] = foreignkey;
            json[associatedName] = undefined;
          });
          return json;
        }
        ;
        function responseContainsForeignKeys(response, instance) {
          var answer = false;
          var associations = Associations.get(instance);
          _.each(associations.belongsTo, function (foreignRel) {
            var foreignKey = foreignRel.foreignKey;
            if (response[foreignKey] || response == foreignKey)
              answer = true;
          });
          return answer;
        }
        ;
      }
      ;
      function updateLocalInstance(instance, response, options) {
        if (options && options.update == false)
          return deferred(instance);
        instance.update(response);
        var primaryKey = Helpers.getPrimaryKeyFor(instance);
        instance.constructor.cached.cache(instance, primaryKey);
        instance.validations.updateInstance(instance);
        if (!options.lazy)
          return eagerLoad(instance).then(finishUpdate);
        return finishUpdate();
        function finishUpdate() {
          instance.establishBelongsTo();
          return deferred(instance);
        }
        ;
      }
      ;
      function setAssociationsAndUpdate(instance, response, options) {
        if (options && options.update == false)
          options.update = true;
        var associationsToUpdate = [];
        var associations = Associations.get(instance);
        if (associations.belongsTo.length >= 1) {
          _.each(associations.belongsTo, function (foreignRel) {
            if (!response[foreignRel.foreignKey])
              return;
            var association = foreignRel.klass;
            var associatedName = association.name.camelize();
            var foreignKey = foreignRel.foreignKey;
            var query = response[foreignKey];
            var queryOptions = {};
            for (var i in options) {
              queryOptions[i] = options[i];
            }
            if (!options.overEager)
              queryOptions.lazy = true;
            associationsToUpdate.push(function (callback) {
              foreignRel.klass.find(query, queryOptions).then(function (association) {
                response[associatedName] = association;
                delete response[foreignKey];
                callback(null, response);
              });
            });
          });
        }
        async.series(associationsToUpdate, function (err, response) {
          response = _.first(response);
          updateLocalInstance(instance, response, options);
        });
        return deferred(instance);
      }
      ;
      function eagerLoad(instance) {
        var queries = [];
        var associations = Associations.get(instance);
        var dependentList = [
            associations.hasMany,
            associations.hasOne
          ];
        _.each(dependentList, function (dependentsArray) {
          _.each(dependentsArray, function (association) {
            var dependent = Associations.getDependents(association, instance);
            var foreignKey = dependent.foreignKey;
            var query = {};
            var primaryKey = Helpers.getPrimaryKeyFor(instance);
            query[foreignKey] = instance[primaryKey];
            queries.push(function (callback) {
              association.klass.where(query, { lazy: true }).then(function (response) {
                _.each(response, function (associ) {
                  if (_.include(associations.hasMany, association)) {
                    var name = association.klass.name.pluralize().camelize();
                    instance[name].nodupush(associ);
                  } else {
                    var name = association.klass.name.singularize().camelize();
                    if (!instance[name])
                      instance[name] = associ;
                  }
                  callback(null, instance);
                });
              });
            });
          });
        });
        async.series(queries, function (err, callback) {
        });
        return deferred(instance);
      }
      ;
      return Serializer;
    }
  ];
});
angular.module('ActiveResource').provider('ARHelpers', function () {
  this.$get = function () {
    Object.defineProperty(Array.prototype, 'nodupush', {
      enumerable: false,
      configurable: true,
      value: function (val) {
        if (!_.include(this, val))
          this.push(val);
      }
    });
    return {
      getClassNameFor: function (association) {
        return association.klass.name.camelize();
      },
      getPrimaryKeyFor: function (classOrInstance) {
        if (classOrInstance.constructor == 'Function')
          return classOrInstance.primaryKey;
        else
          return classOrInstance.constructor.primaryKey;
      }
    };
  };
});
angular.module('ActiveResource').provider('ARMixin', function () {
  this.$get = function () {
    return function (receiver, giver, excludeFunctions) {
      if (giver.constructor.name == 'Function') {
        giver = new giver();
      }
      for (var i in giver) {
        if (excludeFunctions) {
          if (typeof giver[i] !== 'function') {
            mixinProp();
          }
        } else {
          mixinProp();
        }
        function mixinProp() {
          if (!receiver.hasOwnProperty(i)) {
            (function () {
              var local;
              Object.defineProperty(receiver, i, {
                enumerable: true,
                get: function () {
                  return local;
                },
                set: function (val) {
                  local = val;
                }
              });
            }());
            receiver[i] = giver[i];
          }
        }
      }
      return receiver;
    };
  };
});
angular.module('ActiveResource').provider('ARDeferred', function () {
  this.$get = [
    '$q',
    function ($q) {
      return function deferred(instance, error) {
        var deferred = $q.defer();
        if (error)
          deferred.reject(error);
        else
          deferred.resolve(instance);
        return deferred.promise;
      };
    }
  ];
});
angular.module('ActiveResource').provider('ARQuerystring', function () {
  this.$get = function () {
    var querystring = {
        stringify: function (object) {
          var string = '';
          _.map(object, function (val, key) {
            if (string.length == 0)
              string += key + '=' + val;
            else
              string += '&' + key + '=' + val;
          });
          return string;
        },
        parse: function (string) {
        }
      };
    return querystring;
  };
});
angular.module('ActiveResource').provider('ARParameterize', function () {
  this.$get = function () {
    return function (url, object) {
      if (!url)
        return;
      if (!object)
        return url;
      return url.replace(/\:\_*[A-Za-z]+/g, function (param) {
        param = param.replace(/\:*/, '');
        return object[param];
      });
    };
  };
});
angular.module('ActiveResource').provider('URLify', function () {
  this.$get = [
    'ARParameterize',
    'ARQuerystring',
    function (parameterize, querystring) {
      return function (url, terms) {
        if (!url)
          return;
        if (!terms)
          return url;
        var qs = '';
        if (querystring.stringify(terms))
          qs = '?' + querystring.stringify(terms);
        if (url.match(/\[\:[A-Za-z]+\]/))
          url = url.replace(/\[\:[A-Za-z]+\]/, qs);
        else if (url.match(/\:\_*[A-Za-z]+/))
          url = parameterize(url, terms);
        return url;
      };
    }
  ];
});
angular.module('ActiveResource').provider('ARGET', function () {
  this.$get = [
    '$http',
    'ARDeferred',
    'ARAssociations',
    'ARHelpers',
    'URLify',
    function ($http, deferred, Associations, Helpers, URLify) {
      function resolveSingleGET(data, terms, options) {
        if (data && data.length >= 1) {
          if (options.noInstanceEndpoint)
            return _.first(_.where(data, terms));
          else
            return _.first(data);
        }
        return data;
      }
      ;
      function resolveMultiGET(data, terms, options) {
        return data;
      }
      ;
      function transformSearchTermsToForeignKeys(instance, terms) {
        var associatedInstance, propertyName;
        var associations = Associations.get(instance);
        if (!associations)
          return;
        associations = associations.belongsTo;
        _.each(associations, function (association) {
          if (terms[association.propertyName]) {
            associatedInstance = terms[association.propertyName];
            propertyName = association.propertyName;
            var foreignKey = association.foreignKey;
            var primaryKey = Helpers.getPrimaryKeyFor(terms[association.propertyName]);
            terms[foreignKey] = associatedInstance[primaryKey];
            if (terms[foreignKey])
              delete terms[association.propertyName];
          }
        });
        return [
          associatedInstance,
          terms,
          propertyName
        ];
      }
      ;
      return function generateGET(instance, url, terms, options) {
        var instanceAndTerms = transformSearchTermsToForeignKeys(instance, terms);
        var associatedInstance, terms, propertyName;
        if (instanceAndTerms) {
          associatedInstance = instanceAndTerms[0];
          terms = instanceAndTerms[1];
          propertyName = instanceAndTerms[2];
        }
        url = URLify(url, terms);
        return $http.get(url).then(function (response) {
          var data = response.data;
          if (propertyName && associatedInstance) {
            if (data && data.push) {
              _.each(data, function (datum) {
                datum[propertyName] = associatedInstance;
              });
            } else {
              data[propertyName] = associatedInstance;
            }
          }
          if (options.multi)
            return resolveMultiGET(data, terms, options);
          else
            return resolveSingleGET(data, terms, options);
        });
      };
    }
  ];
});
angular.module('ActiveResource').provider('ARBase', function () {
  this.$get = [
    'ARAPI',
    'ARCollection',
    'ARAssociation',
    'ARAssociations',
    'ARCache',
    'ARSerializer',
    'AREventable',
    'ARValidations',
    '$http',
    '$q',
    '$injector',
    'ARDeferred',
    'ARGET',
    'ARMixin',
    'URLify',
    function (API, Collection, Association, Associations, Cache, Serializer, Eventable, Validations, $http, $q, $injector, deferred, GET, mixin, URLify) {
      function Base() {
        var _this = this;
        _this.watchedCollections = [];
        var primaryKey = 'id';
        Object.defineProperty(_this, 'primaryKey', {
          configurable: true,
          get: function () {
            return primaryKey;
          },
          set: function (key) {
            primaryKey = key;
            this.api.updatePrimaryKey(primaryKey);
          }
        });
        var associations = new Associations(_this);
        var dependentDestroy = [];
        this.api = new API(this);
        mixin(_this, Eventable);
        if (!_this.cached)
          _this.cached = new Cache();
        function cacheInstance(instance) {
          _this.cached.cache(instance, primaryKey);
        }
        ;
        function findCachedMatching(terms) {
          return _.where(_this.cached, terms, _this);
        }
        ;
        serializer = new Serializer();
        _this.prototype.toJSON = function (options) {
          return _this.prototype.serialize.call(this, options);
        };
        _this.prototype.serialize = function (options) {
          return serializer.serialize(this, options);
        };
        _this.prototype.$save = function (instance, url, put) {
          if (!instance)
            instance = this;
          if (instance && instance[primaryKey] && !url) {
            url = URLify(_this.api.updateURL, instance);
            if (put !== false)
              put = true;
          } else if (!url) {
            url = _this.api.createURL;
          }
          _this.emit('$save:called', instance);
          var json = serializer.serialize(instance);
          if (instance.$invalid) {
            _this.emit('$save:fail', instance);
            return deferred(null, instance);
          }
          if (put)
            method = 'put';
          else
            method = 'post';
          return $http[method](url, json).then(function (response) {
            return serializer.deserialize(response, instance).then(function (instance) {
              _this.emit('$save:complete', instance);
              return deferred(instance);
            });
          });
        };
        _this.prototype.$update = function (data) {
          var instance = this;
          var url = _this.api.updateURL;
          if (!url)
            return;
          if (url.match(/\:\w+/))
            url = url.replace(/\:\w+/, this[primaryKey]);
          if (data) {
            return instance.update(data).then(function (response) {
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
        _this.prototype.update = function (data) {
          _this.emit('update:called', {
            data: data,
            instance: this
          });
          for (var attr in data) {
            if (instanceHasManyOf(attr))
              updateHasManyRelationship.call(this, data[attr], attr);
            else if (instanceHasOneOf(attr))
              updateHasOneRelationship.call(this, data[attr], attr);
            else if (instanceBelongsTo(attr))
              updateBelongsRelationship.call(this, data[attr], attr);
            else if (isSettableProperty(attr))
              this[attr] = data[attr];
          }
          var instance = this;
          return serializer.deserialize(data, instance, {
            lazy: true,
            update: false
          }).then(function (response) {
            _this.emit('update:complete', {
              data: data,
              instance: instance
            });
            return deferred(instance);
          });
        };
        _this.$create = function (data) {
          if (!data)
            data = {};
          _this.emit('$create:called', data);
          var instance = _this.new(data);
          instance.establishBelongsTo();
          return instance.$save().then(function (response) {
            instance = response;
            cacheInstance(instance);
            _this.emit('$create:complete', instance);
            return deferred(instance);
          });
        };
        _this.new = function (data) {
          if (!data)
            data = {};
          _this.emit('new:called', data);
          if (typeof data == 'Number')
            data = argify(data);
          if (data && this.cached[data[primaryKey]])
            return this.cached[data[primaryKey]];
          _this.prototype.integer = function (propertyName) {
            var instance = this;
            var validations = {};
            validations[propertyName] = { integer: { ignore: /\,/g } };
            instance.validates(validations);
            instance[propertyName] = data[propertyName];
          };
          _this.prototype.number = function (propertyName) {
            var instance = this;
            var validations = {};
            validations[propertyName] = { numericality: { ignore: /\,/g } };
            instance.validates(validations);
            instance[propertyName] = data[propertyName];
          };
          _this.prototype.boolean = function (propertyName) {
            var instance = this;
            var validations = {};
            validations[propertyName] = { boolean: true };
            instance.validates(validations);
            instance[propertyName] = data[propertyName];
          };
          _this.prototype.string = function (propertyName) {
            var instance = this;
            var validations = {};
            validations[propertyName] = { string: true };
            instance.validates(validations);
            instance[propertyName] = data[propertyName];
          };
          _this.prototype.computedProperty = function (name, valueFn, dependents) {
            var instance = this;
            if (!dependents)
              dependents = [];
            if (!dependents.push)
              dependents = [dependents];
            var local2;
            Object.defineProperty(instance, name, {
              enumerable: true,
              configurable: true,
              get: function () {
                return local2;
              },
              set: function () {
                local2 = valueFn.apply(instance);
                return local2;
              }
            });
            _.each(dependents, function (dependent) {
              var local;
              var previousSetter = instance.__lookupSetter__(dependent);
              var dependentVal = instance[dependent];
              Object.defineProperty(instance, dependent, {
                enumerable: true,
                configurable: true,
                get: function () {
                  return local;
                },
                set: function (val) {
                  if (val !== undefined && val != 'set')
                    local = val;
                  if (previousSetter) {
                    if (local == val)
                      previousSetter();
                    else
                      local = previousSetter();
                  }
                  instance[name] = 'set';
                  return local;
                }
              });
              if (data && data[dependent])
                instance[dependent] = data[dependent];
              else
                instance[dependent] = dependentVal;
            });
          };
          var instance = new this(data);
          setPrimaryKey(instance, data);
          cacheInstance(instance);
          _.each(associations.belongsTo, function (model) {
            var name = nameOfBelongsToModel(model);
            if (data && data[name] !== undefined) {
              instance[name] = data[name];
            }
            ;
          });
          _.each(associations.hasMany, function (collection) {
            var name = collection.klass.name.pluralize().camelize();
            instance[name][this.name.camelize()] = instance;
            if (data[name] !== undefined)
              addNewDataToCollection(data, name, instance);
          }, this);
          _.each(associations.hasOne, function (rel) {
            var name = rel.propertyName;
            if (data[rel.propertyName] !== undefined)
              addNewDataToHasOne(data, name, instance, rel);
          });
          addValidations(instance);
          _this.emit('new:complete', instance);
          return instance;
        };
        _this.where = function (terms, options) {
          _this.emit('where:called', terms);
          if (typeof terms != 'object')
            throw 'Argument to where must be an object';
          if (!options)
            options = {
              lazy: false,
              overEager: false
            };
          var cached = _this.cached.where(terms);
          options.cached = cached;
          options.multi = true;
          var url = _this.api.indexURL || _this.api.showURL;
          return GET(_this, url, terms, options).then(function (json) {
            var results = [];
            for (var i in json) {
              var instance = _this.new(json[i]);
              results.push(instance);
              serializer.deserialize(json[i], instance, options);
            }
            _this.watchedCollections.push(results);
            _this.emit('where:complete', {
              instance: results,
              data: json
            });
            return results;
          });
        };
        _this.all = function (options) {
          _this.emit('all:called');
          return _this.where({}, options).then(function (results) {
            var deferred = $q.defer();
            deferred.resolve(results);
            _this.emit('all:complete', results);
            return deferred.promise;
          });
        };
        _this.find = function (terms, options) {
          var cached;
          _this.emit('find:called', terms);
          if (typeof terms == 'number' || typeof terms == 'string')
            terms = argify(terms);
          if (typeof terms != 'object')
            throw 'Argument to find must be an object';
          if (!options)
            options = { lazy: false };
          if (!options.forceGET)
            cached = _.first(_this.cached.where(terms));
          var url = _this.api.showURL || _this.api.indexURL;
          if (cached !== undefined) {
            _this.emit('find:complete', cached);
            return deferred(cached);
          } else {
            return GET(_this, url, terms, options).then(function (json) {
              var instance = _this.new(json);
              _this.emit('find:complete', instance);
              return serializer.deserialize(json, instance, options);
            });
          }
        };
        _this.prototype.$delete = function () {
          var instance = this;
          _this.emit('$delete:called', this);
          var queryterms = {};
          queryterms[primaryKey] = instance[primaryKey];
          var url = URLify(_this.api.deleteURL, queryterms);
          return $http.delete(url).then(function (response) {
            if (response.status == 200) {
              removeFromWatchedCollections(instance);
              _this.emit('$delete:complete', instance);
              if (dependentDestroy.length >= 1)
                return destroyDependents(instance);
              unlinkAssociations(instance);
              delete _this.cached[instance[primaryKey]];
            }
          });
        };
        function removeFromWatchedCollections(instance) {
          _.each(_this.watchedCollections, function (watchedCollection) {
            _.remove(watchedCollection, instance);
          });
        }
        function instanceIsAssociatedWith(instance, association) {
          var associationName = nameOfBelongsToModel(association);
          return !!(instance[associationName] && instance[associationName].constructor == association);
        }
        ;
        function nameOfBelongsToModel(model) {
          if (!model)
            return;
          if (!model.klass && !model.name)
            return;
          if (!model.klass)
            return model.name.camelize();
          return model.klass.name.camelize();
        }
        ;
        _this.prototype.establishBelongsTo = function () {
          if (associations.belongsTo.length) {
            for (var i in associations.belongsTo) {
              var association = associations.belongsTo[i].klass;
              var associationName = nameOfBelongsToModel(association);
              if (instanceIsAssociatedWith(this, association)) {
                var belongs = this[associationName][this.constructor.name.pluralize().camelize()];
                if (belongs && belongs.push)
                  belongs.nodupush(this);
                else
                  belongs = this;
              }
            }
            ;
          }
        };
        function isSettableProperty(attr) {
          return _.include(getSettableProperties(_this), attr);
        }
        ;
        function instanceBelongsTo(attr) {
          return _.include(getBelongsToNames(), attr.camelize());
        }
        ;
        function instanceHasManyOf(attr) {
          return _.include(getHasManyNames(), attr.camelize());
        }
        ;
        function instanceHasOneOf(attr) {
          return _.include(getHasOneNames(), attr.camelize());
        }
        ;
        function updateBelongsRelationship(collection, name) {
          if (collection.constructor.name == 'Number' || collection.constructor.name == 'String') {
            collection = undefined;
          }
          if (collection)
            this[name] = collection;
        }
        ;
        function removeOldHasManyInstances(hasManyCollection, newHasManyObjects) {
          _.each(hasManyCollection, function (hasManyInstance) {
            var found = _.where(newHasManyObjects, function (newHasManyObject) {
                return hasManyInstance && hasManyInstance[primaryKey] == newHasManyObject[primaryKey];
              });
            if (!found.length)
              _.remove(hasManyCollection, hasManyInstance);
          });
        }
        function createOrUpdateHasManyInstances(hasManyCollection, newHasManyObjects) {
          _.each(newHasManyObjects, function (hasManyInstanceAttrs) {
            var instance = _.where(hasManyCollection, hasManyInstanceAttrs);
            if (!instance.length)
              hasManyCollection.new(hasManyInstanceAttrs);
            else
              instance[0].update(hasManyInstanceAttrs);
          }, this);
        }
        function updateHasManyRelationship(newCollectionPOJOs, collectionName) {
          var hasManyCollection = this[collectionName.camelize()];
          removeOldHasManyInstances(hasManyCollection, newCollectionPOJOs);
          createOrUpdateHasManyInstances(hasManyCollection, newCollectionPOJOs);
        }
        ;
        function updateHasOneRelationship(association, name) {
          _.each(associations.hasOne, function (related) {
            if (related.klass.name == name.classify()) {
              Object.defineProperty(this, name, {
                enumerable: true,
                configurable: true,
                value: related.klass.new(association)
              });
              var relatedBelongs = Associations.cached[related.klass.name.downcase()].belongsTo;
              _.each(relatedBelongs, function (belongs) {
                if (belongs.klass == this.constructor) {
                  this[name][belongs.propertyName] = this;
                }
              }, this);
            }
            ;
          }, this);
        }
        ;
        function getBelongsToNames() {
          return _.map(associations.belongsTo, function (association) {
            return association.klass.name.camelize();
          });
        }
        ;
        function getHasManyNames() {
          return _.map(associations.hasMany, function (association) {
            return association.klass.name.camelize().pluralize();
          });
        }
        ;
        function getHasOneNames() {
          return _.map(associations.hasOne, function (association) {
            return association.klass.name.camelize();
          });
        }
        function getSettableProperties(model) {
          var instance = model.new();
          var nonenumerables = Object.getOwnPropertyNames(instance);
          var properties = [];
          for (var prop in instance) {
            properties.nodupush(prop);
          }
          ;
          _.each(nonenumerables, function (prop) {
            properties.nodupush(prop);
          });
          properties.nodupush(primaryKey);
          var specialProps = [
              'establishBelongsTo',
              '$save',
              'update',
              '$delete',
              'associations',
              'primaryKey',
              'hasMany',
              'hasOne',
              'belongsTo',
              'validate',
              '$valid',
              '$invalid',
              '$errors',
              'validations',
              'validates'
            ];
          _.remove(properties, function (prop) {
            return _.include(specialProps, prop);
          });
          return properties;
        }
        ;
        function addValidations(instance) {
          if (instance.validations === undefined) {
            instance.validates({});
          }
          ;
          instance.validate = function (field) {
            return instance.validations.validate(field, instance);
          };
          instance.validateIfErrored = function (field) {
            if (instance.$errors[field])
              instance.validate(field, instance);
          };
          Object.defineProperty(instance, '$valid', {
            get: function () {
              return instance.validate();
            }
          });
          Object.defineProperty(instance, '$invalid', {
            get: function () {
              return !instance.$valid;
            }
          });
          Object.defineProperty(instance, '$errors', {
            get: function () {
              return instance.validations.$errors;
            }
          });
          instance.clearErrors = function (field) {
            instance.validations.clearErrors(field);
          };
        }
        ;
        function setPrimaryKey(instance, data) {
          instance[primaryKey] = data[primaryKey];
        }
        ;
        function addNewDataToCollection(data, name, instance) {
          _.each(data[name], function (associatedInstance) {
            instance[name].new(associatedInstance);
          });
        }
        ;
        function addNewDataToHasOne(data, name, instance, rel) {
          var dataprop = data[rel.propertyName];
          if (dataprop && dataprop.constructor.name == rel.klass.name) {
            var val = dataprop;
            var forAssoc = Associations.get(dataprop).belongsTo;
            _.each(forAssoc, function (association) {
              if (association.klass == instance.constructor) {
                dataprop[association.propertyName] = instance;
              }
            });
          } else {
            var belongsToAssociations = Associations.get(rel).belongsTo;
            var thisAssociation;
            _.each(belongsToAssociations, function (association) {
              if (association.klass == instance.constructor) {
                thisAssociation = association;
              }
              ;
            });
            data[name][thisAssociation.propertyName] = instance;
            var val = rel.klass.new(data[name]);
          }
          Object.defineProperty(instance, name, {
            enumerable: true,
            configurable: true,
            value: val
          });
        }
        ;
        function destroyDependents(instance) {
          _.each(dependentDestroy, function (dependent) {
            var associations = instance[dependent];
            _.each(associations, function (association) {
              association.$delete();
            });
          });
          _.defer(function () {
            unlinkAssociations(instance);
            delete _this.cached[instance[primaryKey]];
          });
        }
        ;
        function unlinkAssociations(instance) {
          _.each(associations.hasMany, function (hasManyInstance) {
            var associations = instance[hasManyInstance.klass.name.pluralize().camelize()];
            var name = instance.constructor.name.camelize();
            _.each(associations, function (association) {
              association[name] = undefined;
            });
          });
          _.each(associations.belongsTo, function (belongsInstance) {
            var association = instance[belongsInstance.klass.name.camelize()];
            if (!association)
              return;
            var name = instance.constructor.name.pluralize().camelize();
            _.remove(association[name], instance);
          });
        }
        ;
        function emptyCollection(association) {
          _.remove(association, function (instance) {
            return instance;
          });
        }
        function argify(terms) {
          var key = terms;
          terms = {};
          terms[primaryKey] = key;
          return terms;
        }
        ;
        var validations;
        Object.defineProperty(_this.prototype, 'validates', {
          enumerable: false,
          value: function (newValidations) {
            Object.defineProperty(this, 'validations', {
              enumerable: false,
              configurable: true,
              get: function () {
                return validations;
              },
              set: function (newValidations) {
                if (validations === undefined)
                  validations = new Validations(newValidations, this);
                validations.addValidations(newValidations);
              }
            });
            this.validations = newValidations;
          }
        });
        _this.prototype.hasMany = function (name, options) {
          if (!options)
            options = {};
          var association = new Association('hasMany', this, name, options);
          associations.hasMany.add(association);
          _this[name.classify()] = association.klass;
          this[name] = new Collection(association.klass, _this);
          this[name][_this.name.camelize()] = this;
        };
        _this.prototype.hasOne = function (table, options) {
          if (!options)
            options = {};
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
        _this.prototype.belongsTo = function (table, options) {
          if (!options)
            options = {};
          var association = new Association('BelongsTo', this, table, options);
          associations.belongsTo.add(association);
        };
        _this.dependentDestroy = function (dependents) {
          if (dependents.constructor.name != 'Array')
            dependents = [dependents];
          for (var i in dependents) {
            dependentDestroy.push(dependents[i]);
          }
          ;
        };
        return _this;
      }
      return Base;
    }
  ];
});
angular.module('ActiveResource').provider('AREventable', function () {
  this.$get = function () {
    function Eventable() {
      var events = { handlers: {} };
      Object.defineProperty(this, 'emit', {
        enumerable: true,
        value: function (eventType) {
          if (!events.handlers[eventType])
            return;
          var handlerArgs = Array.prototype.slice.call(arguments, 1);
          for (var i = 0, l = handlerArgs.length; i < l; i++) {
            events.handlers[eventType][i].apply(this, handlerArgs);
          }
          return events;
        }
      });
      function addAspect(eventType, handler) {
        if (!(eventType in events.handlers)) {
          events.handlers[eventType] = [];
        }
        events.handlers[eventType].push(handler);
        return this;
      }
      ;
      this.before = function (eventType, handler) {
        return addAspect(eventType + ':called', handler);
      };
      this.after = function (eventType, handler) {
        return addAspect(eventType + ':complete', handler);
      };
      this.fail = function (eventType, handler) {
        return addAspect(eventType + ':fail', handler);
      };
    }
    ;
    return Eventable;
  };
});
angular.module('ActiveResource').provider('ARValidations', function () {
  this.$get = [
    '$q',
    function ($q) {
      function Validations(data, instance) {
        var validations = [];
        var fields = {};
        this.$errors = {};
        function presence() {
          return function (value) {
            if (value === undefined || value === null)
              return false;
            if (value.constructor.name == 'String')
              return !!(value && value.length || typeof value == 'object');
            return value !== undefined;
          };
        }
        ;
        function requiredIf(requiredIf) {
          return function (value, field, instance) {
            if (requiredIf(value, field, instance) === true)
              return !!(value && value.length || typeof value == 'object');
            return true;
          };
        }
        ;
        function absence() {
          return function (value) {
            return !value;
          };
        }
        ;
        function email() {
          return function (value) {
            if (value === undefined || value === '' || value === null)
              return true;
            return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,6}$/.test(value);
          };
        }
        ;
        function zip() {
          return function (value) {
            if (value === undefined || value === '' || value === null)
              return true;
            return /(^\d{5}$)|(^\d{5}-{0,1}\d{4}$)/.test(value);
          };
        }
        ;
        function regex(regex) {
          return function (value) {
            if (value === undefined || value === '' || value === null)
              return true;
            return regex.test(value);
          };
        }
        ;
        function inclusion(options) {
          return function (value) {
            if (value === undefined || value === '' || value === null)
              return true;
            if (!options.in)
              throw 'Inclusion validator must specify \'in\' attribute.';
            var included = false;
            options.in.forEach(function (i) {
              if (i == value) {
                included = true;
              }
            });
            return included;
          };
        }
        ;
        function exclusion(options) {
          return function (value) {
            if (value === undefined || value === '' || value === null)
              return true;
            if (!options.from)
              throw 'Exclusion validator must specify \'from\' attribute.';
            var included = true;
            options.from.forEach(function (i) {
              if (i == value) {
                included = false;
              }
            });
            return included;
          };
        }
        ;
        function lengthIn(array) {
          return function (value) {
            if (value === undefined || value === '' || value == null)
              return true;
            return value.length >= array[0] && value.length <= array[array.length - 1];
          };
        }
        ;
        function min(min) {
          return function (value) {
            if (value === undefined || value === '' || value === null)
              return true;
            return value.length >= min;
          };
        }
        ;
        function max(max) {
          return function (value) {
            if (value === undefined || value === '' || value === null)
              return true;
            return value.length <= max;
          };
        }
        ;
        function lengthIs(is) {
          return function (value) {
            if (value === undefined || value === '' || value === null)
              return true;
            return String(value).length == is;
          };
        }
        function acceptance() {
          return function (value) {
            if (not(value))
              return true;
            return value == true;
          };
        }
        ;
        function confirmation() {
          return function (value, field) {
            confirmationName = field + 'Confirmation';
            confirmationField = instance[confirmationName];
            return value == confirmationField;
          };
        }
        ;
        function numericality(options) {
          return function (value) {
            if (!value)
              return true;
            value = String(value);
            if (options.ignore) {
              value = value.replace(options.ignore, '');
            }
            return !isNaN(Number(value));
          };
        }
        ;
        function integer(options) {
          return function (value) {
            if (!value)
              return true;
            if (value.constructor.name == 'Array')
              return false;
            if (value.constructor.name == 'Object')
              return false;
            value = String(value);
            if (value.match(/\./))
              return false;
            if (options.ignore) {
              value = value.replace(options.ignore, '');
            }
            return !isNaN(Number(value));
          };
        }
        ;
        function boolean(options) {
          return function (value) {
            if (value === undefined || value === '' || value === null)
              return true;
            return !!(value === true || value === false || value === 'true' || value === 'false');
          };
        }
        ;
        function string(options) {
          return function (value) {
            if (value === undefined || value === '' || value === null)
              return true;
            if (value.constructor.name === 'Array')
              return false;
            if (value.constructor.name === 'Object')
              return false;
            value = value.toString();
            return _.isString(value);
          };
        }
        ;
        function association(associationName) {
          return function (value, field, instance) {
            var association = instance[associationName];
            if (!association)
              return true;
            if (association && association.length >= 1) {
              return _.all(association, function (instance) {
                return instance.$valid;
              });
            } else {
              return association.$valid;
            }
          };
        }
        function customValidation(validation) {
          return function (value, field) {
            return function (value, field, instance) {
              if (value === undefined || value === '' || value === null)
                return true;
              return validation(value, field, instance);
            };
          };
        }
        ;
        function not(value) {
          if (value === false)
            return false;
          return !value;
        }
        ;
        presence.message = function (value) {
          return 'Can\'t be blank';
        };
        absence.message = function (value) {
          return 'Can\'t be defined';
        };
        email.message = function (value) {
          return 'Is not a valid email address';
        };
        zip.message = function (value) {
          return 'Is not a valid zip code';
        };
        regex.message = function (value) {
          return 'Is not the proper format';
        };
        inclusion.message = function (value) {
          lastVal = 'or ' + value.in.slice(-1);
          joinedArray = value.in.slice(0, -1);
          joinedArray.push(lastVal);
          if (joinedArray.length >= 3)
            list = joinedArray.join(', ');
          else
            list = joinedArray.join(' ');
          return 'Must be included in ' + list;
        };
        exclusion.message = function (value) {
          lastVal = 'or ' + value.from.slice(-1);
          joinedArray = value.from.slice(0, -1);
          joinedArray.push(lastVal);
          if (joinedArray.length >= 3)
            list = joinedArray.join(', ');
          else
            list = joinedArray.join(' ');
          return 'Must not be ' + list;
        };
        lengthIn.message = function (value) {
          var x = value[0];
          var y = value.slice(-1);
          return 'Must be between ' + x + ' and ' + y + ' characters';
        };
        min.message = function (value) {
          return 'Must be at least ' + value + ' characters';
        };
        max.message = function (value) {
          return 'Must be no more than ' + value + ' characters';
        };
        lengthIs.message = function (value) {
          return 'Must be exactly ' + value + ' characters';
        };
        acceptance.message = function (value) {
          return 'Must be accepted';
        };
        confirmation.message = function (value) {
          return 'Must match confirmation field';
        };
        numericality.message = function (value) {
          return 'Must be a number';
        };
        integer.message = function (value) {
          return 'Must be an integer';
        };
        boolean.message = function (value) {
          return 'Must be true or false';
        };
        string.message = function (value) {
          return 'Must be text';
        };
        association.message = function (value) {
          return value.classify() + ' invalid';
        };
        var validators = {
            presence: presence,
            requiredIf: { requiredIf: requiredIf },
            absence: absence,
            format: {
              email: email,
              zip: zip,
              regex: regex
            },
            inclusion: inclusion,
            exclusion: exclusion,
            length: {
              in: lengthIn,
              min: min,
              max: max,
              is: lengthIs
            },
            acceptance: acceptance,
            confirmation: confirmation,
            numericality: numericality,
            integer: integer,
            boolean: boolean,
            string: string,
            association: association
          };
        for (var validator in data) {
          fields[validator] = new Validation(data[validator], validator);
        }
        function fieldsToExecuteOn(field) {
          var toExecute;
          if (field === undefined)
            toExecute = fields;
          else
            toExecute = fields[field];
          if (toExecute === undefined)
            return;
          if (toExecute.constructor.name == 'Array')
            toExecute = _.zipObject([field], toExecute);
          return toExecute;
        }
        this.clearErrors = function (field) {
          var toClear = fieldsToExecuteOn(field);
          for (var field in toClear)
            delete this.$errors[field];
        };
        this.validate = function (field, instance) {
          var toValidate = fieldsToExecuteOn(field);
          for (var field in toValidate) {
            _.each(fields[field], function (validator) {
              if (!isValid(validator, instance, field)) {
                if (!this.$errors[field])
                  this.$errors[field] = [];
                this.$errors[field].nodupush(validator.message);
              } else {
                if (!this.$errors[field])
                  return;
                _.remove(this.$errors[field], function (error) {
                  return error == validator.message;
                });
                if (this.$errors[field].length === 0) {
                  delete this.$errors[field];
                }
              }
              ;
            }, this);
          }
          ;
          return Object.keys(this.$errors).length === 0;
        };
        function isValid(validator, instance, field) {
          var nestedFieldNames = field.split('.');
          var fieldValue = instance;
          _.each(nestedFieldNames, function (fieldName) {
            if (fieldValue)
              fieldValue = fieldValue[fieldName];
          });
          var validation = validator(fieldValue, field, instance);
          if (validation === undefined)
            return false;
          if (validation === false)
            return false;
          return true;
        }
        this.updateInstance = function (inst) {
          instance = inst;
        };
        this.addValidations = function (newValidations) {
          for (var validator in newValidations) {
            if (!fields[validator]) {
              fields[validator] = new Validation(newValidations[validator], validator);
            } else {
              fields[validator].push(new Validation(newValidations[validator], validator));
              fields[validator] = _.flatten(fields[validator]);
            }
          }
        };
        function Validation(data, field) {
          var validations = [];
          for (var validator in data) {
            addValidations(validator, data[validator], validators, field, data[validator]);
          }
          function addValidations(key, value, remainingHash, field, validationObject) {
            if (isFunction(remainingHash[key])) {
              pushValidation(remainingHash[key], value, field, validationObject);
              return;
            }
            if (isObject(remainingHash[key])) {
              remainingHash = remainingHash[key];
              keys = Object.keys(value);
              keys.forEach(function (key) {
                nestedValue = value[key];
                addValidations(key, nestedValue, remainingHash, field, validationObject);
              });
              return;
            }
            if (isUndefined(remainingHash[key])) {
              if (key == 'message')
                return;
              if (!value.validates) {
                throw 'Custom validators must provide a validates key containing a Boolean function.';
              }
            }
            pushValidation(customValidation(value.validates), value, field, validationObject);
          }
          function getProto(value) {
            return Object.prototype.toString.call(value);
          }
          function isObject(value) {
            return getProto(value) === '[object Object]';
          }
          function isFunction(value) {
            return getProto(value) === '[object Function]';
          }
          function isUndefined(value) {
            return value === undefined;
          }
          function pushValidation(validationKey, value, field, validationObject) {
            var validation = function (val, field, instance) {
              if (value.validates)
                value = value.validates;
              if (validationKey(value)(val, field, instance)) {
                return true;
              } else {
                return false;
              }
              ;
            };
            if (validationObject.message) {
              validation.message = validationObject.message;
            } else if (value.message) {
              validation.message = value.message;
            } else {
              validation.message = validationKey.message(value);
            }
            validations.push(validation);
          }
          return validations;
        }
      }
      function getConstructor(instance) {
        if (instance && instance.constructor)
          return instance.constructor;
        return undefined;
      }
      ;
      return Validations;
    }
  ];
});
var simpleForm = angular.module('simpleForm', ['ActiveResource']);
simpleForm.directive('form', function () {
  return {
    restrict: 'E',
    require: '^form',
    compile: function () {
      return {
        pre: function (scope, formElement, attrs, ctrl) {
          ctrl.$name = attrs.name || nameDefault() || attrs.ngForm;
          ctrl.$fields = {};
          function nameDefault() {
            return attrs['for'] ? attrs['for'] + 'Form' : '';
          }
          function assertNotHasOwnProperty(name, context) {
            if (name === 'hasOwnProperty') {
              throw ngMinErr('badname', 'hasOwnProperty is not a valid {0} name', context);
            }
          }
          ctrl.$addControl = function (control) {
            assertNotHasOwnProperty(control.$name, 'input');
            if (control.$name) {
              ctrl.$fields[control.$name] = control;
              ctrl[control.$name] = control;
            }
          };
        }
      };
    }
  };
});
simpleForm.directive('ngModel', [
  '$compile',
  function ($compile) {
    return {
      restrict: 'A',
      require: [
        '^ngModel',
        '^form'
      ],
      compile: function () {
        return {
          post: function (scope, element, attrs, ctrls) {
            var $model, modelCtrl = ctrls[0], formCtrl = ctrls[1] || nullFormCtrl;
            modelCtrl.$name = attrs.name || attrs.ngModel || 'unnamedInput', $modelname = attrs.ngModel.replace(/\.\w{0,}/g, ''), scope.$watch($modelname, function (model) {
              $model = model;
              if (!$model)
                return;
              fieldNames = _.without(Object.getOwnPropertyNames($model), 'validate', '$valid', '$invalid', '$errors', 'validateIfErrored');
              var originalValidate = angular.copy($model.validate);
              $model.validate = function (fieldToValidate) {
                var nameOfFieldNgModelIsOn = attrs.ngModel.replace(/\w{0,}\./, '');
                originalValidate.call($model, fieldToValidate);
                setValid(nameOfFieldNgModelIsOn);
                setInvalid(nameOfFieldNgModelIsOn);
                return Object.keys($model.$errors).length === 0;
              };
              function setInvalid(nameOfField) {
                if ($model.$errors[nameOfField])
                  modelCtrl.$setValidity(nameOfField, false);
              }
              ;
              function setValid(nameOfField) {
                if (!$model.$errors[nameOfField])
                  modelCtrl.$setValidity(nameOfField, true);
              }
              ;
            });
          }
        };
      }
    };
  }
]);