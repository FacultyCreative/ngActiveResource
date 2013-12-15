angular
  .module('ActiveResource.Mocks')
  .provider('Author', function() {
    this.$get = ['ActiveResource',
      function(ActiveResource) {
      function Author(data) {
        if (!data) data = {};

        this.name  = data.name  || undefined;

        this.hasMany('comments');
        this.hasMany('posts');
      };

      Author = ActiveResource.Base.apply(Author);
      Author.primaryKey = '_id';
      Author.dependentDestroy('comments');
      Author.api.set('http://api.faculty.com/');
      return Author;
    }];
  });
