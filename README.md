# ActiveResource for Angular.js

ActiveResource provides a Base class to make modelling with Angular easier. It
provides associations, caching, API integration, validations, and Active Record
pattern persistence methods.

## Simple:

Say you want a form to add comments to a post:

    <form ng-submit="comment.$save">
      <input ng-model="comment.text">
      <input type="submit">
    </form>

    <div ng-repeat="comment in post.comments">
      {{comment.text}}
    </div>

In your controller, all you have to setup is something like this:

    Post.find(postId).then(function(response) {
      $scope.post      = response;
      $scope.comment   = $scope.post.comments.new();

      Comment.after('$save', function() {
        $scope.comment = $scope.post.comments.new();
      });
    };

You don't even have to tell `ng-repeat` to load in the new comment. The new
comment will already be added to the post by association. Simply tell the
`comment` object on the scope to clear, so that the user can enter another
comment.

## Writing a Model:

Create an Angular factory or provider that relies on ActiveResource:

    angular.module('app', ['ActiveResource')
      .factory('Post', ['ActiveResource', function(ActiveResource) {

        function Post(data) {
          this.id = data.id;
          this.hasMany('comments');
          this.belongsTo('author);
        };

        Post = ActiveResource.Base.apply(Post);
        Post.api.set('http://api.faculty.com');
        Post.dependentDestroy('comments');

        return User;
      });

The model is terse, but gains a lot of functionality from ActiveResource.Base.

It declares a has-many relationship on Comment, allowing it to say things like:

    var post    = Post.new({title: "My First Post"});
    var comment = post.comments.new({text: "Great post!"});

The new comment will be an instance of the class Comment, which will be defined
in its own model.

It also declares a belongs-to relationship on Author. This allows it to say
things like:

    var author     = Author.new();
    comment.author = author;
    comment.$save().then(function(response) { comment = response; });

This will also cause author.comments to include this instance of Comment.

Post also declares a dependent-destroy relationship on comments, meaning:

    post.$delete().then(function(response) { post = comment = response; });
    expect(post).not.toBeDefined();
    expect(comment).not.toBeDefined();
    expect(Post.find({title: "My First Post"}).not.toBeDefined();
    expect(Comment.find({text: "Great post!"}).not.toBeDefined();

This means the post and its comments have been deleted both locally and from the
database.

The astute reader will notice methods prefaced with `$` are interacting with an
API. The API calls are established in the model definition under
`Post.api.set()`.

## Establish Associations:

A has many association can be setup by naming the field. If the field name is
also the name of the provider that contains the foreign model, this is all you
have to say. If the name of the provider is different, you can set it explicitly
via the `provider` option: 

    this.hasMany('comments', {provider: 'CommentModel'});

Foreign keys will also be intuited. For instance:

    this.belongsTo('post');

Expect the model to define a `post_id` attribute mapping to the primary key of
the post to which it belongs. If the foreign key is different, you can set it
explicitly: 

    this.belongsTo('post', {foreign_key: 'my_post_id'});

Any number of options can be set on the association:

    this.belongsTo('post', {provider: 'PostModel', foreign_key: 'my_post_id'});

## Methods:

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

## Custom Primary Keys

By default, models will assume a primary key field labeled `id`, but you can set
a custom one like so:

    function Post(data) {
      primaryKey('_id');
    }

## Destroy Dependent Associations

If you want a model to delete certain associated resources when they themselves
are deleted, use `dependentDestroy`:

    Post.dependentDestroy('comments');

Now when you destroy a post, any associated comments will also be destroyed.

## Write Validations:

Models can describe validations required before data will be persisted
successfully:

    User.validates({name: 'presence', email: {format: 'email'} });

Validations also work with Wrangler's form helper to perform easy form styling.
For instance, a field with `ng-model` set to `user.email` will set the class
`ng-invalid` when the user has yet to enter a valid email.
