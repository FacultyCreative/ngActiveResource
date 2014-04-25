'use strict';

describe('ActiveResource', function() {

  var ActiveResource, Mocks, Sensor, System, GridController, Post, Comment, Author, User, Tshirt, Project,
    system, backend, $timeout, $http, Mime;

  function numkeys(object) {
    return Object.keys(object).length;
  };

  beforeEach(module('ActiveResource'));
  beforeEach(module('ActiveResource.Mocks'));

  beforeEach(inject(['ActiveResource', 'ActiveResource.Mocks', '$httpBackend', '$timeout', '$http', 'Mime',
    function(_ActiveResource_, _ARMocks_, _$httpBackend_, _$timeout_, _$http_, _Mime_) {
    ActiveResource = _ActiveResource_;
    Mocks          = _ARMocks_;
    System         = Mocks.System;
    Sensor         = Mocks.Sensor;
    GridController = Mocks.GridController;
    Post           = Mocks.Post;
    Comment        = Mocks.Comment;
    Author         = Mocks.Author;
    User           = Mocks.User;
    Tshirt         = Mocks.Tshirt;
    Project        = Mocks.Project;
    backend        = _$httpBackend_;
    $timeout       = _$timeout_;
    $http          = _$http_;
    Mime           = _Mime_;

    // MOCK API RESPONSES
    // 
    // GET SYSTEM
    // Requests for mock "persisted" systems that will be returned from the mock API
    backend.whenGET('http://api.faculty.com/systems/1')
      .respond([{id: 1}]);

    backend.whenGET('http://api.faculty.com/systems/2')
      .respond([{id: 2}]);
  
    backend.whenGET('http://api.faculty.com/systems/3')
      .respond([{id: 3}]);

    backend.whenGET('http://api.faculty.com/systems/4')
      .respond([{id: 4}]);

    backend.whenGET('http://api.faculty.com/systems?id=5&placement=door')
      .respond([{id: 5, placement: 'door'}]);

    backend.whenGET('http://api.faculty.com/systems?placement=window')
      .respond([{id: 6, placement: 'window'}, {id: 7, placement: 'window'}]);

    // POST SYSTEM
    // Responses for POST requests to create new systems
    backend.whenPOST('http://api.faculty.com/systems', {placement: 'window', name: 'Bretts System', sensors: []})
      .respond({id: 8, placement: 'window', name: 'Bretts System'});
    
    backend.whenPOST('http://api.faculty.com/systems', {placement: 'window', name: 'Matts System', sensors: []})
        .respond({id: 9, placement: 'window', name: 'Matts System'});

    backend.whenPOST('http://api.faculty.com/systems',
        {id: 10, placement: 'door', sensors: []})
        .respond({id: 10, placement: 'door'});

    backend.whenPOST('http://api.faculty.com/systems')
      .respond({id: 1});

    // tshirts 

    backend.whenGET('http://api.faculty.com/tshirts')
      .respond([{_id: 1, order_id: 1, price: '1.00', available: true, name: 'shirt'}]);

    // GET SENSOR
    // Requests for mock "persisted" sensors
    backend.whenGET('http://api.faculty.com/sensors/1')
      .respond({id: 1, system_id: 1});

    backend.whenGET('http://api.faculty.com/sensors/2')
      .respond({id: 2, system_id: 2});

    // POST SENSOR
    // Responses for POST requests to create new sensors
    backend.whenPOST('http://api.faculty.com/sensors',
      {system_id: 1})
      .respond({id: 3});

    backend.whenPOST('http://api.faculty.com/sensors')
      .respond({id: 3, system_id: 1});

    // POST POST
    // Reponses for POST requests to create new 'posts'
    backend.whenPOST('http://api.faculty.com/posts')
      .respond({"_id":1});

    spyOn($http, 'get').andCallThrough();
    spyOn($http, 'post').andCallThrough();
    spyOn($http, 'delete').andCallThrough();
    spyOn($http, 'put').andCallThrough();
    system = System.new({id: 1});
  }]));

  describe('Adding Properties', function() {

    var tshirt;
    beforeEach(function() {
      tshirt = Tshirt.new({order_id: 1, price: 10.99, available: true, name: 'Ragin Shirt'});
    });

    describe('Integer property type', function() {
      it('is valid if the property is an integer', function() {
        expect(tshirt.$valid).toBe(true);
      });

      it('is invalid if the value is a float', function() {
        tshirt.order_id = 1.5;
        expect(tshirt.$valid).toBe(false);
      });

      it('is invalid if the value is a string', function() {
        tshirt.order_id = 'NaN';
        expect(tshirt.$valid).toBe(false);
      });

      it('is invalid if the value is an array', function() {
        tshirt.order_id = ['value'];
        expect(tshirt.$valid).toBe(false);
      });

      it('is invalid if the value is an object', function() {
        tshirt.order_id = Tshirt.new();
        expect(tshirt.$valid).toBe(false);
      });

      it('is valid if it contains commas', function() {
        tshirt.order_id = '1,111';
        expect(tshirt.$valid).toBe(true);
      });
    });

    describe('Number property type', function() {
      it('is valid if the property is an integer', function() {
        tshirt.price = '10';
        expect(tshirt.$valid).toBe(true);
      });

      it('is valid if the value is a float', function() {
        expect(tshirt.$valid).toBe(true);
      });

      it('is invalid if the value is a string', function() {
        tshirt.price = 'NaN';
        expect(tshirt.$valid).toBe(false);
      });

      it('is invalid if the value is an array', function() {
        tshirt.price = ['value'];
        expect(tshirt.$valid).toBe(false);
      });

      it('is invalid if the value is an object', function() {
        tshirt.price = Tshirt.new();
        expect(tshirt.$valid).toBe(false);
      });

      it('is valid if it contains commas', function() {
        tshirt.price = '1,111';
        expect(tshirt.$valid).toBe(true);
      });
    });

    describe('Boolean property type', function() {
      it('is valid if true', function() {
        expect(tshirt.$valid).toBe(true);
      });

      it('is valid if false', function() {
        tshirt.available = 'false';
        expect(tshirt.$valid).toBe(true);
      });

      it('is invalid if the value is a string', function() {
        tshirt.available = 'NaN';
        expect(tshirt.$valid).toBe(false);
      });

      it('is invalid if the value is a number', function() {
        tshirt.available = 1;
        expect(tshirt.$valid).toBe(false);
      });

      it('is invalid if the value is an object', function() {
        tshirt.available = Tshirt.new();
        expect(tshirt.$valid).toBe(false);
      });
    });

    describe('String property type', function() {
      it('is valid if parseable to string', function() {
        expect(tshirt.$valid).toBe(true);
      });

      it('is valid if parseable to string', function() {
        tshirt.name = 5;
        expect(tshirt.$valid).toBe(true);
      });

      it('is invalid if array', function() {
        tshirt.name = [1, 2, 3]
        expect(tshirt.$valid).toBe(false);
      });

      it('is invalid if object', function() {
        tshirt.name = {};
        expect(tshirt.$valid).toBe(false);
      });
    });

    describe('Computed Properties', function() {
      it('computes properties based on other properties', function() {
        expect(tshirt.salePrice).toEqual(8.792);
      });

      it('computes the property during any change', function() {
        tshirt.price = '20.00';
        expect(tshirt.salePrice).toEqual(16);
      });

      it('creates complex chains of computed properties', function() {
        tshirt.price = '20.00';
        expect(tshirt.superSalePrice).toEqual(4);
      });

      it('creates complex chains of computed properties', function() {
        tshirt.price = '20.00';
        expect(tshirt.superDuperSalePrice).toEqual('-32 Wow! We owe YOU money!');
      });

      it('creates computed arrays', function() {
        tshirt.price = '20.00';
        expect(tshirt.allTheProperties).toEqual([ 'Ragin Shirt', true, '20.00', 1 ]);
      });

      it('creates computed objects', function() {
        tshirt.price = '20.00';
        expect(tshirt.prices).toEqual({ price : '20.00', salePrice : 16, superSalePrice : 4, superDuperSalePrice : '-32 Wow! We owe YOU money!' });
      });
    });
  });

  describe('Caching', function() {
    it('adds a cache to the model', function() {
      expect(System.cached).toBeDefined();
    });

    it('has #isEmpty method to tell you whether or not the cache is empty', function() {
      expect(System.cached.isEmpty()).toBe(false);
    });

    it('isEmpty if the cache is empty', function() {
      delete System.cached[1];
      expect(System.cached.isEmpty()).toBe(true);
    });

    it('length returns length of cache', function() {
      expect(System.cached.length()).toBe(1);
    });

    it('adds new instances to the cache', function() {
      expect(System.cached[1]).toBe(system);
    });

    it('cannot add new instances to the cache if they use the `new Constructor()` syntax', function() {
      var system2 = new System({id: 2});
      expect(System.cached[2]).toBe(undefined);
    });

    it('does not add instances to the cache if they do not have primary keys', function() {
      var system3   = System.new();
      var assertion = _.include(System.cached, system3); 
      expect(assertion).toBe(false);
    });

    it('expects the backend to add primary keys on $save, and then adds it to the cache', function() {
      var system1 = System.new();
      system1.$save().then(function(response) { system1 = response; });
      backend.flush();
      expect(System.cached[1]).toEqual(system1);
    });

    it('updates the cache for nested relationships on save', function() {
      var sensor = system.sensors.new();
      sensor.$save().then(function(response) { sensor = response; });
      backend.flush();
      expect(Sensor.cached[3]).toEqual(sensor);
    });
  });

  describe('Conversion to JSON', function() {

    var post;
    beforeEach(function() {
      post = Post.new();
    });

    it('converts to JSON', function() {
      expect(post.toJSON()).toEqual(
        '{"comments":[],"circularRef":{"ref":"1","post":{"comments":{"$ref":"#comments"},"circularRef":{"$ref":"#circularRef"}}}}');
    });

    it('is aliased as "serialize"', function() {
      expect(post.serialize()).toEqual(
        '{"comments":[],"circularRef":{"ref":"1","post":{"comments":{"$ref":"#comments"},"circularRef":{"$ref":"#circularRef"}}}}');
    });

    it('has includeEmptyKeys option', function() {
      post = post.serialize({includeEmptyKeys: true});
      expect(post.slice(1, 12)).toEqual('"title":" "');
    });

    it('has prettyPrint option', function() {
      post = post.serialize({prettyPrint: true});
      expect(post.slice(1, 2)).toEqual("\n");
    });

    it('has instance option', function() {
      var post = Post.new();
      var dummyData = {hi: "there"};
      post = post.serialize({instance: dummyData});
      expect(post).toEqual('{"hi":"there"}');
    });
  });

  describe('Primary Keys', function() {
    // Each model's primary key defaults to "id," but can be overridden in the model
    // definition using the `primaryKey` method:
    //
    //    function Post(data) {}
    //    Post.primaryKey = '_id';
    //
    // In the example above, the primary key for the model is assumed to be `_id`, as
    // in a MongoDB database. 
    //
    // The primary key is used primarily for mapping API requests properly.
    var post, comment;
    beforeEach(function() {
      Post.$create({title: "My Great Post"}).then(function(response) { post = response; });
      backend.expectPOST('http://api.faculty.com/posts')
        .respond({"_id": "52a8b80d251c5395b485cfe6", "title": "My Great Post"});
      backend.flush();
    });

    it('sets the defined primary key', function() {
      expect(post['_id']).toBe("52a8b80d251c5395b485cfe6");
    });

    it('does not set the default "id" field', function() {
      expect(post.id).not.toBeDefined();
    });

    it('saves using the primary key', function() {
      post.$save().then(function(response) { post = response; });
      backend.expectPUT('http://api.faculty.com/posts/52a8b80d251c5395b485cfe6', {"title":"My Great Post","comments":[],"circularRef":{"ref":"1","post":{"title":"My Great Post","comments":{"$ref":"#comments"},"circularRef":{"$ref":"#circularRef"},"_id":"52a8b80d251c5395b485cfe6"}},"_id":"52a8b80d251c5395b485cfe6"})
      .respond({"_id": "52a8b80d251c5395b485cfe6", "title": "My Great Post"});
      backend.flush(); 
      expect($http.post).toHaveBeenCalledWith('http://api.faculty.com/posts', '{"title":"My Great Post","comments":[],"circularRef":{"ref":"1","post":{"title":"My Great Post","comments":{"$ref":"#comments"},"circularRef":{"$ref":"#circularRef"}}}}');
    });

    it('deletes using the primary key', function() {
      post.$delete();
      backend.expectDELETE('http://api.faculty.com/posts/52a8b80d251c5395b485cfe6')
        .respond({data: 'Success'});
      backend.flush();
      expect($http.delete).toHaveBeenCalledWith('http://api.faculty.com/posts/52a8b80d251c5395b485cfe6', { method : 'delete', url : 'http://api.faculty.com/posts/52a8b80d251c5395b485cfe6' });
    });

    it('finds using the primary key if no object is passed to find', function() {
      Post.find('52a8b80d251c5395b485cfe7', {lazy: true}).then(function(response) { post = response; });
      backend.expectGET('http://api.faculty.com/posts/52a8b80d251c5395b485cfe7')
        .respond({"_id": "52a8b80d251c5395b485cfe7", "title": "An Incredible Post"});
      backend.flush();
      expect($http.get).toHaveBeenCalledWith('http://api.faculty.com/posts/52a8b80d251c5395b485cfe7', {method : 'get', url : 'http://api.faculty.com/posts/52a8b80d251c5395b485cfe7' });
    });
  });

  describe('Foreign Keys', function() {
    var post, comment, author;
    beforeEach(function() {
      Post.$create({title: 'Cool Post'}).then(function(response) { 
        post = response; 
        Author.$create({name: 'Bertrand Russel'}).then(function(response) { 
          author = response; 
          post.comments.$create({text: 'Excellente!', author: author})
           .then(function(response) { comment = response; });
        });
      });

      backend.expectPOST('http://api.faculty.com/posts')
        .respond({_id: 1, title: 'Cool Post'});

      backend.expectPOST('http://api.faculty.com/authors')
        .respond({_id: 1, name: 'Bertrand Russel'})

      backend.expectPOST('http://api.faculty.com/comments')
        .respond({id: 1, post_id: 1, author_id: 1});

      backend.flush();
    });

    it('parses associations to foreign keys when saving', function() {
      expect($http.post).toHaveBeenCalledWith('http://api.faculty.com/comments',
        '{"text":"Excellente!","post_id":1,"author_id":1}');
    });

    it('parses foreign key responses into model objects', function() {
      expect(comment.author).toBe(author);
    });
  });

  describe('POSTing JSON', function() {
    var post;

    beforeEach(function() {
      post = Post.new();
    });

    it('JSONifies circular references that are NOT foreign keys', function() {
      post.$save();
      backend.flush();
      expect($http.post).toHaveBeenCalledWith('http://api.faculty.com/posts', '{"comments":[],"circularRef":{"ref":"1","post":{"comments":{"$ref":"#comments"},"circularRef":{"$ref":"#circularRef"}}}}');
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

    describe('base#hasOne', function() {
      it('instantiates with new data', function() {
        var system2 = System.new({gridController: {id: 1}});
        expect(system2.gridController.id).toEqual(1);
      });

      it('sets the inverse association', function() {
        var system2 = System.new({gridController: {id: 1}});
        expect(system2.gridController.system).toBe(system2);
      });

      it('instantiates with an existing instance', function() {
        var gc = GridController.new({id: 1});
        var system2 = System.new({gridController: gc});
        expect(system2.gridController).toBe(gc);
        expect(system2.gridController.system).toBe(system2);
      });

      it('instantiates with an existing instance in the other direction', function() {
        var gc = GridController.new({id: 1, system: system});
        expect(gc.system).toBe(system);
      });

      it('does not add the foreign association unless the instance has a foreign key',
        function() {
          var gc = GridController.new({system: system});
          expect(system.gridController).not.toBe(gc);
      });

      it('adds the foreign association if the instance has a foreign key', function() {
        var gc = GridController.new({id: 1, system: system});
        expect(system.gridController.system.gridController).toBe(gc);
      });

      it('sets up the inverse association', function() {
        expect(system.gridController.system).toEqual(system);
      });

      it('does not require new to be called', function() {
        expect(function() { system.gridController.new() }).toThrow();
      });

      it('instantiates hasOnes on their associated models', function() {
        system.gridController.id = 1;
        expect(system.gridController.id).toBe(1);
      });

      it('grabs the association on find', function() {
        System.find(100).then(function(response) {
          system = response;
        });

        backend.expectGET('http://api.faculty.com/systems/100')
          .respond({id: 100});

        backend.expectGET('http://api.faculty.com/sensors?system_id=100')
          .respond([{id: 25, system_id: 100}]);

        backend.expectGET('http://api.faculty.com/grid-controllers?system_id=100')
          .respond({id: 25, system_id: 100});

        backend.flush();

        expect($http.get).toHaveBeenCalledWith('http://api.faculty.com/grid-controllers', { params : { system_id : 100 }, method : 'get', url : 'http://api.faculty.com/grid-controllers' });
      });

      it('grabs the association when the dependent calls find', function() {
        var gc;
        GridController.find(100).then(function(response) {
          gc = response;
        });

        backend.expectGET('http://api.faculty.com/grid-controllers?id=100')
          .respond({id: 100, system_id: 100});

        backend.expectGET('http://api.faculty.com/systems/100')
          .respond({id: 100});

        backend.flush();
        expect(gc.system.id).toEqual(100);
      });

      it('does not grab the association when the dependent does not return a foreign key', function() {
        var gc;
        GridController.find(100).then(function(response) {
          gc = response;
        });

        backend.expectGET('http://api.faculty.com/grid-controllers?id=100')
          .respond({id: 100});

        backend.flush();
        expect($http.get).not.toHaveBeenCalledWith('http://api.faculty.com/systems?id=100');
      });

      it('sets associations for all hasOnes found through #where', function() {
        var gcList;
        GridController.where({status: 'ready'}).then(function(response) {
          gcList = response;
        });

        backend.expectGET('http://api.faculty.com/grid-controllers?status=ready')
          .respond([
            {id: 100, status: 'ready', system_id: 100},
            {id: 25,  status: 'ready', system_id: 25}]);
        backend.expectGET('http://api.faculty.com/systems/100')
          .respond({id: 100});

        backend.expectGET('http://api.faculty.com/systems/25')
          .respond({id: 25});

        backend.flush();

        expect(gcList[0].id).toEqual(100);
        expect(gcList[1].id).toEqual(25);
      });

      it('updates the hasOne if data is passed to its owner during update', function() {
            system.update({gridController: {id: 1}});
            expect(system.gridController.id).toBe(1);
            expect(system.gridController.system).toEqual(system);
      });

      it('updates itself', function() {
        var gc = GridController.new();
        gc.update({system: system});
        expect(gc.system).toEqual(system);
      });

      it('updates itself using JSON strings', function() {
        var gc = GridController.new();
        gc.update({status: 'cool', system_id: 1}).then(function(response) {
          gc = response;
        });
        $timeout.flush();
        expect(gc.system).toEqual(system);
      });

      it('does not contain $create on the association', function() {
        expect(function() { system.gridController.$create() }).toThrow();
      });

      it('$creates without the nested association', function() {
        var gc;
        GridController.$create().then(function(response) {
          gc = response;
        });

        backend.expectPOST('http://api.faculty.com/grid-controllers', {})
          .respond({id: 2});

        backend.flush();
        expect(gc.id).toBe(2);
      });

      it('$saves', function() {
        var gc = GridController.new();
        gc.$save().then(function(response) {
          gc = response;
        });

        backend.expectPOST('http://api.faculty.com/grid-controllers', {})
          .respond({id: 3});

        backend.flush();
        expect(gc.id).toBe(3);
      });

      it('updates associated instances if found at a later time', function() {
        var system, gridController;
        System.find(50, {lazy: true}).then(function(response) { system = response; });
        backend.expectGET('http://api.faculty.com/systems/50').respond({
          id: 50
        });
        backend.flush();
        system.gridController.find({lazy: true}).then(function(response) { gridController = response; });
        backend.expectGET('http://api.faculty.com/grid-controllers?system_id=50').respond({
          id: 2
        });
        backend.flush();
        expect(system.gridController).toBe(gridController);
      });
    });

    describe('base#belongsTo', function() {
      it('establishes the belongsTo relationship', function() {
        var sensor;
        system.sensors.$create().then(function(response) {
          sensor = response;
        });
        backend.expectPOST('http://api.faculty.com/sensors', {"system_id": 1}).respond({id: 3, system_id: 1});
        backend.flush();
        expect(sensor.system).toEqual(system);
      });

      describe('Belongs To Multiple Models', function() {
        var post, author, commentAuthor, comment, comment2;
        beforeEach(function() {

          Author.$create({name: 'Master Yoda'})
            .then(function(response) {
              author = response; 
            });

          Author.$create({name: 'Luke Skywalker'})
            .then(function(response) {
              commentAuthor = response;
            });

          backend.expectPOST('http://api.faculty.com/authors',
            {name: 'Master Yoda', comments: [], posts: []})
            .respond({'_id': 1, name: 'Master Yoda'});

          backend.expectPOST('http://api.faculty.com/authors',
            {name: 'Luke Skywalker', comments: [], posts: []})
            .respond({'_id': 2, name: 'Luke Skywalker'});

          backend.flush();

          author.posts.$create({title: 'Do Or Do Not, There Is No Try'})
            .then(function(response) { 
              post = response; 
            });

          backend.expectPOST('http://api.faculty.com/posts',
            {"title":"Do Or Do Not, There Is No Try","author_id": 1,"comments":[], 
             "circularRef":{"ref":"1","post":{"title":"Do Or Do Not, There Is No Try",
             "author":{"name":"Master Yoda","comments":[],"posts":[
             {"$ref":"#circularRef.post"}],"_id":1},"comments":{"$ref":"#comments"},
             "circularRef":{"$ref":"#circularRef"}}}})
            .respond({'_id': 1, title: 'Do Or Do Not, There Is No Try', 
              author_id: 1});

          backend.flush();

          post.comments.$create({text: 'Great post, Yoda!', 
            author: commentAuthor})
            .then(function(response) {
              comment = response;
            });

          Comment.$create({text: 'Thanks, bro', author: author._id,
            post: post._id})
            .then(function(response) {
              comment2 = response;
            });

          backend.expectPOST('http://api.faculty.com/comments',
              {"text":"Great post, Yoda!","post_id":1,"author_id":2})
              .respond({'id': 1, 'text': 'Great post, Yoda!',
                author_id: 2, post_id: 1});

          backend.expectPOST('http://api.faculty.com/comments')
            .respond({id: 2, text: 'Thanks, bro', author_id: 1, post_id: 1});

          backend.flush();
        });

        it('establishes the first belongs to relationship', function() {
          expect(comment.post.title).toBe('Do Or Do Not, There Is No Try');
        });

        it('establishes the second belongs to relationship', function() {
          expect(comment.author.name).toBe('Luke Skywalker');
        });

        it('establishes the complete relationship chain', function() {
          expect(post.comments.first.post.author
            .posts.first.comments.last.text).toBe('Thanks, bro');
        });

        it('establishes the relationships when not set via model chaining', function() {
          expect(comment2.author.name).toBe('Master Yoda');
          expect(comment2.post.title).toBe('Do Or Do Not, There Is No Try');
        });
      });
    });
  });

  describe('Eager Loading', function() {
    var post, comment, author;
    beforeEach(function() {
      Post.find(1).then(function(response) {
        post = response;
      });
      backend.expectGET('http://api.faculty.com/posts/1')
        .respond({_id: 1, title: "Great Post"});

      backend.expectGET('http://api.faculty.com/comments?post_id=1')
        .respond([{id: 1, text: "Great one!", post_id: 1}]);

      backend.flush();
    });

    it('Eagerly Loads Associations By Default', function() {
      expect(post.comments.first.id).toBe(1);
    });

    it('Uses foreign keys set to query for associations', function() {
      expect($http.get).toHaveBeenCalledWith('http://api.faculty.com/comments', { params : { post_id : 1 }, method : 'get', url : 'http://api.faculty.com/comments' });
    });
  });

  describe('Syntax Options', function() {
    describe('Associations', function() {
      describe('Name-Module-Provider Syntax', function() {
        // When writing your models, this looks like:
        //
        //    function System(data) {
        //        this.hasMany('sensors',
        //          ['ActiveResource.Mocks', 'ARMockSensor']);
        //
        it('allows you to name an attribute, and to specify a module and class to find the constructor for it',
          function() {
            expect(system.sensors.new().constructor.name).toBe('Sensor');
        });
      });

      describe('Name Lookup Syntax', function() {
        // When writing your models, this looks like:
        //
        //    function Post(data) {
        //      this.hasMany('comments');
        //      this.belongsTo('author');
        //
        it('will find the right provider if it has the same name as the expected attribute', function() {
          var post = Post.new();
          expect(post.comments.new().constructor.name).toBe('Comment');
        });
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

      it('establishes the has-many relationship when passed in as data', function() {
        var system2Data = {sensors: [{id: 1}]};
        var system2     = System.new(system2Data);
        expect(system2.sensors.first.id).toBe(1);
      });

      it('establishes the has-many relationship when the data is passed as an object', function() {
        var system2Data = {sensors: {1: {id: 1}}};
        var system2     = System.new(system2Data);
        expect(system2.sensors.first.id).toBe(1);
      });

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
        backend.expectPOST('http://api.faculty.com/sensors').respond({id: 1, system_id: 1});
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

      it('is added to the hasMany-belongsTo collection', function() {
        expect(system.sensors).toContain(sensor);
      });
    });

    describe('collection#delete', function() {

      describe('Destruction of dependents', function() {
        var sensor1, sensor2;
        beforeEach(function() {
          system.sensors.$create().then(function(response) {
            sensor1 = response;
          });
          system.sensors.$create().then(function(response) {
            sensor2 = response;
          });
          backend.expectPOST('http://api.faculty.com/sensors').respond({id: 1, system_id: 1});
          backend.expectPOST('http://api.faculty.com/sensors').respond({id: 2, system_id: 1});
          backend.flush();
          sensor1.$delete();
          backend.expectDELETE('http://api.faculty.com/sensors/1').respond({data: 'success'});
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

        describe('using parameterized deleteURL', function() {
          var tshirt;
          beforeEach(function() {
            tshirt = Tshirt.new({_id: 1});
            tshirt.$delete().then(function(response) { tshirt = response });
            backend.expectDELETE('http://api.faculty.com:3000/tshirt/1')
              .respond({});

            backend.flush();
          });

          it('uses the parameters provided instead of a querystring', function(){ 
            expect(tshirt).toBe(undefined);
          }); 
        });
      });

      describe('Destruction of parent', function() {
        describe('Dependent => destroy == false', function() {
          var sensor1;
          beforeEach(function() {
            system.sensors.$create().then(function(response) {
              sensor1 = response;
            });
            backend.expectPOST('http://api.faculty.com/sensors').respond({id: 1, system_id: 1});
            backend.flush();
            system.$delete();
            backend.expectDELETE('http://api.faculty.com/systems/1').respond({data: 'success'});
            backend.flush();
          });

          it('sets the belongs to relationship to undefined', function() {
            expect(sensor1.system).toEqual(undefined);
          });
        });

        describe('Dependent => destroy', function() {
          var post, comment;
          beforeEach(function() {
            Post.$create({title: 'My Great Post'}).then(function(response) { post = response; });
            backend.expectPOST('http://api.faculty.com/posts')
              .respond({"_id": 1, "title": 'My Great Post'});
            backend.flush();
            post.comments.$create().then(function(response) { comment = response; });
            backend.expectPOST('http://api.faculty.com/comments')
              .respond({id: 1, post_id: 1});
            backend.flush();
            post.$delete().then(function(response) { post = comment = response; });
            backend.expectDELETE('http://api.faculty.com/posts/1').respond({data: 'success'});
            backend.expectDELETE('http://api.faculty.com/comments/1').respond({data: 'success'});
            backend.flush();
            $timeout.flush();
          });

          it('deletes the primary resource', function() {
            expect(post).not.toBeDefined();
          });

          it('deletes the primary resource from collections containing that resource', function() {
            var posts;
            Post.all({lazy: true}).then(function(results) { posts = results; });
            backend.expectGET('http://api.faculty.com/posts').respond([
              {
                _id: 1,
                title: 'Cool post!'
              },
              {
                _id: 2,
                title: 'Cooler post!'
              }
            ])
            backend.flush();
            var post = posts[0];
            posts[0].$delete();
            backend.expectDELETE('http://api.faculty.com/posts/1').respond({
              status: 200
            });
            backend.flush();
            expect(posts.length).toBe(1);
          });

          it('deletes dependents when the primary resource is destroyed', function() {
            expect(comment).not.toBeDefined();
          });

          it('calls the backend to delete the dependents', function() {
            expect($http.delete).toHaveBeenCalledWith('http://api.faculty.com/comments/1', { method : 'delete', url : 'http://api.faculty.com/comments/1' });

          });
        });
      });
    });

    describe('association#where', function() {
      var post, comments, system, gridController;
      beforeEach(function() {
        Post.$create().then(function(response) {
          post = response;
        });

        System.$create().then(function(response) {
          system = response;
        });

        backend.expectPOST('http://api.faculty.com/posts')
          .respond({_id: 1});

        backend.expectPOST('http://api.faculty.com/systems')
          .respond({id: 1});

        backend.flush();
      });

      describe('where', function() {
        beforeEach(function() {
          post.comments.all().then(function(response) {
            comments = response;
          });

          system.gridController.find().then(function(response) {
            gridController = response;
          });

          backend.expectGET('http://api.faculty.com/comments?post_id=1')
            .respond([{id: 1}, {id: 2}]);

          backend.expectGET('http://api.faculty.com/grid-controllers?system_id=1')
            .respond({id: 1});

          backend.flush();
        });

        it('associates itself with the parent relationship', function() {
          expect(post.comments.first.post).toBe(post);
        });

        it('adds each association to the child relationship', function() {
          expect(post.comments.length).toBe(2);
        });

        it('works via hasOne association', function() {
          expect(gridController.system).toBe(system);
        });

        it('adds the inverse association to the child relationship', function() {
          expect(system.gridController).toBe(gridController);
        });
      });

      describe('all', function() {

        beforeEach(function() {
          post.comments.all().then(function(response) {
            comments = response;
          });

          backend.expectGET('http://api.faculty.com/comments?post_id=1')
            .respond([{id: 1}, {id: 2}]);

          backend.flush();
        });

        it('adds #all method', function() {
          expect(post.comments.length).toBe(2);
        });
      });
    });

    describe('association#find', function() {
      var post, comment;
      beforeEach(function() {
        Post.$create().then(function(response) {
          post = response;
        });

        backend.expectPOST('http://api.faculty.com/posts')
          .respond({_id: 1});

        backend.flush();

        post.comments.find().then(function(response) {
          comment = response;
        });

        backend.expectGET('http://api.faculty.com/comments?post_id=1')
          .respond([{id: 1}]);

        backend.flush();
      });

      it('associates itself with the parent relationship', function() {
        expect(post.comments.first.post).toBe(post);
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

      describe('Intelligently creating versus saving', function() {

        var sensor;
        beforeEach(function() {
          sensor = system.sensors.new();
        });

        it('calls updateURL if there is a primary key on the object', function() {
          sensor.id = 1;
          sensor.$save().then(function(response) { sensor = response; });
          backend.whenPUT('http://api.faculty.com/sensors/1')
            .respond({id: 1});
          backend.flush();
          expect($http.put).toHaveBeenCalledWith('http://api.faculty.com/sensors/1', '{"id":1,"system_id":1}');
        });

        it('calls createURL if there is no primary key', function() {
          sensor.$save().then(function(response) { sensor = response; });
          backend.whenPOST('http://api.faculty.com/sensors')
            .respond({id: 1});
          backend.flush();
          expect($http.post).toHaveBeenCalledWith('http://api.faculty.com/sensors', '{"system_id":1}');
        });
      });

      describe('Saving', function() {
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
          expect(Sensor.cached[3]).toEqual(sensor);
        });

        it('adds the id that it received from the backend', function() {
          expect(system.sensors[0].id).toEqual(3);
        });
      });

    });

    describe('base#$create', function() {
      it('adds to the cache', function() {
        System.$create().then(function(response) { system = response; });
        backend.flush();
        expect(System.cached[1]).toEqual(system);
      });
    });

    describe('base#update', function() {

      var post;
      beforeEach(function() {
        System.$create().then(function(response) { system = response; });
        Post.$create().then(function(response) { post = response; });
        backend.flush();
      });

      it('updates the instance', function() {
        system.update({placement: 'window'});
        System.find(1).then(function(results) { system = results; });
        expect(system.placement).toEqual('window');
      });

      it('updates when the primary key is 0', function() {
        var post;
        Post.find(0, {lazy: true}).then(function(results) { post = results; });
        backend.expectGET('http://api.faculty.com/posts/0').respond({_id: 0});
        backend.flush();
        var comments = {comments: [{id: 0}, {id: 1}]};
        post.update(comments);
        expect(post.comments.length).toBe(2);
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
        system.update({sensors: [{id: 1}]});
        system.update({sensors: [{id: 1}, {id: 2}]});
        expect(system.sensors.length).toBe(2);
      });

      it('deals with a bunch of duplicate primary keys', function() {
        post.update({comments: [{id: 1, text: 'My old comment'}]});
        post.update({comments: [{id: 1, text: 'My Comment'}, {id: 1, text: 'My Comment 2'}, {id: 1, text: 'My Comment 3'}, {id: 2, text: 'My Comment 4'}]});
        expect(Object.keys(Comment.cached).length).toBe(2);
        expect(post.comments.first.text).toEqual('My Comment 3');
      });

      it('will not set "unsettable" properties', function() {
        post.update({tags: "awesome!"});
        expect(post.tags).not.toBeDefined();
      });

      it('considers "id" unsettable if overridden by primaryKey method', function() {
        post.update({id: 25});
        expect(post.id).not.toBeDefined();
        expect(post._id).toBe(1);
      });

      it('considers properties defined in the body of the constructor to be "settable"', function() {
        post.update({title: "Very Great Post!"});
        expect(post.title).toBe("Very Great Post!");
      });

      it('considers properties defined via Object.defineProperty to be "settable"', function() {
        post.update({content: "Here's the post!"});
        expect(post.content).toBe("Here's the post!");
      });

      it('considers non-enumerable properties to be "settable"', function() {
        post.update({content: "Here's the post!"});
        expect(post.content).toBe("Here's the post!");
      });
      
      it('considers properties defined in the prototype chain to be "settable"', function () {
        post.update({date: 'February 24, 2013'});
        expect(post.date).toBe('February 24, 2013');
      });

      it('maintains associations on update', function() {
        post.update({comments: [{id: 1}]});
        expect(post.comments.new).toBeDefined();
      });

      it('maintains inverse associations on update', function() {
        post.update({comments: [{id: 1}]});
        expect(post.comments.first.post).toBe(post);
      });
    });
  });

  describe('Querying', function() {
    describe('base#where', function() {

      describe('utilizes findURL by default', function() {
        var system8, system9, system10;

        beforeEach(function() {
          // Backend will respond with {id: 1}
          system.id = undefined;
          system.$save().then(function(response) { system = response; });

          // Backend will respond with {id: 8, placement: 'window'}
          System.$create({placement: 'window', name: 'Bretts System'}).then(function(response) { system8 = response; });
          // Backend will respond with {id: 9, placement: 'door'}
          System.$create({placement: 'window', name: 'Matts System'}).then(function(response)  { system9 = response; });

          backend.flush();
        });

        it('finds by id', function() {
          var foundSystems;
          System.where({id: 1}, {lazy: true}).then(function(response) { foundSystems = response; });
          backend.expectGET('http://api.faculty.com/systems?id=1').respond([{id: 1}]);
          backend.flush();
          expect(foundSystems).toEqual([system]);
        });

        it('finds by any attr', function() {
          var foundSystems;
          System.where({placement: 'window'}, {lazy: true})
            .then(function(response) { foundSystems = response; });
          backend.expectGET('http://api.faculty.com/systems?placement=window')
            .respond([{id: 8, placement: 'window', name: 'Bretts System'},
                      {id: 9, placement: 'window', name: 'Matts System'},
                      {id: 10, placement: 'window', name: 'Pickles System'}]);
          backend.flush();
          System.find(10).then(function(response) { system10 = response; });
          $timeout.flush();
          expect(foundSystems).toEqual([system8, system9, system10]);
        });

        it('always queries the backend to get all instances, even if some are found in the cache', function() {
          var foundSystems; 
          System.where({placement: 'window'}, {lazy: true}).then(function(response) { foundSystems = response; });
          backend.expectGET('http://api.faculty.com/systems?placement=window')
            .respond([{id: 8, placement: 'window', name: 'Bretts System'},
                      {id: 9, placement: 'window', name: 'Matts System'},
                      {id: 10, placement: 'window', name: 'Pickles System'}]);
          backend.flush();
          expect($http.get).toHaveBeenCalledWith('http://api.faculty.com/systems', { params : { placement : 'window' }, method : 'get', url : 'http://api.faculty.com/systems' });
        });

        it('adds the instance to the cache', function() {
          var foundSystems;
          System.where({id: 4}, {lazy: true}).then(function(response) { foundSystems = response; });
          backend.expectGET('http://api.faculty.com/systems?id=4').respond({});
          backend.flush();
          expect(System.cached[4]).toBe(foundSystems[0]);
        });

        it('has associated method #all that returns all instances', function() {
          var foundSystems;
          System.all().then(function(response) { foundSystems = response; });
          backend.expectGET('http://api.faculty.com/systems')
            .respond([{id: 8, placement: 'window', name: 'Bretts System'},
                      {id: 9, placement: 'window', name: 'Matts System'},
                      {id: 10, placement: 'window', name: 'Pickles System'}]);

          backend.expectGET('http://api.faculty.com/sensors?system_id=8')
            .respond([]);

          backend.expectGET('http://api.faculty.com/sensors?system_id=9')
            .respond([]);

          backend.expectGET('http://api.faculty.com/sensors?system_id=10')
            .respond([]);

          backend.flush();
          expect(System.cached[8]).toBe(system8);
        });

        it('all accepts option `api : false` which prevents api calls', function() {
          Tshirt.all({api: false}).then(function(response) {});
          expect(function() {
            backend.flush(); // will throw because no backend calls are expected
          }).toThrow();
          expect(Tshirt.cached.length()).toBe(0);
        });
      });

      describe('using indexURL to GET multiple instances', function() {
        var tshirts;
        beforeEach(function() {
          Tshirt.where({size: 'M'}).then(function(response) {
            tshirts = response;
          });

          backend.expectGET('http://api.faculty.com/tshirts?size=M')
            .respond([{id: 1, size: 'M'}, {id: 2, size: 'M'}]);

          backend.flush();
        });

        it('uses the indexURL instead of the showURL if the whereURL is specified', function() {
          expect(tshirts.length).toBe(2);
        });
      });

      describe('using parameterized showURL', function() {
        var tshirt;
        beforeEach(function() {
          Tshirt.find(1).then(function(response) {
            tshirt = response;
          });

          backend.expectGET('http://api.faculty.com:3000/tshirt/1')
            .respond({_id: 1, size: 'M'});

          backend.flush();
        });

        it('uses the parameters provided instead of a querystring', function(){ 
          expect(tshirt._id).toBe(1);
        }); 
      });

    });

    describe('base#find', function() {

      var system2, system3, sensor2;

      beforeEach(function() {
        system.$save().then(function(response) { system = response });
        backend.expectPUT('http://api.faculty.com/systems/1', 
          {id: 1, sensors: []})
           .respond({id: 1});
        backend.expectPOST('http://api.faculty.com/systems', 
          {placement: 'door', sensors: []})
            .respond({id: 2, placement: 'door'});
        backend.expectPOST('http://api.faculty.com/systems', 
          {placement: 'door', sensors: []})
           .respond({id: 3, placement: 'door'});
        System.$create({placement: 'door'}).then(function(response) { system2 = response; });
        System.$create({placement: 'door'}).then(function(response) { system3 = response; });
        backend.flush();
      });

      it('prevents api calls if option {api : false} is set', function() {
        var foundSystem;
        expect(System.cached.length()).toBe(3);
        System.find({id: 100}, {api: false, lazy: true}).then(function(response) { foundSystem = response; });
        expect(function() {
          backend.flush();
        }).toThrow();
        expect(System.cached.length()).toBe(3);
      });

      it('returns the first instance found', function() {
        var foundSystem;
        System.find({id: 1}, {lazy: true}).then(function(response) { foundSystem = response; });
        $timeout.flush();
        expect(foundSystem).toEqual(system);
      });

      it('queries the backend if forceGET is present in options', function() {
        var foundSystem;
        System.find({id: 1}, {lazy: true, forceGET: true, noInstanceEndpoint: true})
          .then(function(response) { foundSystem = response; });

        backend.expectGET('http://api.faculty.com/systems/1')
          .respond([{id: 2, name: 'Wrong System'}, {id: 1, name: 'Right System'}]);

        backend.flush();
        expect(foundSystem.id).toEqual(1);
      });

      it('updates the cached instance if forceGET is present in options', function() {
        var foundSystem;
        System.find({id: 1}, {lazy: true, forceGET: true, noInstanceEndpoint: true})
          .then(function(response) { foundSystem = response; });

        backend.expectGET('http://api.faculty.com/systems/1')
          .respond([{id: 2, name: 'Wrong System'}, {id: 1, name: 'Right System'}]);

        backend.flush();
        expect(System.cached[1].name).toEqual('Right System');
      });

      it('finds the correct data instead of first data if noInstanceEndpoint option is passed', function() {
        // This is expected to be backend functionality, so it is not included by default. 
        // If absolutely necessary, the frontend can loop through the data to ensure it
        // returns an instance that matches the given parameters.
        var foundSystem;
        System.find({id: 6, name: 'Right System'}, {lazy: true, noInstanceEndpoint: true})
          .then(function(response) { foundSystem = response; });

        backend.expectGET('http://api.faculty.com/systems?id=6&name=Right+System')
          .respond([{id: 2, name: 'Wrong System'}, {id: 6, name: 'Right System'}]);

        backend.flush();
        expect(foundSystem.id).toEqual(6);
      });

      it('accepts any attributes', function() {
        var foundSystem;
        System.find({placement: 'door'}).then(function(response) { foundSystem = response; });
        $timeout.flush();
        expect(foundSystem).toEqual(system2);
      });

      it('queries the backend if the instance is not found in the cache', function() {
        var foundSystem;
        System.find({id: 4}, {lazy: true}).then(function(response) { foundSystem = response; });
        backend.flush();
        expect(foundSystem.id).toEqual(4);
      });

      it('queries the backend using multiple parameters', function() {
        var foundSystem;
        System.find({placement: 'window'}, {lazy: true}).then(function(response) { foundSystem = response; });
        backend.flush();
        expect(foundSystem.id).toEqual(6);
      });

      it('returns the instantiated model instead of the plain data', function() {
        var foundSystem;
        System.find({placement: 'window'}, {lazy: true}).then(function(response) { foundSystem = response; });
        backend.flush();
        expect(foundSystem.constructor.name).toBe('System');
      });

      it('returns the first object only', function() {
        // No cached system will be found, triggering a $http.get('http://api.faculty.com/systems?placement=window');
        //
        // The mock API is setup to respond with sensors 6 & 7. Find will only respond with the first instance (6).
        var foundSystem;
        System.find({placement: 'window'}, {lazy: true}).then(function(response) { foundSystem = response; });
        backend.flush();
        expect(foundSystem.id).toBe(6);
      });

      it('also queries for associated models that need to be filled', function() {
        var sensor2;
        Sensor.find({id: 2}).then(function(response) { sensor2 = response; });
        backend.flush();
        expect(sensor2.system.id).toEqual(2);
      });
    });
  });

  describe('Base#api', function() {
    describe('Base.api#set', function() {
      it('creates a show url', function() {
        expect(System.api.showURL).toEqual('http://api.faculty.com/systems/:id');
      });

      it('creates a create url', function() {
        expect(System.api.createURL).toEqual('http://api.faculty.com/systems');
      });

      it('creates a delete url', function() {
        expect(System.api.deleteURL).toEqual('http://api.faculty.com/systems/:id');
      });

      it('creates an index url', function() {
        expect(System.api.indexURL).toEqual('http://api.faculty.com/systems');
      });

      it('creates an update url', function() {
        expect(System.api.updateURL).toEqual('http://api.faculty.com/systems/:id');
      });
    });

    describe('Base.api Overriding Individual URLs', function() {
      beforeEach(function() {
        System.api.showURL   = 'http://api.faculty.com/find/systems';
        System.api.createURL = 'http://api.faculty.com/create/systems';
        System.api.deleteURL = 'http://api.faculty.com/delete/systems';
        System.api.indexURL  = 'http://api.faculty.com/index/systems';
        System.api.updateURL = 'http://api.faculty.com/update/systems';
      });

      it('sets show individually', function() {
        expect(System.api.showURL).toBe('http://api.faculty.com/find/systems');
      });
        
      it('sets create individually', function() {
        expect(System.api.createURL).toBe('http://api.faculty.com/create/systems');
      });

      it('sets delete individually', function() {
        expect(System.api.deleteURL).toBe('http://api.faculty.com/delete/systems');
      });
      
      it('sets index individually', function() {
        expect(System.api.indexURL).toBe('http://api.faculty.com/index/systems');
      });

      it('sets update individually', function() {
        expect(System.api.updateURL).toBe('http://api.faculty.com/update/systems');
      });
    });

    describe('API Format', function() {
      it('sets showURL with the format', function() {
        expect(Project.api.showURL).toBe('http://api.faculty.com/projects/:id.json');
      });

      it('sets createURL with the format', function() {
        expect(Project.api.createURL).toBe('http://api.faculty.com/projects.json');
      });

      it('sets indexURL with the format', function() {
        expect(Project.api.indexURL).toBe('http://api.faculty.com/projects.json');
      });

      it('sets deleteURL with the format', function() {
        expect(Project.api.deleteURL).toBe('http://api.faculty.com/projects/:id.json');
      });

      it('sets updateURL with the format', function() {
        expect(Project.api.updateURL).toBe('http://api.faculty.com/projects/:id.json');
      });

      it('formats properly when the extension is reset', function() {
        Project.api.format('xml');
        expect(Project.api.showURL).toBe('http://api.faculty.com/projects/:id.xml');
      });

      it('automatically adds custom Mimetypes when set', function() {
        Project.api.format('xml');
        expect(Mime.types).toContain('xml');
      });

      it('adds custom mimetypes', function() {
        Mime.types.register('proprietary');
        Project.api.format('proprietary');
        expect(Project.api.showURL).toBe('http://api.faculty.com/projects/:id.proprietary');
      });

      it('adds the mimetype after any params', function() {
        Project.find(1);
        backend.expectGET('http://api.faculty.com/projects/1.json').respond({});
        backend.flush();
        expect($http.get).toHaveBeenCalledWith('http://api.faculty.com/projects/1.json',
          { method : 'get', url : 'http://api.faculty.com/projects/1.json' });
      });

      it('falls back on a querystring if params other than those specified in the url are utilized', function() {
        Project.where({author_id: 1});
        backend.expectGET('http://api.faculty.com/projects.json?author_id=1').respond({});
        backend.flush();
        expect($http.get).toHaveBeenCalledWith('http://api.faculty.com/projects.json',
         { params : { author_id : 1 }, method : 'get', url : 'http://api.faculty.com/projects.json' });
      });

      it('does stuff', function() {
        Project.where({id: 1, embed: 'widgets,users'});
        backend.expectGET('http://api.faculty.com/projects.json?embed=widgets,users&id=1').respond({});
        backend.flush();
        expect($http.get).toHaveBeenCalledWith('http://api.faculty.com/projects.json',
         { params : { id : 1, embed: 'widgets,users' }, method : 'get', url : 'http://api.faculty.com/projects.json' });
      });
    });

    describe('API Methods', function() {
      describe('Model#find', function() {
        it('calls GET to the specified API, filling in the correct ID', function() {
          System.find(4);
          expect($http.get).toHaveBeenCalledWith('http://api.faculty.com/systems/4', { method : 'get', url : 'http://api.faculty.com/systems/4' });
        });

        it('calls GET passing the specified parameters', function() {
          System.find({placement: 'window'});
          expect($http.get).toHaveBeenCalledWith('http://api.faculty.com/systems', { params : { placement : 'window' }, method : 'get', url : 'http://api.faculty.com/systems' });
        });
      });
    });
  });

  describe('Over-Eager Loading', function() {
    var post, comment, author;
    beforeEach(function() {
      Post.find(1, {overEager: true}).then(function(response) { post = response; });

      backend.expectGET('http://api.faculty.com/posts/1')
        .respond({_id: 1, title: 'Great post!', author_id: 1});

      backend.expectGET('http://api.faculty.com/authors/1')
        .respond({_id: 1, name: 'Yorn Lomborg'});

      backend.expectGET('http://api.faculty.com/comments?author_id=1')
        .respond({_id: 1, text: 'Great!', author_id: 1, post_id: 1});

      backend.expectGET('http://api.faculty.com/comments?post_id=1')
        .respond({_id: 1, text: 'Great!', author_id: 1, post_id: 1});

      backend.expectGET('http://api.faculty.com/posts?author_id=1')
        .respond({_id: 1, title: 'Great post!', author_id: 1});

      backend.flush();
    });

    it('Loads associations, and then all associations of associations, etc., recursively', function() {
      expect($http.get).toHaveBeenCalledWith('http://api.faculty.com/posts/1', { method : 'get', url : 'http://api.faculty.com/posts/1' });
    });
  });

  describe('Evented Modeling', function() {
    var post, comment, author;
    beforeEach(function() {
      spyOn(window, 'alert');
      Post.find(1).then(function(response) { post = response; });
      backend.expectGET('http://api.faculty.com/posts/1')
        .respond({_id: 1, title: 'Great post!', author_id: 1});

      backend.expectGET('http://api.faculty.com/authors/1')
        .respond({_id: 1, name: 'Yorn Lomborg'});

      backend.expectGET('http://api.faculty.com/comments?post_id=1')
        .respond({});

      backend.whenPUT('http://api.faculty.com/posts/1')
        .respond({_id: 1});

      backend.flush();
    });

    describe('Before Save', function() {
      it('passes the instance to the before $save callback', function() {
        Post.before('$save', function(instance) { instance.title = 'Whoa!'; });
        post.$save().then(function(response) { post = response; });
        backend.flush();
        expect(post.title).toBe('Whoa!');
      });
    });

    describe('After Save', function() {
      it('passes the instance to the after save callback', function() {
        var data;
        Post.after('$save', changeData);
        function changeData(response) { data = response.instance; };
        post.$save();
        backend.flush();
        expect(data).toEqual(post);
      });

      it('passes the raw data to the after save callback', function() {
        var data;
        Post.after('$save', changeData);
        function changeData(response) { data = response.data.data; };
        post.$save();
        backend.flush();
        expect(data).toEqual({
          _id: 1
        });
      });
    });

    describe('Save Failure', function() {
      it('passes the instance to the fail $save callback', function() {
        var failedPost;
        Post.fail('$save', function(instance) { failedPost = instance; });

        post.validates({
          title: { presence: true }
        });

        post.title = undefined;
        post.$save();
        $timeout.flush();

        expect(failedPost).toBe(post);
      });
    });

    describe('Before $delete', function() {
      it('passes the instance to the before $delete callback', function() {
        Post.before('$delete', function(instance) {
          alert('Are you sure you want to delete ' + instance.title + '?')});
        post.$delete();
        expect(window.alert).toHaveBeenCalledWith('Are you sure you want to delete Great post!?');
      });
    });

    describe('After $delete', function() {
      it('passes the instance to the after $delete callback', function() {
        Post.after('$delete', function(response) { 
          window.alert(response.instance.title + ' deleted successfully!')});
        post.$delete();
        backend.expectDELETE('http://api.faculty.com/posts/1').respond({
          status: 200});
        backend.flush();
        expect(window.alert).toHaveBeenCalledWith('Great post! deleted successfully!');
      });

      it('passes the data to the after $delete callback', function() {
        Post.after('$delete', function(response) { 
          window.alert(response.data.data)});
        post.$delete();
        backend.expectDELETE('http://api.faculty.com/posts/1').respond({
          status: 200});
        backend.flush();
        expect(window.alert).toHaveBeenCalledWith({status: 200});
      });
    });

    describe('Before Find', function() {
      it('passes the search terms to the before find callback', function() {
        Post.before('find', function(terms) {
          alert('Finding instance ' + terms);
        });
        Post.find(1);
        $timeout.flush();
        expect(window.alert).toHaveBeenCalledWith('Finding instance 1');
      });
    });

    describe('After find', function() {
      it('passes the instance to the after find callback', function() {
        Post.after('find', function(response) {
          alert('Found ' + response.instance.title);
        });

        Post.find(1);
        $timeout.flush();
        expect(window.alert).toHaveBeenCalledWith('Found Great post!');
      });

      it('passes the raw data to the after find callback', function() {
        Post.after('find', function(response) {
          alert(response.data);
        });

        Post.find(1);
        $timeout.flush();
        expect(window.alert).toHaveBeenCalledWith(post);
      });

      it('passes the raw response data if the backend is queried', function() {
        Post.after('find', function(response) {
          alert('Found ' + response.data.title);
        });

        Post.find(789, {lazy: true});
        backend.expectGET('http://api.faculty.com/posts/789').respond({
          _id: 789,
          title: 'Great post!'
        });
        backend.flush();
        expect(window.alert).toHaveBeenCalledWith('Found Great post!');
      });
    });

    describe('Before where', function() {
      it('passes the terms to before where callback', function() {
        Post.before('where', function(terms) {
          alert('Finding instances that match ' + terms.title);
        });
        Post.where({title: 'Great post!'}, {lazy: true});
        backend.expectGET('http://api.faculty.com/posts?title=Great+post!')
          .respond({title: 'Great post!', _id: 1});
        backend.flush();
        expect(window.alert).toHaveBeenCalledWith('Finding instances that match Great post!');
      });
    });

    describe('After where', function() {
      it('passes the instance to after where callback', function() {
        Post.after('where', function(results) {
          alert(results.instance);
        });
        Post.where({title: 'Great post!'}, {lazy: true});
        backend.expectGET('http://api.faculty.com/posts?title=Great+post!')
          .respond([{title: 'Great post!', _id: 1}]);
        backend.flush();
        expect(window.alert).toHaveBeenCalledWith([post]);
      });

      it('passes the raw data to after where callback', function() {
        var results;
        Post.after('where', function(response) {
          results = response.data;
        });
        Post.where({title: 'Great post!'}, {lazy: true});
        backend.expectGET('http://api.faculty.com/posts?title=Great+post!')
          .respond([{title: 'Great post!', _id: 1}]);
        backend.flush();
        expect(results[0].title).toEqual('Great post!');
      });
    });

    it('passes the json results to the after where joinpoint', function() {
      var json;
      Post.after('where', function(response) {
        json = response.data;
      });
      Post.where({title: 'Great post!'}, {lazy: true});
      backend.expectGET('http://api.faculty.com/posts?title=Great+post!')
        .respond({title: 'Great post!', _id: 1});
      backend.flush();
      expect(json).toEqual({ title : 'Great post!', _id : 1 });
    });

    it('passes the instances to the after where joinpoint', function() {
      var instances;
      Post.after('where', function(response) {
        instances = response.instance;
      });
      Post.where({title: 'Great post!'}, {lazy: true});
      backend.expectGET('http://api.faculty.com/posts?title=Great+post!')
        .respond({title: 'Great post!', _id: 1});
      backend.flush();
      expect(instances[0].circularRef).toBeDefined();
    });

    describe('Before update', function() {
      it('passes the instance to before update callback', function() {
        Post.before('update', function(instance) {
          instance.instance.title = 'My new title';
        });
        post.update({_id: 2});
        expect(post.title).toBe('My new title');
      });
    });

    describe('After update', function() {
      it('passes the instance to after update callback', function() {
        Post.after('update', function(response) {
          alert(response.instance.title + ' updated!');
        });
        post.update({_id: 2});
        $timeout.flush();
        expect(window.alert).toHaveBeenCalledWith('Great post! updated!');
      });

      it('passes the raw data to after update callback', function() {
        Post.after('update', function(response) {
          alert(response.data._id + ' updated!');
        });
        post.update({_id: 2});
        $timeout.flush();
        expect(window.alert).toHaveBeenCalledWith('2 updated!');
      });
    });

    describe('Before $update', function() {
      it('passes the instance to before $update callback', function() {
        Post.before('$update', function(data) {
          data.instance.title = 'My new title';
        });
        post.$update({_id: 2});
        backend.flush();
        expect(post.title).toBe('My new title');
      });

      it('passes the data to before $update callback', function() {
        Post.before('$update', function(data) {
          data.data.title = 'My new title';
        });
        post.$update({_id: 2});
        backend.flush();
        expect(post.title).toBe('My new title');
      });
    });

    describe('Before new', function() {
      it('passes the raw data to before new', function() {
        Post.before('new', function(data) {
          data.title = 'This is what I always call my posts';
        });
        var post2 = Post.new();
        expect(post2.title).toBe('This is what I always call my posts');
      });
    });

    describe('After new', function() {
      it('passes the new instance to after new callback', function() {
        Post.after('new', function(instance) {
          alert(instance.title + ' created!');
        });

        var post2 = Post.new({title: 'My great post'});
        expect(window.alert).toHaveBeenCalledWith('My great post created!');
      });
    });

    describe('Before $create', function() {
      it('passes the raw data to before $create callback', function() {
        var post2;
        Post.before('$create', function(data) {
          data.title = 'This is what I always call my posts';
        });

        Post.$create().then(function(response) { post2 = response; });
        backend.flush();
        expect(post2.title).toEqual('This is what I always call my posts');
      });
    });
  });

  describe('Validations', function() {
    var user;
    beforeEach(function() {
      user = User.new({
        name: 'Brett',
        username: 'brettcassette',
        email: 'brett.shollenberger@gmail.com',
        zip: '19454',
        uniqueIdentifier: '02140',
        termsOfService: true,
        password: 'awesomesauce',
        passwordConfirmation: 'awesomesauce',
        size: 'small'
      });
    });

    describe('Model.instance#validate()', function() {
      describe('Validating Individual Fields', function() {
        it('validates an individual field', function() {
          var user = User.new();
          expect(user.validate('name')).toBe(false);
        });

        it('adds errors for just the validated field', function() {
          var user = User.new();
          user.validate('name');
          expect(user.$errors).toEqual({ name : [ 'Must provide name' ] });
        });
      });

      describe('Validating All Fields', function() {
        beforeEach(function() {
          user.name = undefined;
        });

        it('validates all fields', function() {
          expect(user.validate()).toBe(false);
        });

        it('uses `$valid` as a shorthand for running all validations', function() {
          expect(user.$valid).toBe(false);
        });

        it('also has an `$invalid` helper', function() {
          expect(user.$invalid).toBe(true);
        });

        it('sets errors on all invalid fields & required fields', function() {
          var user = User.new();
          user.validate();
          expect(numkeys(user.$errors)).toBe(3);
        });
      });

      describe('Validate If Errored', function() {
        it('does not validate if there are no errors', function() {
          expect(user.validateIfErrored('name')).toBe(undefined);
        });

        it('validates the field if there are errors on the field', function() {
          user.name = '';
          user.validate();
          user.name = 'Awesome';
          user.validateIfErrored('name');
          expect(user.$errors.name).toBe(undefined);
        });
      });
    });

    describe('Model.instance#clearErrors()', function() {
      it('clears all errors', function() {
        user.name = undefined;
        user.validate();
        user.clearErrors();
        expect(numkeys(user.$errors)).toBe(0);
      });

      it('clears all errors on a given field', function() {
        user.name  = undefined;
        user.email = 'awesome';
        user.validate();
        user.clearErrors('name');
        expect(numkeys(user.$errors)).toBe(1);
      });
    });

    describe('Edge Cases', function() {
      describe('Non-required fields', function() {
        it('is valid if blank and not required', function() {
          user.email = undefined;
          expect(user.$valid).toBe(true);
        });

        it('is valid if empty string and not required', function() {
          user.email = '';
          expect(user.$valid).toBe(true);
        });
      });
    });

    describe('Error messages', function() {
      it('does not set error messages until validated', function() {
        var user = User.new();
        expect(numkeys(user.$errors)).toBe(0);
      });

      it('sets errors per field on validation', function() {
        var user = User.new();
        user.$valid;
        expect(user.$errors.name).toContain("Must provide name");
      });

      it('allows custom error messages using the message key', function() {
        var user = User.new();
        user.email = 'invalid';
        user.validate();
        expect(user.$errors.email).toContain('Must provide email');
      });
    });

    describe('Presence validation', function() {
      it('is valid if all required fields have values', function() {
        expect(user.$valid).toBe(true);
      });

      it('is invalid if undefined', function() {
        var user = User.new();
        expect(user.$valid).toBe(false);
      });

      it('uses a unique error message if provided', function() {
        user.name = '';
        user.validate();
        expect(user.$errors.name).toContain('Must provide name');
      });

      it('runs all validations if presence is required', function() {
        user.email = 'bigbad@wolfnet';
        expect(user.$valid).toBe(false);
      });
    });

    describe('RequiredIf validation', function() {
      it('is a required field if certain criteria are met', function() {
        user.size = 'large';
        user.sometimesRequired = undefined;
        user.validate();
        expect(user.$errors.sometimesRequired).toContain('Field required if size is large');
      });
    });

    describe('Email validation', function() {
      it('is invalid if it does not contain a valid email address', function() {
        user.email = 'porky';
        expect(user.$valid).toBe(false);
      });

      it('sets the email error message', function() {
        user.email = 'pig@net';
        user.$valid;
        expect(user.$errors.email).toContain('Must provide email');
      });

      it('is valid if it contains a valid email address', function() {
        expect(user.$valid).toBe(true);
      });


      it('sets no errors if blank and not required', function() {
        user.email = undefined;
        user.validate();
        expect(numkeys(user.$errors)).toBe(0);
      });
    });

    describe('Zip validation', function() {
      it('is invalid if it does not contain a valid zip code', function() {
        user.zip = 111111;
        expect(user.$valid).toBe(false);
      });

      it('sets the zip error message', function() {
        user.zip = 111111;
        user.$valid;
        expect(user.$errors.zip).toContain('Is not a valid zip code');
      });

      it('is valid if the zip contains a hyphen', function() {
        user.zip = '11111-2222';
        expect(user.$valid).toBe(true);
      });

      it('is invalid if it contains a hyphen but not 9 numbers', function() {
        user.zip = '11111-';
        expect(user.$valid).toBe(false);
      });

      it('is valid if it contains 9 numbers but no hyphen', function() {
        user.zip = '111112222';
        expect(user.$valid).toBe(true);
      });

      it('isinvalid if it contains a hyphen in the wrong spot', function() {
        user.zip = '1111-22222';
        expect(user.$valid).toBe(false);
      });

      it('is valid if not present, and not required', function() {
        user.zip = undefined;
        expect(user.$valid).toBe(true);
      });
    });

    describe('Acceptance validation', function() {
      it('is valid if true', function() {
        expect(user.$valid).toBe(true);
      });

      it('is invalid if false', function() {
        user.termsOfService = false;
        expect(user.$valid).toBe(false);
      });

      it('is invalid if anything else', function() {
        user.termsOfService = 'pie';
        expect(user.$valid).toBe(false);
      });

      it('sets acceptance error', function() {
        user.termsOfService = false;
        user.$valid;
        expect(user.$errors.termsOfService).toContain('Must be accepted');
      });

      it('is valid if not present and not required', function() {
        user.termsOfService = undefined;
        expect(user.$valid).toBe(true);
      });
    });

    describe('Length validations', function() {
      describe('Min/Max validations', function() {
        it('is invalid if the length is less than required', function() {
          user.username = 'Andy'
          expect(user.$valid).toBe(false);
        });

        it('is invalid if the length is greater than allowed by max', function() {
          user.username = 'Maximum Danger the Maximal Ranger';
          expect(user.$valid).toBe(false);
        });

        it('sets a min error message', function() {
          user.username = 'Andy';
          user.$valid;
          expect(user.$errors.username).toContain('Must be at least 5 characters');
        });

        it('sets a max error message', function() {
          user.username = 'Maximum Danger the Maximal Ranger';
          user.$valid;
          expect(user.$errors.username).toContain('Must be no more than 20 characters');
        });

        it('is valid if the length is within the allowed range', function() {
          expect(user.$valid).toBe(true);
        });

        it('is valid if blank and not required', function() {
          user.username = '';
          expect(user.$valid).toBe(true);
        });
      });

      describe('Length is validations', function() {
        it('is invalid if the length is not exactly correct', function() {
          user.uniqueIdentifier = '02140-0006';
          expect(user.$valid).toBe(false);
        });

        it('sets the length is error message', function() {
          user.uniqueIdentifier = '02140-0006';
          user.$valid;
          expect(user.$errors.uniqueIdentifier).toContain('Must be exactly 5 characters');
        });

        it('is valid if it is exactly the correct number of characters', function() {
          expect(user.$valid).toBe(true);
        });

        it('is valid if blank and not required', function() {
          user.uniqueIdentifier = '';
          expect(user.$valid).toBe(true);
        });
      });
    });

    describe('Confirmation validation', function() {
      it('is invalid if it does not match the confirmation field', function() {
        user.passwordConfirmation = '';
        expect(user.$valid).toBe(false);
      });

      it('sets the appropriate error message', function() {
        user.passwordConfirmation = '';
        user.$valid;
        expect(user.$errors.password).toContain('Must match confirmation field');
      });

      it('is valid if it matches the confirmation field', function() {
        expect(user.$valid).toBe(true);
      });

      it('is valid if both fields are blank and neither is required', function() {
        user.social = '';
        user.socialConfirmation = '';
        expect(user.$valid).toBe(true);
      });

      it('is invalid if one of the fields is filled in, even if neither is required', function() {
        user.social = '';
        user.socialConfirmation = 'hi';
        expect(user.$valid).toBe(false);
      });
    });

    describe('Inclusion validation', function() {
      it('is valid if the value is included in the acceptable list', function() {
        expect(user.$valid).toBe(true);
      });

      it('is invalid if the value is not included in the acceptable list', function() {
        user.size = 'tall';
        expect(user.$valid).toBe(false);
      });

      it('sets the appropriate error message', function() {
        user.size = 'tall';
        user.$valid;
        expect(user.$errors.size).toContain('Must be included in small, medium, or large');
      });

      it('is valid if blank and not required', function() {
        user.size = '';
        expect(user.$valid).toBe(true);
      });
    });

    describe('Exclusion validation', function() {
      it('is valid if the value is not included in the unacceptable list', function() {
        expect(user.$valid).toBe(true);
      });

      it('is invalid if the value is included in the unacceptable list', function() {
        user.size = 'XL';
        expect(user.$valid).toBe(false);
      });

      it('sets the appropriate error message', function() {
        user.size = 'XL';
        user.$valid;
        expect(user.$errors.size).toContain('Must not be XL or XXL');
      });

      it('is valid if blank and not required', function() {
        user.size = '';
        expect(user.$valid).toBe(true);
      });
    });

    describe('Numericality validation', function() {
      it('is invalid if the value is not a number', function() {
        user.uniqueIdentifier = 'pi';
        expect(user.$valid).toBe(false);
      });

      it('is valid if the value is a number', function() {
        user.uniqueIdentifier = 12345;
        expect(user.$valid).toBe(true);
      });

      it('can be set to ignore non-number characters', function() {
        user.zip = '12345-6789';
        expect(user.$valid).toBe(true);
      });

      it('sets the appropriate error message', function() {
        user.zip = 'abcdefg';
        user.$valid;
        expect(user.$errors.zip).toContain('Must be a number');
      });

      it('is valid if blank and not required', function() {
        user.zip = '';
        expect(user.$valid).toBe(true);
      });
    });

    describe('Validates Association', function() {
      describe('Has Many/Belongs To', function() {
        var post, comment;
        beforeEach(function() {
          post = Post.new({title: 'Great post!'});
          comment = post.comments.new({id: 1, text: 'Great post!'});

          comment.validates({
            text: { presence: true }
          });

          post.validates({
            title: { presence: true }
          });
        });

        describe('Has Many Association', function() {

          beforeEach(function() {
            post.validates({
              comments: { association: 'comments' }
            });
          });

          it('is invalid if the association is invalid', function() {
            comment.text = undefined;
            post.validate();
            expect(post.$errors.comments).toContain('Comment invalid');
          });

          it('is valid if the association is valid', function() {
            expect(post.$valid).toBe(true);
          });
        });

        describe('Belongs To Association', function() {
          beforeEach(function() {
            comment.validates({
              post: { association: 'post' }
            });
          });

          it('is invalid if the association is invalid', function() {
            post.title = undefined;
            comment.validate();
            expect(comment.$errors.post).toContain('Post invalid');
          });

          it('is valid if the association is valid', function() {
            expect(comment.$valid).toBe(true);
          });
        });
      });

      describe('One-to-One Association', function() {

        var system, gc;
        beforeEach(function() {
          system = System.new({name: 'Great System'});
          gc     = system.gridController;

          gc.validates({
            status: { presence: true }
          });

          system.validates({
            name: { presence: true }
          });
        });

        describe('Has One Association', function() {
          beforeEach(function() {
            system.validates({
              gridController: { association: 'gridController' }
            });
          });

          it('is invalid if its association is invalid', function() {
            system.validate();
            expect(system.$errors.gridController).toContain('GridController invalid');
          });

          it('valid if the association is valid', function() {
            gc.status = 'Great!';
            expect(system.$valid).toBe(true);
          });
        });

        describe('Belongs To Association', function() {
          beforeEach(function() {
            gc.validates({
              system: { association: 'system' }
            });

            gc.status = 'Great!';
          });

          it('is invalid if its association is invalid', function() {
            system.name = undefined;
            gc.validate();
            expect(gc.$errors.system).toContain('System invalid');
          });

          it('is valid if its association is valid', function() {
            expect(gc.$valid).toBe(true);
          });
        });
      });

      describe('Validates If Option', function() {
        var post, comment;
        beforeEach(function() {
          post = Post.new({title: 'Great post!'});
          comment = post.comments.new({id: 1, text: 'Great post!'});

          comment.validates({
            text: { presence: true }
          });

          post.validates({
            title: { presence: true }
          });
        });
      });
    });

    describe('Custom Validations', function() {
      it('is valid if it passes the custom validation', function() {
        expect(user.$valid).toBe(true);
      });

      it('is invalid if it does not pass the custom validation', function() {
        user.uniqueIdentifier = 'asdfjkl';
        expect(user.$valid).toBe(false);
      });

      it('sets a custom error message if provided', function() {
        user.uniqueIdentifier = 'Invalid';
        user.$valid;
        expect(user.$errors.uniqueIdentifier).toContain('Invalid uuid');
      });

      it('is valid if blank, and not required', function() {
        user.uniqueIdentifier = '';
        expect(user.$valid).toBe(true);
      });

      it('is passed the value of the field to validate, the name of the field, and the instance to validate', 
          function() {
        var user = User.new();

        var validators = {};

        validators.uniqueValidator1 = function(value, field, instance) {
          return value;
        }

        spyOn(validators, 'uniqueValidator1').andCallThrough();

        user.validates({
          name: { uniqueValidator1: { validates: validators.uniqueValidator1, message: 'Smooth move, Ferguson' } }
        });

        user.name = 'cool value!';
        user.validate('name');
        expect(validators.uniqueValidator1).toHaveBeenCalledWith('cool value!', 'name', user);
      });

      it('validates the current instance', function() {
        var user = User.new();
        var validators = {};
        validators.uniqueValidator1 = function(value, field, instance) { return value; }
        spyOn(validators, 'uniqueValidator1').andCallThrough();
        user.validates({
          name: { uniqueValidator1: { validates: validators.uniqueValidator1, message: 'Smooth move, Ferguson' } }
        });
        user.name = 'cool value!';
        user.validate('name');
        var user2 = User.new();
        user.validates({
          name: { uniqueValidator1: { validates: validators.uniqueValidator1, message: 'Smooth move, Ferguson' } }
        });
        user2.name = 'whatever, man!';
        user2.validate('name');
        expect(validators.uniqueValidator1).toHaveBeenCalledWith('whatever, man!', 'name', user2);
      });
    });
    
    describe('Nested object validations', function(){
      it('validates properties of nested objects', function(){
        user.echeck = {};
        user.echeck.type = '12345678912345678922222';
        expect(user.$valid).toBe(false);   
      });
    });
    
    describe('Saving with Validations', function() {
      it('saves if the values are valid', function() {
        expect(user.$valid).toBe(true);
        user.$save();
        backend.expectPOST('http://api.faculty.com/users')
          .respond({
            id: 1,
            name: 'Brett',
            username: 'brettcassette',
            email: 'brett.shollenberger@gmail.com',
            zip: '19454',
            uniqueIdentifier: '02140',
            termsOfService: true,
            password: 'awesomesauce',
            passwordConfirmation: 'awesomesauce',
            size: 'small'
          });
        backend.flush();
        expect(user.$valid).toBe(true);
      });

      it('saves if no validations are provided', function() {
        var author;
        author = Author.new();
        author.$save().then(function() { });
        backend.expectPOST('http://api.faculty.com/authors').respond({_id: 1});
        backend.flush();
        expect(author._id).toBe(1);
      });

      it('sets the proper errors if the instance is invalid on save', function() {
        user.name = undefined;
        user.$save().then(function(instance) {}, function(error) {});
        $timeout.flush();
        expect(user.$errors.name).toContain('Must provide name');
      });

      it('allows aspect-oriented fail to be called on failure', function() {
        spyOn(window, 'alert');

        User.fail('$save', function(instance) {
          for (var error in instance.$errors) {
            window.alert(instance.$errors[error]);
          }
        });

        user.name = undefined;
        user.$save().then(function() {});
        $timeout.flush();
        expect(window.alert).toHaveBeenCalledWith(['Must provide name']);
      });

      it('uses validations with $create', function() {
        var user, error;
        User.$create().then(function(response) { user = response; },
          function(instance) { user = instance; });
        $timeout.flush();
        expect(user.$errors.name).toContain('Must provide name');
      });
    });
    describe('Updating with Validations', function() {

      var user;
      beforeEach(function() {
        User.find({id: 1}).then(function(response) { user = response; });
        backend.expectGET('http://api.faculty.com/users/1').respond({
          id: 1,
          name: 'Brett',
          username: 'brettcassette',
          email: 'brett.shollenberger@gmail.com',
          zip: '19454',
          uniqueIdentifier: '02140',
          termsOfService: true,
          password: 'awesomesauce',
          passwordConfirmation: 'awesomesauce',
          size: 'small'
        });
        backend.flush();
      });

      it('Does not update if the instance is invalid', function() {
        user.name = undefined;
        user.$update().then(function(instance) { user = instance; },
          function(instance) { user = instance; });

        $timeout.flush();
        expect($http.put).not.toHaveBeenCalled();
      });

      it('Updates if the instance is valid', function() {
        user.$update().then(function(instance) { user = instance; },
          function(instance) { user = instance; });

        backend.expectPUT('http://api.faculty.com/users/1')
          .respond({});
        backend.flush();
        expect($http.put).toHaveBeenCalledWith('http://api.faculty.com/users/1', '{"name":"Brett","username":"brettcassette","email":"brett.shollenberger@gmail.com","zip":"19454","uniqueIdentifier":"02140","termsOfService":true,"password":"awesomesauce","passwordConfirmation":"awesomesauce","size":"small","id":1}');
      });

      it('Sets errors if the instance is invalid', function() {
        user.name = undefined;
        user.$update().then(function(instance) { user = instance; },
          function(instance) { user = instance; });
        expect(user.$errors.name).toContain('Must provide name');
      });
    });
  });

  describe('MimeTypes', function() {
    it('Registers custom MimeTypes', function() {
      Mime.types.register('xml');
      expect(Mime.types).toContain('xml');
    });

    it('Does not duplicate registration of MimeTypes', function() {
      Mime.types.register('json');
      expect(Mime.types.length).toBe(1);
    });

    it('Removes any preceding dots', function() {
      Mime.types.register('.json');
      expect(Mime.types).not.toContain('.json');
    });
  });
});
