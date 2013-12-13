angular
  .module('ActiveResource.Mocks')
  .provider('ARMockSensor', function() {
    this.$get = ['ActiveResource',
      function(ActiveResource) {
      function Sensor(data) {
        if (!data) data = {};
        this.id     = data.id     || undefined;
        this.state  = data.state  || undefined;
        this.system = data.system || undefined;
        this.belongsTo('system',
          ['ActiveResource.Mocks', 'ARMockSystem']);
      };

      Sensor = ActiveResource.Base.apply(Sensor);
      Sensor.api.set('http://api.faculty.com/');
      return Sensor;
    }];
  });
