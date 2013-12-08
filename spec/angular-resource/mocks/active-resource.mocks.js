angular
  .module('ActiveResource.Mocks', [])
  .provider('ActiveResource.Mocks', function() {
    this.$get = ['ARMockSystem', 'ARMockSensor',
      function(System, Sensor) {
      Mocks        = {};
      Mocks.System = System;
      Mocks.Sensor = Sensor;
      
      return Mocks;
    }];
  });
