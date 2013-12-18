angular
  .module('ActiveResource.Mocks')
  .provider('Comment', function() {
    this.$get = ['ActiveResource',
      function(ActiveResource) {
      function Comment(data) {
        if (!data) data = {};
        this.text   = data.text || undefined;

        this.belongsTo('post');
        this.belongsTo('author', {foreignKey: 'author_id'});
      };

      Comment = ActiveResource.Base.apply(Comment);
      Comment.api.set('http://api.faculty.com/');
      return Comment;
    }];
  });
