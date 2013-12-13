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

### Methods:

ActiveResource adds two types of methods to your models and instances:

1) API-updating methods. These are prefaced with `$`, such as `$create`,
`$save`, `$update`, and `$delete`, and are the 'unsafe' methods in a RESTful API 
(POST, PUT, and DELETE). These methods will call the API using the URLs you've
set as ModelName.api.createURL, ModelName.api.updateURL, and ModelName.api.deleteURL.
The api.set method sets default API URLs for you, but you can override these defaults by setting
them explicitly.

2) Local-instance creating and finding methods. These include `new`, `find`,
`where`, and `update`. `new` creates a new instance of a model on the client,
and `update` updates that instance without issuing a PUT request. `find` will
attempt to find local instances in the model's client-side cache before issuing
a GET request, and `where` will always issue a GET request to ensure it has all
instances of a model that match given terms. These are the 'safe' methods in a
RESTful API (GET).

## Write Validations:

Models can describe validations required before data will be persisted
successfully:

    User.validates({name: 'presence', email: {format: 'email'} });

Validations also work with Wrangler's form helper to perform easy form styling.
For instance, a field with `ng-model` set to `user.email` will set the class
`ng-invalid` when the user has yet to enter a valid email.
