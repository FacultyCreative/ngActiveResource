angular
  .module('app', ['ActiveResource'])
  .controller('MainCtrl', ['$scope', 'ARSystem', 'ARSensor', 'json', 
      function($scope, System, Sensor, json) {
    $scope.system = System.new({id: 1});
    $scope.sensor = $scope.system.sensors.new({id: 1});
    $scope.json   = json;

    $scope.sensor.$save().then(function(response) {
      $scope.sensor.update({id: 1, placement: '0'});
    });
    
  }])
  .provider('ARSensor', function() {
    this.$get = ['ActiveResource',
      function(ActiveResource) {
      function Sensor(data) {
        if (!data) data = {};
        this.id     = data.id     || undefined;
        this.system = data.system || undefined;
        this.belongsTo('system',
          ['app', 'ARSystem']);
      };

      Sensor = ActiveResource.Base.apply(Sensor);
      Sensor.api.set('http://api.faculty.com/');
      return Sensor;
    }];
  })
  .provider('ARSystem', function() {
    this.$get = ['ActiveResource',
      function(ActiveResource) {
        function System(data) {
          if (!data) data = {};
          this.id        = data.id        || undefined;
          this.placement = data.placement || undefined;
          this.hasMany('sensors',
            ['app', 'ARSensor']);
        };

        System = ActiveResource.Base.apply(System);
        System.api.set('http://api.faculty.com/');

        return System;
    }];
  });
