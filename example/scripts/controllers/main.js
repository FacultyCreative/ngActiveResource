angular.module('app')
  .controller('MainCtrl', ['$scope', '$route', 'Post', 'Comment', 
      function($scope, $route, Post, Comment) {
        
        setTimeout(function() {
          Post.find({title: $route.current.params.title}).then(function(post) {
            setScopes(post);
          });
        }, 0);

        function setScopes(post) {
          $scope.post    = post;
          $scope.comment = $scope.post.comments.new();
        };

        Comment.after('$save', function() {
          $scope.comment = $scope.post.comments.new();
        });

      }
  ]);
