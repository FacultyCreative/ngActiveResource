angular
  .module('ActiveResource.Mocks', [])
  .provider('ActiveResource.Mocks', function() {
    this.$get = ['ARMockSystem', 'ARMockSensor', 'ARMockPost', 'ARMockComment',
      function(System, Sensor, Post, Comment) {
      Mocks         = {};
      Mocks.System  = System;
      Mocks.Sensor  = Sensor;
      Mocks.Post    = Post;
      Mocks.Comment = Comment;
      
      return Mocks;
    }];
  });
