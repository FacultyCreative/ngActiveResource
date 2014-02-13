angular
  .module('ActiveResource.Mocks')
  .provider('Tshirt', function() {

    this.$get = ['ActiveResource', function(ActiveResource) {
      function Tshirt(attributes) {
        this.integer('order_id');
        this.number('price');
        this.boolean('available');
        this.string('name');
        this.computedProperty('salePrice', function() {
          return this.price - (this.price * 0.2);
        }, 'price');

        this.computedProperty('superSalePrice', function() {
          return this.price - this.salePrice;
        }, ['price', 'salePrice']);

        this.computedProperty('superDuperSalePrice', function() {
          return this.superSalePrice - this.salePrice - this.price + ' Wow! We owe YOU money!';
        }, ['price', 'salePrice', 'superSalePrice']);

        this.computedProperty('allTheProperties', function() {
          return [this.name, this.available, this.price, this.order_id];
        }, ['order_id', 'price', 'available', 'name']);

        this.computedProperty('prices', function() {
          var instance = this;
          return {
            price: instance.price,
            salePrice: instance.salePrice,
            superSalePrice: instance.superSalePrice,
            superDuperSalePrice: instance.superDuperSalePrice
          };
        }, ['price', 'salePrice', 'superSalePrice', 'superDuperSalePrice']);

        this.validates({
          size:      { inclusion: { in: ['small', 'medium', 'large'] } },
          salePrice: { numericality: true }
        });
      }

      Tshirt = ActiveResource.Base.apply(Tshirt);
      Tshirt.primaryKey    = '_id';
      Tshirt.api.indexURL  = 'http://api.faculty.com/tshirts';
      Tshirt.api.showURL   = 'http://api.faculty.com:3000/tshirt/:_id';
      Tshirt.api.deleteURL = 'http://api.faculty.com:3000/tshirt/:_id';

      return Tshirt;
    }];
  });
