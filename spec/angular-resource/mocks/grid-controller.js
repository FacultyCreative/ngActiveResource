angular
  .module('ActiveResource.Mocks')
  .provider('ARMockGridController', function() {

    this.$get = ['ActiveResource',
      function(ActiveResource) {

        function GridController(data) {
          if (!data) data = {};

          this.status = data.status || undefined;
          this.belongsTo('system',
            {provider: 'ARMockSystem'});
        };

        GridController = ActiveResource.Base.apply(GridController);
        GridController.api.set('http://api.faculty.com');
        GridController.api.showURL = 'http://api.faculty.com/grid-controllers';
        GridController.api.createURL = 'http://api.faculty.com/grid-controllers';

        return GridController;
    }];
  });
