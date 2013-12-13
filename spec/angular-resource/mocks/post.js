angular
  .module('ActiveResource.Mocks')
  .provider('ARMockPost', function() {
    this.$get = ['ActiveResource',
      function(ActiveResource) {
      function Post(data) {
        this.primaryKey('_id');

        if (!data) data = {};
        this.title  = data.title  || undefined;
        this.hasMany('comments',
          ['ActiveRecord.Mocks', 'ARMockComment']);
      };

      Post = ActiveResource.Base.apply(Post);
      Post.dependentDestroy('comments');
      Post.api.set('http://api.faculty.com/');
      return Post;
    }];
  });
