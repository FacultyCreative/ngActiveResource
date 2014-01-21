ActiveSupport.js
===============

Active Support for Javascript

#### String#singularize

```
expect('cloves'.singularize()).toEqual('clove');
expect('soliloquies'.singularize()).toEqual('soliloquy');
expect('series'.singularize()).toEqual('series');
```

#### String#pluralize
  
```
expect('post'.pluralize()).toEqual('posts');
expect('person'.pluralize()).toEqual('people');
expect('man'.pluralize()).toEqual('men');
```

Pluralize also accepts a number that dictates pluralization:

```
expect('chicken'.pluralize(2)).toEqual('chickens');
expect('chicken'.pluralize(1)).toEqual('chicken');

var errorCount = 1;
expect('error'.pluralize(errorCount)).toEqual('error');
```

#### String#camelize
  
```
it('changes a string to camelcase', function() {
  expect('active_model'.camelize()).toEqual('ActiveModel');
  expect('active_model_party'.camelize()).toEqual('ActiveModelParty');
});

it('leaves acronyms uppercase', function() {
  expect('HTML_parser'.camelize()).toEqual('HTMLParser');
});
```

#### String#underscore

```
expect('ActiveModel'.underscore()).toEqual('active_model');
expect('SuperDuperClass'.underscore()).toEqual('super_duper_class');
expect('SuperHTMLParser'.underscore()).toEqual('super_html_parser');
```

#### String#hyphenate

```
expect('activeModel'.hyphenate()).toEqual('active-model');
expect('SuperDuperClass'.hyphenate()).toEqual('super-duper-class');
expect('SuperHTMLParser'.hyphenate()).toEqual('super-html-parser');
```

#### String#humanize

```
expect('employee_salary'.humanize()).toEqual('Employee salary');
expect('author_id'.humanize()).toEqual('Author');
expect('AuthorComments'.humanize()).toEqual('Author comments');
```

#### String#titleize

```
expect('man from the boondocks'.titleize()).toEqual('Man From The Boondocks');
expect('x-men: the last stand'.titleize()).toEqual('X-Men: The Last Stand');
expect('TheManWithoutAPast'.titleize()).toEqual('The Man Without A Past');
expect('raiders_of_the_lost_ark'.titleize()).toEqual('Raiders Of The Lost Ark');
```

#### String#classify

```
expect('posts'.classify()).toEqual('Post');
expect('sensors'.classify()).toEqual('Sensor');
expect('systems'.classify()).toEqual('System');
expect('team_projects'.classify()).toEqual('TeamProject');
```

#### String#toForeignKey

```
expect('post'.toForeignKey()).toEqual('post_id');
expect('Sensor'.toForeignKey()).toEqual('sensor_id');
```

#### String#ordinalize

```
expect('1'.ordinalize()).toEqual('1st');
expect('202'.ordinalize()).toEqual('202nd');
expect('4003'.ordinalize()).toEqual('4003rd');
expect('5004'.ordinalize()).toEqual('5004th');
```
