Function.prototype.inherits = function(base) {
  var _constructor;
  _constructor = this;
  return _constructor = base.apply(_constructor);
};

angular
  .module('ActiveResource', ['ng', 'dojo'])
  .provider('ActiveResource', function() {
    this.$get = ['ARBase', function(Base) {
      ActiveResource      = {};
      ActiveResource.Base = Base;
      return ActiveResource;
    }];
  });
