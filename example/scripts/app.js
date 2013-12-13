angular
  .module('app', ['ng', 'ngRoute', 'ActiveResource'])
  .config(['$routeProvider', function(Router) {
    Router
      .when('/', {
        controller: 'MainCtrl',
        templateUrl: 'templates/home.html'
      });
  }])
  .controller('MainCtrl', ['$scope', 'ARSystem', 'ARSensor', 'json', 
      function($scope, System, Sensor, json) {
        $scope.system = System.new({id: 1});
    
        Sensor.find({"_id": "52a8b80d251c5395b485cfe6"}).then(function(response) {
          $scope.sensor = response;
        });
      }
  ])
  .provider('ARSensor', function() {
    this.$get = ['ActiveResource',
      function(ActiveResource) {

      function Sensor(data) {
        if (!data) data = {};
        if (data[0]) data = data[0];
        this.id     = data.id     || data['_id'] || undefined;
        this.name   = data.name   || undefined;
        this.system = data.system || undefined;
        this.belongsTo('system', ['app', 'ARSystem']);
      };

      Sensor = ActiveResource.Base.apply(Sensor);
      Sensor.api.set('0.0.0:3000/api');
      Sensor.api.findURL   = 'http://0.0.0:3000/api/sensors/[:attrs]';
      Sensor.api.createURL = '0.0.0:3000/api/sensors';

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
