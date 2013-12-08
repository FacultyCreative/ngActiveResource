angular
  .module('ActiveResource.Mocks')
  .provider('ARMockSystem', function() {
    this.$get = ['ActiveResource', 'ARMockSensor',
      function(ActiveResource, Sensor) {
        function System(data) {
          if (!data) data = {};
          this.id        = data.id        || undefined;
          this.placement = data.placement || undefined;
        };

        System = ActiveResource.Base.apply(System);
        System.hasMany('sensors', ['ActiveResource.Mocks', 'ARMockSensor']);
        System.api.set('http://api.faculty.com/');

        return System;
    }];
  });
