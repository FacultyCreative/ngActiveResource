'use strict';

describe('ActiveResource', function() {

  var Base, System, Sensor, Inflector, system;
  beforeEach(module('ActiveResource'));
  beforeEach(module('ActiveResource.Collection'));
  beforeEach(module('ActiveResource.API'));
  beforeEach(module('ActiveResource.Base'));

  beforeEach(inject(['ARBase', function(ARBase) {
    Base = ARBase;
  }]));

  it('worked', function() {
    function System() {};
    System = Base.apply(System);
    system = new System({id: 1});
    expect(System.cached).toBe('');
  });
});
 
