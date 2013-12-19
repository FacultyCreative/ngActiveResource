angular
  .module('ActiveResource.Mocks')
  .provider('ARMockBase', function() {
    this.$get = ['ActiveResource', function(ActiveResource) {
      function Base(data) {
        this.connected = data.connected || false;
        this.belongsTo('system', {provider: 'ARMockSystem'});
      };
      Base = ActiveResource.Base.apply(Base);
      return Base;
    }];
  });
