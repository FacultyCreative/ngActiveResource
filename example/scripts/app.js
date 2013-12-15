angular
  .module('app', ['ng', 'ngRoute', 'ActiveResource'])
  .config(['$routeProvider', '$httpProvider', function(Router, $http) {
    Router
      .when('/', {
        controller: 'MainCtrl'
      });
      $http.defaults.useXDomain = true;
      delete $http.defaults.headers.common['X-Requested-With'];
  }])
  .controller('MainCtrl', ['$scope', 'System', 'Sensor', 'json', 
      function($scope, System, Sensor, json) {
        $scope.system = System.new();
        System.find('52abf5cdb7c9be185a000002').then(function(response) {
          $scope.system = response;
          $scope.sensor = $scope.system.sensors.new();
          Sensor.after('$save', function(e) {
            $scope.sensor = $scope.system.sensors.new();
          });

        });

      }
  ])
  .provider('Sensor', function() {
    this.$get = ['ActiveResource',
      function(ActiveResource) {

      function Sensor(data) {

        if (!data) data = {};
        if (data[0]) data = data[0];

        this.name   = data.name   || undefined;
        this.system = data.system || undefined;
        this.belongsTo('system', {foreignKey: 'system_id'});
      };

      Sensor = ActiveResource.Base.apply(Sensor);
      Sensor.api.set('0.0.0:3000/api');
      Sensor.primaryKey = "_id";
      Sensor.api.findURL   = 'http://0.0.0:3000/api/sensors/[:attrs]';
      Sensor.api.createURL = 'http://0.0.0:3000/api/sensors';
      Sensor.api.deleteURL = 'http://0.0.0:3000/api/sensors/[:attrs]';

      return Sensor;
    }];
  })
  .provider('System', function() {
    this.$get = ['ActiveResource',
      function(ActiveResource) {

        function System(data) {

          if (!data) data = {};
          this.placement = data.placement || undefined;
          this.hasMany('sensors');
        };

        System = ActiveResource.Base.apply(System);
        System.primaryKey = "_id";
        System.api.set('http://0.0.0:3000/api/systems');
        System.api.createURL = 'http://0.0.0:3000/api/systems';

        return System;
    }];
  });
