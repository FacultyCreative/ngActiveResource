angular
  .module('ActiveResource.Mocks')
  .provider('ARMockComment', function() {
    this.$get = ['ActiveResource',
      function(ActiveResource) {
      function Comment(data) {
        if (!data) data = {};
        this.id     = data.id   || undefined;
        this.text   = data.text || undefined;
        this.belongsTo('post',
          ['ActiveRecord.Mocks', 'ARMockPost']);
      };

      Comment = ActiveResource.Base.apply(Comment);
      Comment.api.set('http://api.faculty.com/');
      return Comment;
    }];
  });
