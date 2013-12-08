angular
  .module('ActiveResource', ['ng'])
  .provider('ActiveResource', function() {
    this.$get = ['ARBase', function(Base) {
      ActiveResource      = {};
      ActiveResource.Base = Base;
      return ActiveResource;
    }];
  });
