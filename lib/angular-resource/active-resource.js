angular
  .module('ActiveResource', ['ng', 'dojo'])
  .provider('ActiveResource', function() {
    this.$get = ['ARBase', function(Base) {
      ActiveResource      = {};
      ActiveResource.Base = Base;
      return ActiveResource;
    }];
  });
