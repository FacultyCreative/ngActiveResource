angular
  .module('ActiveResource')
  .provider('ARAPI', function() {
    this.$get = function() {
      function API(klass) {
        var className  = klass.name;
        var singular   = klass.name.toLowerCase();
        var plural     = singular.pluralize();
        this.findURL   = '';
        this.createURL = '';
        this.deleteURL = '';
        this.indexURL  = '';
        this.updateURL = '';

        this.set = function(url) {
          if (url.slice(-1) != '/') url = url + '/';
          this.createURL = url + singular + '.json';
          this.indexURL  = url + plural   + '.json';
          this.findURL   = this.deleteURL = this.updateURL = url + singular + '/[:attrs]';
          return this;
        }
      }
      return API;
    };
  });
