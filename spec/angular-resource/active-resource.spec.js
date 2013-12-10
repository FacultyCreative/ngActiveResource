'use strict';

describe('ActiveResource', function() {

  var ActiveResource, Mocks, Sensor, System, system, backend, $timeout, $http;
  beforeEach(module('ActiveResource'));
  beforeEach(module('ActiveResource.Mocks'));

  beforeEach(inject(['ActiveResource', 'ActiveResource.Mocks', '$httpBackend', '$timeout', '$http',
    function(_ActiveResource_, _ARMocks_, _$httpBackend_, _$timeout_, _$http_) {
    ActiveResource = _ActiveResource_;
    Mocks          = _ARMocks_;
    System         = Mocks.System;
    Sensor         = Mocks.Sensor;
    backend        = _$httpBackend_;
    $timeout       = _$timeout_;
    $http          = _$http_;

    backend.whenGET('http://api.faculty.com/system/?id=5&placement=door').respond([{id: 5, placement: 'door'}]);
    backend.whenGET('http://api.faculty.com/system/?id=4').respond({id: 4});
    backend.whenGET('http://api.faculty.com/system/?placement=window').respond([{id: 5, placement: 'window'}, {id: 6, placement: 'window'}]);

    spyOn($http, 'get').andCallThrough();
    spyOn($http, 'post').andCallThrough();
    system = System.new({id: 1});
  }]));

  describe('Caching', function() {
    it('adds a cache to the model', function() {
      expect(System.cached).toBeDefined();
    });
  });

  describe('Associations', function() {
    describe('base#hasMany', function() {
      it('adds an empty collection', function() {
        expect(system.sensors.length).toEqual(0);
      });
    });

    describe('base#belongsTo', function() {
      it('establishes the belongsTo relationship', function() {
        system.sensors.$create({});
        var sensor = system.sensors[0];
        expect(sensor.system).toEqual(system);
      });
    });
  });

  describe('Associated Collections', function() {
    describe('collection#new', function() {
      it('establishes the belongs-to relationship', function() {
        var sensor = system.sensors.new()
        expect(sensor.system).toEqual(system);
      });

      it('does not push the sensor into the has-many relationship until save, or an id is on the sensor', function() {
        var sensor = system.sensors.new();
        expect(system.sensors[0]).toEqual(undefined);
      });

      it('accepts data to instantiate with', function() {
        var sensor = system.sensors.new({id: 1});
        expect(sensor.id).toEqual(1);
      });
    });

    describe('collection#$create', function() {
      it('establishes the belongs-to relationship', function() {
        var sensor = system.sensors.$create();
        expect(sensor.system).toEqual(system);
      });

      it('establishes the has-many relationship', function() {
        var sensor = system.sensors.$create();
        expect(system.sensors[0]).toEqual(sensor);
      })

      it('accepts data to instantiate with', function() {
        var sensor = system.sensors.$create({id: 1});
        expect(sensor.id).toEqual(1);
      });
    });

    describe('collection#delete', function() {

      beforeEach(function() {
        system.sensors.$create({id: 1});
        system.sensors.$create({id: 2});
        system.sensors.$delete(1);
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
        backend.expectPOST('http://faculty.api.com/sensor.json').respond({id: 1});
        sensor.$save().then(function(response) { sensor = response; });
        backend.flush();
      });

      it('adds collection members to the collection', function() {
        expect(system.sensors[0]).toEqual(sensor);
      });

      it('adds the new model to the cache', function() {
        expect(Sensor.cached[1]).toEqual(sensor);
      });

      it('adds an id if none is defined', function() {
        expect(system.sensors[0].id).toEqual(1);
      });
    });

    describe('base#$create', function() {
      it('adds to the cache', function() {
        system = System.$create({id: 1});
        expect(System.cached[1]).toEqual(system);
      });
    });

    describe('base#update', function() {

      beforeEach(function() {
        system = System.$create({id: 1});
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
        backend.expectPOST('http://api.faculty.com/system.json', {id: 1}).respond({id: 1, placement: undefined});
        backend.flush();
        system2 = System.$create({id: 2, placement: 'door'});
        system3 = System.$create({id: 3, placement: 'door'});
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

      var system2, system3;

      beforeEach(function() {
        system.$save().then(function(response) { system = response });
        backend.expectPOST('http://api.faculty.com/system.json', {id: 1}).respond({id: 1});
        backend.flush();
        system2 = System.$create({id: 2, placement: 'door'});
        system3 = System.$create({id: 3, placement: 'door'});
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

      xit('returns the instantiated model instead of the plain data', function() {
        var foundSystem;
        System.find({placement: 'window'}).then(function(response) { foundSystem = response; });
        backend.flush();
        expect(foundSystem.constructor.name).toBe('System');
      });

      xit('returns the first object only', function() {
        var foundSystem;
        System.find({placement: 'window'}).then(function(response) { foundSystem = response; });
        backend.flush();
        expect(foundSystem.id).toBe(5);
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

