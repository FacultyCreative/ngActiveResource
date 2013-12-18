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
        GridController.api.findURL = 'http://api.faculty.com/grid-controller/[:attrs]';
        GridController.api.createURL = 'http://api.faculty.com/grid-controller.json';

        return GridController;
    }];
  });
