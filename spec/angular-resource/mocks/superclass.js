angular
  .module('ActiveResource.Mocks')
  .provider('ARMockSuperClass', function() {
    this.$get = ['ActiveResource', function(ActiveResource) {
      function SuperClass(data) {
        this.superClassVal = 'one';
      };
      return SuperClass;
    }];

  });
