angular
  .module('ActiveResource.Mocks')
  .provider('Post', function() {
    this.$get = ['ActiveResource',
      function(ActiveResource) {
      function Post(data) {
        this.primaryKey('_id');

        if (!data) data = {};
        this.title  = data.title  || undefined;
        
        this.belongsTo('author');
        this.hasMany('comments');
      };

      Post = ActiveResource.Base.apply(Post);
      Post.dependentDestroy('comments');
      Post.api.set('http://api.faculty.com/');
      return Post;
    }];
  });
