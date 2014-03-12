angular
  .module('ActiveResource')
  .provider('ARQuerystring', function() {
    this.$get = function() {
      var querystring = {
        stringify: function(object) {
          var string = '';
          _.map(object, function(val, key) {
            if (string.length === 0) string +=       key + '=' + val;
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