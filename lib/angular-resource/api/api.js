angular
  .module('ActiveResource')
  .provider('ARAPI', function() {
    this.$get = ['ARHelpers', function(Helpers) {
      function API(klass, pk) {
        var className  = klass.name.hyphenate();
        var singular   = className.toLowerCase();
        var plural     = singular.pluralize();
        var primaryKey = pk || 'id';
        this.indexURL  = '';
        this.createURL = '';
        this.showURL   = '';
        this.deleteURL = '';
        this.updateURL = '';

        this.set = function(url) {
          if (url.slice(-1) != '/') url = url + '/';
          this.createURL = url + plural;
          this.updateURL = url + plural + '/:' + primaryKey;
          this.showURL   = this.indexURL = this.deleteURL = url + plural;
          return this;
        }

        this.updatePrimaryKey = function(pk) {
          primaryKey = pk;
          this.updateURL = this.updateURL;
        }
      }
      return API;
    }];
  });
