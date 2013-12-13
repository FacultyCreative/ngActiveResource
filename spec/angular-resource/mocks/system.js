angular
  .module('ActiveResource.Mocks')
  .provider('ARMockSystem', function() {

    this.$get = ['ActiveResource', 'ARMockSensor',
      function(ActiveResource, Sensor) {

        function System(data) {
          if (!data) data = {};
          this.id        = data.id        || undefined;
          this.placement = data.placement || undefined;
          this.name      = data.name      || undefined;
          this.hasMany('sensors',
            ['ActiveResource.Mocks', 'ARMockSensor']);
        };

        System = ActiveResource.Base.apply(System);
        System.api.set('http://api.faculty.com');

        return System;
    }];
  });
