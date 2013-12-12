'use strict';

describe('ActiveResource', function() {

  var ActiveResource, Mocks, Sensor, System, system, backend, $timeout, $http, $rootScope;
  beforeEach(module('ActiveResource'));
  beforeEach(module('ActiveResource.Mocks'));

  beforeEach(inject(['ActiveResource', 'ActiveResource.Mocks', '$httpBackend', '$timeout', '$http', '$rootScope',
    function(_ActiveResource_, _ARMocks_, _$httpBackend_, _$timeout_, _$http_, _$rootScope_) {
    ActiveResource = _ActiveResource_;
    Mocks          = _ARMocks_;
    System         = Mocks.System;
    Sensor         = Mocks.Sensor;
    backend        = _$httpBackend_;
    $timeout       = _$timeout_;
    $http          = _$http_;
    $rootScope     = _$rootScope_;

    backend.whenGET('http://api.faculty.com/system/?id=5&placement=door')
      .respond([{id: 5, placement: 'door'}]);

    backend.whenGET('http://api.faculty.com/system/?id=4')
      .respond({id: 4});

    backend.whenGET('http://api.faculty.com/system/?placement=window')
      .respond([{id: 5, placement: 'window'}, {id: 6, placement: 'window'}]);

    backend.whenPOST('http://api.faculty.com/system.json', {sensors: []})
      .respond({id: 4});

    backend.whenPOST('http://api.faculty.com/sensor.json',
      {system: {id: 1, sensors: []}})
      .respond({id: 1});

    backend.whenPOST('http://api.faculty.com/system.json',
        {id: 1, sensors: []})
        .respond({id: 1});

    backend.whenPOST('http://api.faculty.com/system.json',
        {id: 2, placement: 'door', sensors: []})
        .respond({id: 2, placement: 'door'});

    backend.whenPOST('http://api.faculty.com/system.json',
        {id: 3, placement: 'door', sensors: []})
        .respond({id: 3, placement: 'door'});

    spyOn($http, 'get').andCallThrough();
    spyOn($http, 'post').andCallThrough();
    system = System.new({id: 1});
  }]));

  describe('Caching', function() {
    it('adds a cache to the model', function() {
      expect(System.cached).toBeDefined();
    });

    it('adds new instances to the cache', function() {
      expect(System.cached[1]).toBe(system);
    });

    it('cannot add new instances to the cache if they use the `new Constructor()` syntax', function() {
      var system2 = new System({id: 2});
      expect(System.cached[2]).toBe(undefined);
    });

    it('does not add instances to the cache if they do not have primary keys', function() {
      var system3   = new System();
      var assertion = _.include(System.cached, system3); 
      expect(assertion).toBe(false);
    });

    it('expects the backend to add primary keys on $save, and then adds it to the cache', function() {
      var system4 = new System();
      system4.$save().then(function(response) { system4 = response; });
      backend.flush();
      expect(System.cached[4]).toEqual(system4);
    });

    it('updates the cache for nested relationships on save', function() {
      var sensor = system.sensors.new();
      sensor.$save().then(function(response) { sensor = response; });
      backend.flush();
      expect(Sensor.cached[1]).toEqual(sensor);
    });
  });

  describe('Associations', function() {
    describe('base#hasMany', function() {
      it('adds an empty collection', function() {
        expect(system.sensors.length).toEqual(0);
      });

      it('adds new associated instances', function() {
        var sensor;
        system.sensors.new().$save().then(function(response) { sensor = response; });
        backend.flush();
        expect(system.sensors).toContain(sensor);
      });

      it('does not add new associated instances until they are saved', function() {
        var sensor = system.sensors.new();
        expect(system.sensors).not.toContain(sensor);
      });
    });

    describe('base#belongsTo', function() {
      it('establishes the belongsTo relationship', function() {
        var sensor;
        system.sensors.$create().then(function(response) {
          sensor = response;
        });
        backend.expectPOST('http://api.faculty.com/sensor.json', {"system":{"id":1,"sensors":[{"$ref":"#"}]}}).respond({id: 3, system: 1});
        backend.flush();
        expect(sensor.system).toEqual(system);
      });
    });
  });

  describe('Associated Collections', function() {

    describe('Constructors', function() {
      it('uses the same constructor chained associations', function() {
        var sensor1 = Sensor.new();
        var sensor2 = system.sensors.new(); 
        expect(sensor1.constructor == sensor2.constructor).toBe(true);
      });
    });

    describe('collection#new', function() {
      it('establishes the belongs-to relationship', function() {
        var sensor = system.sensors.new()
        expect(sensor.system).toEqual(system);
      });

      it('does not push the belongsTo instance into the has-many relationship until save, or an id is on the belongsTo instance', function() {
        var sensor = system.sensors.new();
        expect(system.sensors[0]).toEqual(undefined);
      });

      it('accepts data to instantiate with', function() {
        var sensor = system.sensors.new({state: 'alarmed'});
        expect(sensor.state).toEqual('alarmed');
      });
    });

    describe('collection#$create', function() {

      var sensor;

      beforeEach(function() {
        system.sensors.$create({state: 'alarmed'}).then(function(response) {
          sensor = response;
        });
        backend.expectPOST('http://api.faculty.com/sensor.json').respond({id: 1, system: 1});
        backend.flush();
      });

      it('establishes the belongs-to relationship', function() {
        expect(sensor.system).toEqual(system);
      });

      it('establishes the has-many relationship', function() {
        expect(system.sensors[0]).toEqual(sensor);
      })

      it('accepts data to instantiate with', function() {
        expect(sensor.state).toEqual('alarmed');
      });

      it('expects to receive an id from the database', function() {
        expect(sensor.id).toEqual(1);
      });

      it('is added to the cache', function() {
        expect(Sensor.cached[1]).toBe(sensor);
      });
    });

    describe('collection#delete', function() {

      var sensor1, sensor2;
      beforeEach(function() {
        system.sensors.$create().then(function(response) {
          sensor1 = response;
        });
        system.sensors.$create().then(function(response) {
          sensor2 = response;
        });
        backend.expectPOST('http://api.faculty.com/sensor.json').respond({id: 1, system: 1});
        backend.expectPOST('http://api.faculty.com/sensor.json').respond({id: 2, system: 1});
        backend.flush();
        sensor1.$delete();
        backend.expectDELETE('http://api.faculty.com/sensor/?id=1').respond({data: 'success'});
        backend.flush();
      });

      it('deletes the instance from the collection', function() {
        expect(system.sensors[1]).not.toBeDefined();
      });

      it('updates its length', function() {
        expect(system.sensors.length).toBe(1);
      });

      it('still contains all other members', function() {
        expect(system.sensors[0].id).toEqual(2);
      });
    });

    it('updates the relationships when set via setters IFF there is an id on the belongsTo relationship', function() {
      var sensor = Sensor.new({id: 1});
      var system = System.new();
      sensor.system = system;
      expect(system.sensors).toContain(sensor);
    });

    it('does not update the relationship if the belongsTo relationship is not yet fully instantiated via an id', function() {
      var sensor = Sensor.new();
      var system = System.new();
      sensor.system = system;
      expect(system.sensors).not.toContain(sensor);
    });
  });

  describe('Persistence', function() {
    describe('base#save', function() {
      var sensor;
      beforeEach(function() {
        sensor = system.sensors.new();
        sensor.$save().then(function(response) { sensor = response; });
        backend.flush();
      });

      it('adds collection members to the collection', function() {
        expect(system.sensors[0]).toEqual(sensor);
      });

      it('adds the new model to the cache', function() {
        expect(Sensor.cached[1]).toEqual(sensor);
      });

      it('adds the id that it received from the backend', function() {
        expect(system.sensors[0].id).toEqual(1);
      });
    });

    describe('base#$create', function() {
      it('adds to the cache', function() {
        System.$create({id: 1}).then(function(response) { system = response; });
        backend.flush();
        expect(System.cached[1]).toEqual(system);
      });
    });

    describe('base#update', function() {

      beforeEach(function() {
        System.$create({id: 1}).then(function(response) { system = response; });
        backend.flush();
      });

      it('updates the instance', function() {
        system.update({placement: 'window'});
        System.find(1).then(function(results) { system = results; });
        expect(system.placement).toEqual('window');
      });

      it('updates associated relations if described', function() {
        system.update({sensors: [{id: 1}]});
        expect(system.sensors[0].constructor.name).toBe('Sensor');
      });

      it('adds all new associated relations to the relationship', function() {
        system.update({sensors: [{id: 1}, {id: 2}]});
        expect(system.sensors.length).toBe(2);
      });

      it('removes entities previously in associated collections', function() {
        for (var i = 0; i<3; i++) { system.sensors.$create(); }
        system.update({sensors: [{id: 1}]});
        expect(system.sensors.length).toBe(1);
      });
    });
  });

  describe('Querying', function() {
    describe('base#where', function() {

      var system2, system3;

      beforeEach(function() {
        system.$save().then(function(response) { system = response; });
        System.$create({id: 2, placement: 'door'}).then(function(response) { system2 = response; });
        System.$create({id: 3, placement: 'door'}).then(function(response) { system3 = response; });
        backend.flush();
      });

      it('finds by id', function() {
        var foundSystems;
        System.where({id: 1}).then(function(response) { foundSystems = response; });
        $timeout.flush();
        expect(foundSystems).toEqual([system]);
      });

      it('finds by any attr', function() {
        var foundSystems;
        System.where({placement: 'door'}).then(function(response) { foundSystems = response; });
        $timeout.flush();
        expect(foundSystems).toEqual([system2, system3])
      });

      it('queries the backend if nothing is found in the cache', function() {
        var foundSystems;
        System.where({id: 5, placement: 'door'}).then(function(response) { foundSystems = response; });
        backend.flush();
        expect(foundSystems[0].constructor.name).toBe('System');
      });

      it('creates a new instance in the cache', function() {
        var foundSystems;
        System.where({id: 5, placement: 'door'}).then(function(response) { foundSystems = response; });
        backend.flush();
        expect(System.cached[5]).toBe(foundSystems[0]);
      });
    });

    describe('base#find', function() {

      var system2, system3, sensor2;

      beforeEach(function() {
        system.$save().then(function(response) { system = response });
        backend.expectPOST('http://api.faculty.com/system.json', {id: 1, sensors: []}).respond({id: 1});
        backend.expectPOST('http://api.faculty.com/system.json', {placement: 'door', sensors: []}).respond({id: 2, placement: 'door'});
        backend.expectPOST('http://api.faculty.com/system.json', {placement: 'door', sensors: []}).respond({id: 3, placement: 'door'});
        System.$create({placement: 'door'}).then(function(response) { system2 = response; });
        System.$create({placement: 'door'}).then(function(response) { system3 = response; });
        backend.flush();
      });

      it('returns the first instance found', function() {
        var foundSystem;
        System.find({id: 1}).then(function(response) { foundSystem = response; });
        $timeout.flush();
        expect(foundSystem).toEqual(system);
      });

      it('accepts any attributes', function() {
        var foundSystem;
        System.find({placement: 'door'}).then(function(response) { foundSystem = response; });
        $timeout.flush();
        expect(foundSystem).toEqual(system2);
      });

      it('queries the backend if the instance is not found in the cache', function() {
        var foundSystem;
        System.find({id: 4}).then(function(response) { foundSystem = response; });
        backend.flush();
        expect(foundSystem.id).toEqual(4);
      });

      it('queries the backend using multiple parameters', function() {
        var foundSystem;
        System.find({placement: 'window'}).then(function(response) { foundSystem = response; });
        backend.flush();
        expect(foundSystem.id).toEqual(5);
      });

      it('returns the instantiated model instead of the plain data', function() {
        var foundSystem;
        System.find({placement: 'window'}).then(function(response) { foundSystem = response; });
        backend.flush();
        expect(foundSystem.constructor.name).toBe('System');
      });

      it('returns the first object only', function() {
        var foundSystem;
        System.find({placement: 'window'}).then(function(response) { foundSystem = response; });
        backend.flush();
        expect(foundSystem.id).toBe(5);
      });

      it('also queries for associated models that need to be filled', function() {
        var sensor2;
        backend.expectGET('http://api.faculty.com/sensor/?id=2').respond({id: '2', system: '9'});
        backend.expectGET('http://api.faculty.com/system/?id=9').respond({id: '9'});
        Sensor.find({id: 2}).then(function(response) { sensor2 = response; });
        backend.flush();
        expect(sensor2.system.id).toEqual('9');
      });
    });
  });

  describe('Base#api', function() {
    describe('Base.api#set', function() {
      it('creates a find url', function() {
        expect(System.api.findURL).toEqual('http://api.faculty.com/system/[:attrs]');
      });

      it('creates a create url', function() {
        expect(System.api.createURL).toEqual('http://api.faculty.com/system.json');
      });

      it('creates a delete url', function() {
        expect(System.api.deleteURL).toEqual('http://api.faculty.com/system/[:attrs]');
      });

      it('creates an index url', function() {
        expect(System.api.indexURL).toEqual('http://api.faculty.com/systems.json');
      });

      it('creates an update url', function() {
        expect(System.api.updateURL).toEqual('http://api.faculty.com/system/[:attrs]');
      });
    });

    describe('Base.api Overriding Individual URLs', function() {
      beforeEach(function() {
        System.api.findURL   = 'http://api.faculty.com/find/system.json';
        System.api.createURL = 'http://api.faculty.com/create/system.json';
        System.api.deleteURL = 'http://api.faculty.com/delete/system.json';
        System.api.indexURL  = 'http://api.faculty.com/index/system.json';
        System.api.updateURL = 'http://api.faculty.com/update/system.json';
      });

      it('sets find individually', function() {
        expect(System.api.findURL).toBe('http://api.faculty.com/find/system.json');
      });
        
      it('sets create individually', function() {
        expect(System.api.createURL).toBe('http://api.faculty.com/create/system.json');
      });

      it('sets delete individually', function() {
        expect(System.api.deleteURL).toBe('http://api.faculty.com/delete/system.json');
      });
      
      it('sets index individually', function() {
        expect(System.api.indexURL).toBe('http://api.faculty.com/index/system.json');
      });

      it('sets update individually', function() {
        expect(System.api.updateURL).toBe('http://api.faculty.com/update/system.json');
      });
    });

    describe('API Methods', function() {
      describe('Model#find', function() {
        it('calls GET to the specified API, filling in the correct ID', function() {
          System.find(4);
          expect($http.get).toHaveBeenCalledWith('http://api.faculty.com/system/?id=4');
        });

        it('calls GET with the specified attributes attached to the querystring', function() {
          System.find({placement: 'window'});
          expect($http.get).toHaveBeenCalledWith('http://api.faculty.com/system/?placement=window');
        });
      });
    });
  });
});

