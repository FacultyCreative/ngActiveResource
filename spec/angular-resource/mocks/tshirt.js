angular
  .module('ActiveResource.Mocks')
  .provider('Tshirt', function() {

    this.$get = ['ActiveResource', function(ActiveResource) {
      function Tshirt(attributes) {
        this.integer('order_id');
        this.number('price');
        this.boolean('available');
        this.string('name');

        this.validates({
          size: { inclusion: { in: ['small', 'medium', 'large'] } }
        });
      }

      Tshirt = ActiveResource.Base.apply(Tshirt);
      Tshirt.primaryKey    = '_id';
      Tshirt.api.indexURL  = 'http://api.faculty.com/tshirts/[:attrs]';
      Tshirt.api.showURL   = 'http://api.faculty.com:3000/tshirt/:_id';
      Tshirt.api.deleteURL = 'http://api.faculty.com:3000/tshirt/:_id';

      return Tshirt;
    }];
  });
