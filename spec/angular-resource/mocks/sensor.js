angular
  .module('ActiveResource.Mocks')
  .provider('ARMockSensor', function() {
    this.$get = ['ActiveResource',
      function(ActiveResource) {
      function Sensor(data) {
        if (!data) data = {};
        this.id     = data.id     || undefined;
        this.system = data.system || undefined;
      };
      Sensor = ActiveResource.Base.apply(Sensor);
      return Sensor;
    }];
  });
