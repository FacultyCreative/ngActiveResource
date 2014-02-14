angular
  .module('ActiveResource')
  .provider('Mime', function() {
    this.$get = [function() {
      types = ['json'],
      types.register = function(mimetype) {
        mimetype = mimetype.replace(/\./g, '');
        types.nodupush(mimetype);
      }
      return {
        types: types
      }
    }];
  })
