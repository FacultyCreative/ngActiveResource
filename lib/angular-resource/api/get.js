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
      }

      function resolveMultiGET(data, terms, options) {
        return data;
      }

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
      }

      function getAllParams(url) {
        var params = [];
        url.replace(/\:[a-zA-Z_]+/g, function(param) { params.push(param); });
        params = _.map(params, function(param) { return param.slice(1); });
        return params;
      }

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
      }

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