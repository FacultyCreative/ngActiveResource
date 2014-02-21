angular
  .module('ActiveResource')
  .provider('ARAPI', function() {
    this.$get = ['ARHelpers', 'Mime', function(Helpers, Mime) {
      function API(klass, pk) {
        var className  = klass.name.hyphenate();
        var singular   = className.toLowerCase();
        var plural     = singular.pluralize();
        var format;
        var primaryKey = pk || 'id';
        this.indexURL  = '';
        this.createURL = '';
        this.showURL   = '';
        this.deleteURL = '';
        this.updateURL = '';

        this.set = function(url) {
          if (url.slice(-1) != '/') url = url + '/';
          this.createURL = url + plural;
          this.updateURL = this.showURL = this.deleteURL = url + plural + '/:' + primaryKey;
          this.indexURL = url + plural;
          return this;
        };

        this.updatePrimaryKey = function(pk) {
          primaryKey = pk;
          this.updateURL = this.updateURL;
          return this;
        };

        this.format = function(f) {
          Mime.types.register(f);
          if (!f.match(/\.\w+/)) f = '.' + f;
          format = f;
          for (var attr in this) {
            if (attr.match(/URL/)) {
              _.each(Mime.types, function(mimetype) {
                var mimeTypeRegex = new RegExp('.' + mimetype);
                this[attr] = this[attr].replace(mimeTypeRegex, '');
              }, this);
              this[attr] += format;
            };
          };
        };
      }
      return API;
    }];
  });
