angular
  .module('ActiveResource.Mocks')
  .provider('Project', function() {
    this.$get = ['ActiveResource',
      function(ActiveResource) {

      function Project(attributes) {
        this.string('title');
      };

      Project.inherits(ActiveResource.Base);
      Project.api.set('http://api.faculty.com/').format('json');
      return Project;
    }];
  });
