# ActiveResource for Angular.js

ActiveResource provides a Base class to make modelling with Angular easier. It
provides associations, caching, API integration, validations, and Active Record
pattern persistence methods.

## Installation:

In your bower.json:

    "ngActiveResource": "0.6.2"

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
          this.number('id');
          this.string('title');
          this.string('subtitle');

          this.computedProperty('fullTitle', function() {
            return this.title + this.subtitle;
          }, ['title', 'subtitle']);

          this.hasMany('comments');
          this.belongsTo('author);
        };

        Post.inherits(ActiveResource.Base);
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

## Computed Properties:

Following the syntax of Ember.js' computed properties, you can create properties
that auto-magically update with or without Angular's two-way binding:

    function TShirt() {
      this.number('price');

      this.computedProperty('salePrice', function() {
        return this.price - (this.price * 0.2);
      }, 'price');

      this.computedProperty('superSalePrice', function() {
        return this.price - this.salePrice;
      }, ['price', 'salePrice']);
    }

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
`where`, `all`, and `update`. `new` creates a new instance of a model on the client,
and `update` updates that instance without issuing a PUT request. `find` will
attempt to find local instances in the model's client-side cache before issuing
a GET request, and `where` and `all` will always issue a GET request to ensure it has all
instances of a model that match given terms. These are the 'safe' methods in a
RESTful API (GET).

## Query Interface:

### Getting Set Up:

Best case scenario: You have an API that adheres to ActiveResource's RESTful
convention. Here's that convention:

| HTTP Verb | CRUD     | Path                    | Action | Used To                                                           |
| --------- |:--------:|:------------------:|:------:|:---------------------                                             |
| GET       | Retrieve | /users                     | index  | Display a list of all users, or all users filtered by querystring |
| GET       | Retrieve | /users                     | show   | Display a specific user, found by querystring                     |
| POST      | Create   | /users                        | create | Create a user                                                     |
| PUT       | Update   | /users/:id              | update | Update a specific user                                            |
| DELETE    | Destroy  | /users/:id              | destroy| Delete a specific user                                            |

Please notice that the update action differs from the URLs you might display to
a user in Ruby on Rails: we won't refer to a specific primary key or username
in the URL, as a valid PUT request will instead send this data as an opaque
block of data.

If you do have an API that follows these conventions, hooking it up to ActiveResource is as easy as:

    Post.api.set('http://api.faculty.com');

If you need to override specific URLs:

    Post.api.indexURL  = 'http://api.faculty.com/list-all-the-users';
    Post.api.showURL   = 'http://api.faculty.com/show-me-user';
    Post.api.deleteURL = 'http://api.faculty.com/show-me-user/:param';

`[:params]` will be substituted for you automatically using the parameters
specified by the query methods listed below.

### Parameterized URLS versus Query Strings:

To signal to ActiveResource that you want it to replace parameters in your URL,
simply type them following a colon:

    Post.api.showURL = /posts/:id
    Post.api.showURL = /posts/:_id  // MongoDB

The parameters themselves will be replaced:

    Post.find({id: 1})
    >> http://my.api.com/posts/1

If no params are provided, ActiveResource will use a query string by default.

    Post.$delete({author_id: 1})
    >> http://my.api.com/posts/?author_id=1

### Find:

```
  Post.find({title: 'My Great Post'})
```

`find` is used to retrieve a single instance of a model. It is a method akin to
the `show` action in a RESTful API. Therefore, it first attempts to use the `showURL`, and
will fall back on the `indexURL` if a `showURL` is not defined.

`find` returns only the first instance it finds. If the instance is already
stored into the browser's cache, it will not make a backend request. To force a
backend request, you can add the `forceGET` request option:

```
  Post.find({title: 'My Great Post'}, {forceGET: true});
```

By default, find will also eagerly load a single level of associations. If a
Post has many comments, and we find a post, its comments will be loaded as well,
but the comments will not load their authors, or other comment-based
associations. To load associations' associations, pass the option:

```
  {overEager: true}
```

To lazily load associations (not load even the first level of associations, aka
comments in the example above), pass the option:

```
  {lazy: true}
```

Let's say you're working with a sort of crummy API. It doesn't have an endpoint
to find a single instance of a particular model, or it won't parse a variety of
options (like `title` for our post). Maybe it only parses by `id`, and you
_must_ find the post by title. In that case, hit your index API (the endpoint
that returns all instances of a given resource), and pass the option:

```
  {noInstanceEndpoint: true}
```

This option will do the parsing on the client-side for you to overcome the
gnarly API.

### Where:

Similar to the `find` method, but it will pull all instances matching the given
parameters. Where will _always_ query the backend, assuming that it does not
have the necessary instances.

`where` is akin to the `index` action in a RESTful API, and therefore first
attempts to use the `indexURL`, and will fall back on the `showURL` if an
`indexURL` is not defined.

```
  Post.where({author_id: author.id})
```

### All:

Returns all instances. Takes no parameters:

```
  Post.all()
```

`all` is just a shorthand for a `where` request with no search parameters
specified. It therefore will use the `whereURL`, if defined.

### Promise-based:

All queries are promise-based:

```
  Post.where({author_id: author.id}).then(function(response) {
    post = response;
  });
```

## Custom Primary Keys

By default, models will assume a primary key field labeled `id`, but you can set
a custom one like so:

```
    function Post(data) {
      primaryKey('_id');
    }
```

## Destroy Dependent Associations

If you want a model to delete certain associated resources when they themselves
are deleted, use `dependentDestroy`:

```
    Post.dependentDestroy('comments');

```
Now when you destroy a post, any associated comments will also be destroyed.

## Serialize/toJSON

The `serialize` and `toJSON` methods (aliases of one another) change associations to foreign keys and remove circular references.

    post.serialize()
    
These methods also take several options:

    post.serialize({prettyPrint: true})
    
Prints a formatted JSON string.

    post.serialize({includeEmptyKeys: true})
    
Changes instances of null or undefined to empty strings, in the event your backend requires all properties to be sent with values. If you include `presence` validations on these fields, they will still fail as empty strings, and will not be sent using the built-in methods.

  var dummyData = {hi: 'there'};
  post.serialize({instance: dummyData});

Can tap into ActiveResource's serialization method to serialize arbitrary
Javascript objects. If the `instance` option is not passed, the model instance
itself will be serialized.

`serialize` and `toJSON` are non-mutating methods. They will not change the
instance itself. To save the serialized data as a variable, assign it:

  var json = post.serialize();

## Write Validations:

Models can describe validations required before data will be persisted
successfully:

    function User(data) {
      this.name  = data.name;
      this.email = data.email;

      this.validates({
        name: {presence: true},
        email: { format: { email: { validates: true, message: 'Must provide valid email' } } } 
      });

Validations also work with the Simple Form directive to perform easy form
styling. 

### Helper Methods:

    user.$valid
    >> false 

    user.$invalid
    >> true

    user.$errors
    >> { name: ['Must be defined'] }

    user.validate('name')
    >> true

    user.validateIfErrored('name')
    >> true
    
### Usage in Forms:

Helper methods make form validation simple:

    <input ng-model="user.name" ng-blur="user.validate('name')">
    
Displaying errors is equally simple. Errors will only be added for a given field once it's been validated. Validate them one-by-one with directives like `ng-blur` or `ng-change`, or validate them all at once by passing no arguments to the `validate` method:

    <div ng-show="user.errors.name" class="alert alert-warning">{{user.errors.name}}</div>

The interaction we prefer at Faculty Creative usually looks like this:

    <input
     ng-model="user.name"
     ng-blur="user.validate('name')
     ng-change="user.validateIfErrored('name')>

This causes validations to run on blur, and, if errors exist on the field, to
run on change, so that as soon as a user corrects an error, the error will
disappear immediately.

When a model instance is saved, all validations are automatically run, so errors
will appear if the form contains any errors.

You can also clear errors on a given field, or on the whole instance:

    <button ng-submit="user.clearErrors()"></button>
    
    <button ng-submit="user.clearErrors('name')"></button>

#### Presence:

Validates that a user has entered a value:

      name: {presence: true}

#### Required If:

Validates that a user has entered a value if a certain requirement is met:

      username: {requiredIf: { requiredIf: emailIsBlank,  message: 'You must
enter a username' } }

      function emailIsBlank(value, field, instance) {
        return !instance.email || instance.email.length === 0;
      }

#### Absence:

Validates that a field does not have a value:

      name: {absence: true}

#### Length:

Validates using ranges, min, max, or exact length:

      username: { length: { in: _.range(1, 20); } },
      email:    { length: { min: 5, max: 20 } },
      zip:      { length: { is: 5 } }

#### Format:

Validates several built-in formats, and validates custom formats using the `regex`
key:

      zip:   { format: { zip: true   } },
      email: { format: { email: true } },
      uuid:  { format: { regex: /\d{3}\w{5}/ } } 

#### Numericality:

Validates that a value can be cast to a number. Can be set to ignore values like
commas and hyphens:

      zip:    { numericality: { ignore: /[\-]/g } }

#### Acceptance: 

Validates truthiness, as in checkbox acceptance:

      termsOfService: { acceptance: true }

#### Inclusion:

Validates inclusion in a set of terms:

      size: { inclusion: { in: ['small', 'medium', 'large'] } }

#### Exclusion:

Validates exclusion from a set of terms:

      size: { exclusion: { from: ['XS', 'XL'] } } 

#### Confirmation:

Validates that two fields match:

      password:             { confirmation: true },
      passwordConfirmation: { presence: true }

#### Validates Association:

If an association must be valid in order for an instance to be validate, use
the `association` validation:

      author: { association: 'author' },
      comments: { association: 'comments' }

The MIT License (MIT)

Copyright (c) 2013-2014 Brett Shollenberger

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
