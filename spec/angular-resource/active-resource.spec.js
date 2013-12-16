'use strict';

describe('ActiveResource', function() {

  var ActiveResource, Mocks, Sensor, System, Post, Comment, Author, 
    system, backend, $timeout, $http;

  beforeEach(module('ActiveResource'));
  beforeEach(module('ActiveResource.Mocks'));

  beforeEach(inject(['ActiveResource', 'ActiveResource.Mocks', '$httpBackend', '$timeout', '$http',
    function(_ActiveResource_, _ARMocks_, _$httpBackend_, _$timeout_, _$http_) {
    ActiveResource = _ActiveResource_;
    Mocks          = _ARMocks_;
    System         = Mocks.System;
    Sensor         = Mocks.Sensor;
    Post           = Mocks.Post;
    Comment        = Mocks.Comment;
    Author         = Mocks.Author;
    backend        = _$httpBackend_;
    $timeout       = _$timeout_;
    $http          = _$http_;

    // MOCK API RESPONSES
    // 
    // GET SYSTEM
    // Requests for mock "persisted" systems that will be returned from the mock API
    backend.whenGET('http://api.faculty.com/system/?id=1')
      .respond([{id: 1}]);

    backend.whenGET('http://api.faculty.com/system/?id=2')
      .respond([{id: 2}]);
  
    backend.whenGET('http://api.faculty.com/system/?id=3')
      .respond([{id: 3}]);

    backend.whenGET('http://api.faculty.com/system/?id=4')
      .respond([{id: 4}]);

    backend.whenGET('http://api.faculty.com/system/?id=5&placement=door')
      .respond([{id: 5, placement: 'door'}]);

    backend.whenGET('http://api.faculty.com/system/?placement=window')
      .respond([{id: 6, placement: 'window'}, {id: 7, placement: 'window'}]);

    // POST SYSTEM
    // Responses for POST requests to create new systems
    backend.whenPOST('http://api.faculty.com/system.json', {placement: 'window', name: 'Bretts System', sensors: []})
      .respond({id: 8, placement: 'window', name: 'Bretts System'});
    
    backend.whenPOST('http://api.faculty.com/system.json', {placement: 'window', name: 'Matts System', sensors: []})
        .respond({id: 9, placement: 'window', name: 'Matts System'});

    backend.whenPOST('http://api.faculty.com/system.json',
        {id: 10, placement: 'door', sensors: []})
        .respond({id: 10, placement: 'door'});

    backend.whenPOST('http://api.faculty.com/system.json')
      .respond({id: 1});

    // GET SENSOR
    // Requests for mock "persisted" sensors
    backend.whenGET('http://api.faculty.com/sensor/?id=1')
      .respond({id: 1, system_id: 1});

    backend.whenGET('http://api.faculty.com/sensor/?id=2')
      .respond({id: 2, system_id: 2});

    // POST SENSOR
    // Responses for POST requests to create new sensors
    backend.whenPOST('http://api.faculty.com/sensor.json',
      {system_id: 1})
      .respond({id: 3});

    backend.whenPOST('http://api.faculty.com/sensor.json')
      .respond({id: 3, system_id: 1});

    // POST POST
    // Reponses for POST requests to create new 'posts'
    backend.whenPOST('http://api.faculty.com/post.json')
      .respond({"_id":1});

    spyOn($http, 'get').andCallThrough();
    spyOn($http, 'post').andCallThrough();
    spyOn($http, 'delete').andCallThrough();
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

  describe('Primary Keys', function() {
    // Each model's primary key defaults to "id," but can be overridden in the model
    // definition using the `primaryKey` method:
    //
    //    function Post(data) {
    //      this.primaryKey('_hasManyid');
    //    }
    //
    // In the example above, the primary key for the model is assumed to be `_id`, as
    // in a MongoDB database. 
    //
    // The primary key is used primarily for mapping API requests properly.
    var post, comment;
    beforeEach(function() {
      Post.$create({title: "My Great Post"}).then(function(response) { post = response; });
      backend.expectPOST('http://api.faculty.com/post.json')
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
      backend.expectPOST('http://api.faculty.com/post.json', {"_id": "52a8b80d251c5395b485cfe6", "title": "My Great Post", comments: []})
        .respond({"_id": "52a8b80d251c5395b485cfe6", "title": "My Great Post"});
      backend.flush(); 
      expect($http.post).toHaveBeenCalledWith('http://api.faculty.com/post.json',
       '{"title":"My Great Post","comments":[],"_id":"52a8b80d251c5395b485cfe6"}');
    });

    it('deletes using the primary key', function() {
      post.$delete();
      backend.expectDELETE('http://api.faculty.com/post/?_id=52a8b80d251c5395b485cfe6')
        .respond({data: 'Success'});
      backend.flush();
      expect($http.delete).toHaveBeenCalledWith('http://api.faculty.com/post/?_id=52a8b80d251c5395b485cfe6');
    });

    it('finds using the primary key if no object is passed to find', function() {
      Post.find('52a8b80d251c5395b485cfe7', {lazy: true}).then(function(response) { post = response; });
      backend.expectGET('http://api.faculty.com/post/?_id=52a8b80d251c5395b485cfe7')
        .respond({"_id": "52a8b80d251c5395b485cfe7", "title": "An Incredible Post"});
      backend.flush();
      expect($http.get).toHaveBeenCalledWith('http://api.faculty.com/post/?_id=52a8b80d251c5395b485cfe7');
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

      backend.expectPOST('http://api.faculty.com/post.json')
        .respond({_id: 1, title: 'Cool Post'});

      backend.expectPOST('http://api.faculty.com/author.json')
        .respond({_id: 1, name: 'Bertrand Russel'})

      backend.expectPOST('http://api.faculty.com/comment.json')
        .respond({id: 1, post_id: 1, author_id: 1});

      backend.flush();
    });

    it('parses associations to foreign keys when saving', function() {
      expect($http.post).toHaveBeenCalledWith('http://api.faculty.com/comment.json',
        '{"text":"Excellente!","post_id":1,"author_id":1}');
    });

    it('parses foreign key responses into model objects', function() {
      expect(comment.author).toBe(author);
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
        backend.expectPOST('http://api.faculty.com/sensor.json', {"system_id": 1}).respond({id: 3, system_id: 1});
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

          backend.expectPOST('http://api.faculty.com/author.json',
            {name: 'Master Yoda', comments: [], posts: []})
            .respond({'_id': 1, name: 'Master Yoda'});

          backend.expectPOST('http://api.faculty.com/author.json',
            {name: 'Luke Skywalker', comments: [], posts: []})
            .respond({'_id': 2, name: 'Luke Skywalker'});

          backend.flush();

          author.posts.$create({title: 'Do Or Do Not, There Is No Try'})
            .then(function(response) { 
              post   = response; 
            });

          backend.expectPOST('http://api.faculty.com/post.json',
            {"title":"Do Or Do Not, There Is No Try","author_id": 1,"comments":[]})
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

          backend.expectPOST('http://api.faculty.com/comment.json',
              {"text":"Great post, Yoda!","post_id":1,"author_id":2})
              .respond({'id': 1, 'text': 'Great post, Yoda!',
                author_id: 2, post_id: 1});

          backend.expectPOST('http://api.faculty.com/comment.json')
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
      backend.expectGET('http://api.faculty.com/post/?_id=1')
        .respond({_id: 1, title: "Great Post"});

      backend.expectGET('http://api.faculty.com/comment/?post_id=1')
        .respond([{id: 1, text: "Great one!", post_id: 1}]);

      backend.flush();
    });

    it('Eagerly Loads Associations By Default', function() {
      expect(post.comments.first.id).toBe(1);
    });

    it('Uses foreign keys set to query for associations', function() {
      expect($http.get).toHaveBeenCalledWith('http://api.faculty.com/comment/?post_id=1');
    });
  });

  describe('Syntax Options', function() {
    describe('Assocations', function() {
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
        backend.expectPOST('http://api.faculty.com/sensor.json').respond({id: 1, system_id: 1});
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
          backend.expectPOST('http://api.faculty.com/sensor.json').respond({id: 1, system_id: 1});
          backend.expectPOST('http://api.faculty.com/sensor.json').respond({id: 2, system_id: 1});
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

      describe('Destruction of parent', function() {
        describe('Dependent => destroy == false', function() {
          var sensor1;
          beforeEach(function() {
            system.sensors.$create().then(function(response) {
              sensor1 = response;
            });
            backend.expectPOST('http://api.faculty.com/sensor.json').respond({id: 1, system_id: 1});
            backend.flush();
            system.$delete();
            backend.expectDELETE('http://api.faculty.com/system/?id=1').respond({data: 'success'});
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
            backend.expectPOST('http://api.faculty.com/post.json')
              .respond({"_id": 1, "title": 'My Great Post'});
            backend.flush();
            post.comments.$create().then(function(response) { comment = response; });
            backend.expectPOST('http://api.faculty.com/comment.json')
              .respond({id: 1, post_id: 1});
            backend.flush();
            post.$delete().then(function(response) { post = comment = response; });
            backend.expectDELETE('http://api.faculty.com/post/?_id=1').respond({data: 'success'});
            backend.expectDELETE('http://api.faculty.com/comment/?id=1').respond({data: 'success'});
            backend.flush();
            $timeout.flush();
          });

          it('deletes the primary resource', function() {
            expect(post).not.toBeDefined();
          });

          it('deletes dependents when the primary resource is destroyed', function() {
            expect(comment).not.toBeDefined();
          });

          it('calls the backend to delete the dependents', function() {
            expect($http.delete).toHaveBeenCalledWith('http://api.faculty.com/comment/?id=1');
          });
        });
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
        expect(Sensor.cached[3]).toEqual(sensor);
      });

      it('adds the id that it received from the backend', function() {
        expect(system.sensors[0].id).toEqual(3);
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

      var post;
      beforeEach(function() {
        System.$create({id: 1}).then(function(response) { system = response; });
        Post.$create().then(function(response) { post = response; });
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
      
      it('considers properties defined in the prototype chain to be "settable"', function () {
        post.update({date: 'February 24, 2013'});
        expect(post.date).toBe('February 24, 2013');
      });
    });
  });

  describe('Querying', function() {
    describe('base#where', function() {

      var system8, system9, system10;

      beforeEach(function() {
        // Backend will respond with {id: 1}
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
        backend.flush();
        expect(foundSystems).toEqual([system]);
      });

      it('finds by any attr', function() {
        var foundSystems;
        System.where({placement: 'window'}, {lazy: true}).then(function(response) { foundSystems = response; });
        backend.expectGET('http://api.faculty.com/system/?placement=window')
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
        backend.expectGET('http://api.faculty.com/system/?placement=window')
          .respond([{id: 8, placement: 'window', name: 'Bretts System'},
                    {id: 9, placement: 'window', name: 'Matts System'},
                    {id: 10, placement: 'window', name: 'Pickles System'}]);
        backend.flush();
        expect($http.get).toHaveBeenCalledWith('http://api.faculty.com/system/?placement=window');
      });

      it('adds the instance to the cache', function() {
        var foundSystems;
        System.where({id: 4}, {lazy: true}).then(function(response) { foundSystems = response; });
        backend.flush();
        expect(System.cached[4]).toBe(foundSystems[0]);
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
        System.find({id: 1}, {lazy: true}).then(function(response) { foundSystem = response; });
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
        // No cached system will be found, triggering a $http.get('http://api.faculty.com/system/?placement=window');
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

  describe('Over-Eager Loading', function() {
    var post, comment, author;
    beforeEach(function() {
      Post.find(1, {overEager: true}).then(function(response) { post = response; });

      backend.expectGET('http://api.faculty.com/post/?_id=1')
        .respond({_id: 1, title: 'Great post!', author_id: 1});

      backend.expectGET('http://api.faculty.com/author/?_id=1')
        .respond({_id: 1, name: 'Yorn Lomborg'});

      backend.expectGET('http://api.faculty.com/comment/?author_id=1')
        .respond({_id: 1, text: 'Great!', author_id: 1, post_id: 1});

      backend.expectGET('http://api.faculty.com/comment/?post_id=1')
        .respond({_id: 1, text: 'Great!', author_id: 1, post_id: 1});

      backend.expectGET('http://api.faculty.com/post/?author_id=1')
        .respond({_id: 1, title: 'Great post!', author_id: 1});

      backend.flush();
    });

    it('Loads assocations, and then all associations of associations, etc., recursively', function() {
      expect($http.get).toHaveBeenCalledWith('http://api.faculty.com/post/?author_id=1');
    });
  });

  describe('Evented Modeling', function() {
    var post, comment, author;
    beforeEach(function() {
      spyOn(window, 'alert');
      Post.find(1).then(function(response) { post = response; });
      backend.expectGET('http://api.faculty.com/post/?_id=1')
        .respond({_id: 1, title: 'Great post!', author_id: 1});

      backend.expectGET('http://api.faculty.com/author/?_id=1')
        .respond({_id: 1, name: 'Yorn Lomborg'});

      backend.expectGET('http://api.faculty.com/comment/?post_id=1')
        .respond({});

      backend.flush();
    });

    it('performs events after $save', function() {
      var data = {answer: 0};
      Post.after('$save', changeData);
      function changeData(e) { data.answer = e; };
      post.$save();
      backend.flush();
      expect(data.answer).toEqual(post);
    });

    it('performs events before $save', function() {
      Post.before('$save', function(instance) { instance.title = 'Whoa!'; });
      post.$save().then(function(response) { post = response; });
      backend.flush();
      expect(post.title).toBe('Whoa!');
    });

    it('performs events after $delete', function() {
      Post.after('$delete', function(instance) { 
        window.alert(instance.title + ' deleted successfully!')});
      post.$delete();
      backend.expectDELETE('http://api.faculty.com/post/?_id=1').respond({
        status: 200});
      backend.flush();
      expect(window.alert).toHaveBeenCalledWith('Great post! deleted successfully!');
    });

    it('performs events before $delete', function() {
      Post.before('$delete', function(instance) {
        alert('Are you sure you want to delete ' + instance.title + '?')});
      post.$delete();
      expect(window.alert).toHaveBeenCalledWith('Are you sure you want to delete Great post!?');
    });

    it('performs events before find', function() {
      Post.before('find', function(instance) {
        instance._id = 1;
      });
      Post.find({_id: 2}).then(function(response) { post = response; });
      $timeout.flush();
      expect(post._id).toEqual(1);
    });

    it('performs events after find', function() {
      Post.after('find', function(instance) {
        alert('Found ' + instance.title);
      });

      Post.find(1);
      $timeout.flush();
      expect(window.alert).toHaveBeenCalledWith('Found Great post!');
    });

    it('performs events before find', function() {
      Post.before('find', function(terms) {
        alert('Finding instance ' + terms);
      });
      Post.find(1);
      $timeout.flush();
      expect(window.alert).toHaveBeenCalledWith('Finding instance 1');
    });

    it('performs events before where', function() {
      Post.before('where', function(terms) {
        alert('Finding instances that match ' + terms.title);
      });
      Post.where({title: 'Great post!'}, {lazy: true});
      backend.expectGET('http://api.faculty.com/post/?title=Great post!')
        .respond({title: 'Great post!', _id: 1});
      backend.flush();
      expect(window.alert).toHaveBeenCalledWith('Finding instances that match Great post!');
    });

    it('performs events after where', function() {
      Post.after('where', function(results) {
        alert('Found em!');
      });
      Post.where({title: 'Great post!'}, {lazy: true});
      backend.expectGET('http://api.faculty.com/post/?title=Great post!')
        .respond({title: 'Great post!', _id: 1});
      backend.flush();
      expect(window.alert).toHaveBeenCalledWith('Found em!');
    });

    it('performs events before update', function() {
      Post.before('update', function(instance) {
        instance.title = 'My new title';
      });
      post.update({_id: 2});
      expect(post.title).toBe('My new title');
    });

    it('performs events after update', function() {
      Post.after('update', function(instance) {
        alert(instance.title + ' updated!');
      });
      post.update({_id: 2});
      expect(window.alert).toHaveBeenCalledWith('Great post! updated!');
    });
  });
});
