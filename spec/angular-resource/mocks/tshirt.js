angular
  .module('ActiveResource.Mocks')
  .provider('Tshirt', function() {

    this.$get = ['ActiveResource', function(ActiveResource) {
      function Tshirt() {
      }

      Tshirt = ActiveResource.Base.apply(Tshirt);
      return Tshirt;
    }];
  });
