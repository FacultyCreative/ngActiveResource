# ActiveResource for Angular.js

ActiveResource provides a Base class to make modelling with Angular easier. It
provides associations, caching, API integration, validations, and Active Record
pattern persistence methods.

## Writing a Model:

Create an Angular factory or provider that relies on ActiveResource:

    angular.module('app', ['ActiveResource')
      .factory('User', ['ActiveResource', function(ActiveResource) {

        function User(data) {
          this.id = data.id;
          this.hasMany('posts', ['app', 'Post']);
        };

        User = ActiveResource.Base.apply(User);
        User.api.set('http://api.faculty.com');

        return User;
      });

## Establish Associations:

A has many association can be setup by naming the field, and passing in the name
of the module the associated model is located in, and the name of the associated
model:

    this.hasMany('comments', ['app', 'Comment']);

Now you have access to comment methods via post:

    var post    = new Post();
    var comment = post.comments.new({text: 'Great post!'});
    comment.$save();
    
    expect(comment.post).toEqual(post);
    expect(post.comments).toContain(comment);

## Write Validations:

Models can describe validations required before data will be persisted
successfully:

    User.validates({name: 'presence', email: {format: 'email'} });

Validations also work with Wrangler's form helper to perform easy form styling.
For instance, a field with `ng-model` set to `user.email` will set the class
`ng-invalid` when the user has yet to enter a valid email.
