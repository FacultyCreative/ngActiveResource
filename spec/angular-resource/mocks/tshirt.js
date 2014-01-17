angular
  .module('ActiveResource.Mocks')
  .provider('Tshirt', function() {

    this.$get = ['ActiveResource', function(ActiveResource) {
      function Tshirt() {
      }

      Tshirt = ActiveResource.Base.apply(Tshirt);
      Tshirt.api.indexURL = 'http://api.faculty.com/tshirts/[:attrs]';
      Tshirt.api.showURL = 'http://api.faculty.com/tshirt/:id';

      return Tshirt;
    }];
  });
