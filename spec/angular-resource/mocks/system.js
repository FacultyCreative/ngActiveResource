angular
  .module('ActiveResource.Mocks')
  .provider('ARMockSystem', function() {

    this.$get = ['ActiveResource',
      function(ActiveResource) {

        function System(data) {
          if (!data) data = {};
          this.placement = data.placement || undefined;
          this.name      = data.name      || undefined;
          
          this.hasMany('sensors',
            {provider: 'ARMockSensor'});
          
          this.hasOne('gridController',
            {provider: 'ARMockGridController'});
        };

        System = ActiveResource.Base.apply(System);
        System.api.set('http://api.faculty.com');

        return System;
    }];
  });
