angular
  .module('ActiveResource')
  .provider('ARAPI', function() {
    this.$get = [function() {
      function API(klass) {
        var className  = klass.name.hyphenate();
        var singular   = className.toLowerCase();
        var plural     = singular.pluralize();
        this.indexURL  = '';
        this.createURL = '';
        this.showURL   = '';
        this.deleteURL = '';
        this.updateURL = '';

        this.set = function(url) {
          if (url.slice(-1) != '/') url = url + '/';
          this.createURL = url + plural;
          this.updateURL = url + plural + '/:id';
          this.showURL   = this.indexURL = this.deleteURL = url + plural + '/[:attrs]';
          return this;
        }
      }
      return API;
    }];
  });
