angular
  .module('ActiveResource.Mocks', [])
  .provider('ActiveResource.Mocks', function() {
    this.$get = ['ARMockSystem', 'ARMockSensor', 'ARMockGridController',
      'Post', 'Comment', 'Author',
      function(System, Sensor, GridController, Post, Comment, Author) {
        Mocks                = {};
        Mocks.System         = System;
        Mocks.Sensor         = Sensor;
        Mocks.GridController = GridController;
        Mocks.Post           = Post;
        Mocks.Comment        = Comment;
        Mocks.Author         = Author;
      
        return Mocks;
    }];
  });
