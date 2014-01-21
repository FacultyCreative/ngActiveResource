'use strict';

describe('Inflector', function() {

  var Inflector;
  beforeEach(function() {
    Inflector = require('../../lib/inflector/inflector');
  });

  describe('String#sub', function() {
    it('is different from String#replace because it returns undefined if no match is found', function() {
      expect('hello'.replace('hi', 'hello')).toEqual('hello');
      expect('hello'.sub('hi', 'hello')).toEqual(undefined);
    });
  });

  describe('String#isEmpty', function() {
    it('returns false if the string has a length of more than one', function() {
      expect('hi'.isEmpty()).toEqual(false);
    });

    it('returns true if the string has a length of exactly zero', function() {
      expect(''.isEmpty()).toEqual(true);
    });
  });

  describe('String#pluralize', function() {

    it('pluralizes standard English ends-in-s', function() {
      expect('post'.pluralize()).toEqual('posts');
      expect('green'.pluralize()).toEqual('greens');
    });

    it('pluralizes -is to -es', function() {
      expect('axis'.pluralize()).toEqual('axes');
      expect('testis'.pluralize()).toEqual('testes');
    });

    it('pluralizes -us to -i', function() {
      expect('octopus'.pluralize()).toEqual('octopi');
    });

    it('pluralizes -sis to -ses', function() {
      expect('diagnosis'.pluralize()).toEqual('diagnoses');
      expect('analysis'.pluralize()).toEqual('analyses');
      expect('virus'.pluralize()).toEqual('viruses');
      expect('status'.pluralize()).toEqual('statuses');
    });

    it('pluralizes -ias to -ses', function() {
      expect('alias'.pluralize()).toEqual('aliases');
    });

    it('gets the special pluralization of "bus"', function() {
      expect('bus'.pluralize()).toEqual('buses');
    });

    it('pluralizes -o to -oes', function() {
      expect('buffalo'.pluralize()).toEqual('buffaloes');
      expect('tomato'.pluralize()).toEqual('tomatoes');
    });

    it('pluralizes -tium to -tia', function() {
      expect('consortium'.pluralize()).toEqual('consortia');
      expect('hospitium'.pluralize()).toEqual('hospitia');
    });

    it('pluralizes -fe to -ives', function() {
      expect('fife'.pluralize()).toEqual('fives');
    });

    it('pluralizes -ve to -ves', function() {
      expect('hive'.pluralize()).toEqual('hives');
    });

    it('pluralizes -quy to -quies', function() {
      expect('soliloquy'.pluralize()).toEqual('soliloquies');
    });

    it('pluralizes -ex to -exes', function() {
      expect('ex'.pluralize()).toEqual('exes');
    });

    it('pluralizes -ix to -ices', function() {
      expect('matrix'.pluralize()).toEqual('matrices');
    });

    it('pluralizes -ex to -ices', function() {
      expect('vertex'.pluralize()).toEqual('vertices');
      expect('index'.pluralize()).toEqual('indices');
    });

    it('pluralizes -ouse to -ice', function() {
      expect('mouse'.pluralize()).toEqual('mice');
      expect('louse'.pluralize()).toEqual('lice');
    });

    it('pluralizes ox/oxen appropriately', function() {
      expect('ox'.pluralize()).toEqual('oxen');
      expect('oxen'.pluralize()).toEqual('oxen');
    });

    it('pluralizes irregular words', function() {
      expect('quiz'.pluralize()).toEqual('quizzes');
      expect('person'.pluralize()).toEqual('people');
      expect('man'.pluralize()).toEqual('men');
      expect('woman'.pluralize()).toEqual('women');
      expect('child'.pluralize()).toEqual('children');
      expect('sex'.pluralize()).toEqual('sexes');
      expect('move'.pluralize()).toEqual('moves');
      expect('cow'.pluralize()).toEqual('cows');
      expect('zombie'.pluralize()).toEqual('zombies');
    });

    it('does not pluralize uncountables', function() {
      expect('equipment'.pluralize()).toEqual('equipment');
      expect('information'.pluralize()).toEqual('information');
      expect('rice'.pluralize()).toEqual('rice');
      expect('money'.pluralize()).toEqual('money');
      expect('species'.pluralize()).toEqual('species');
      expect('series'.pluralize()).toEqual('series');
      expect('sheep'.pluralize()).toEqual('sheep');
      expect('jeans'.pluralize()).toEqual('jeans');
      expect('police'.pluralize()).toEqual('police')
    });

    it('accepts a numeric argument that dictates whether or not it should pluralize', function() {
      expect('chicken'.pluralize(2)).toEqual('chickens');
      expect('chicken'.pluralize(1)).toEqual('chicken');
      expect('chicken'.pluralize(0)).toEqual('chickens');
    });

    describe('idempotence', function() {
      it('has the same effect many times over as calling it only once', function() {
        expect('quiz'.pluralize().pluralize().pluralize().pluralize()).toEqual('quizzes');
      });

      it('returns the plural if passed the plural', function() {
        expect('systems'.pluralize()).toEqual('systems');
      });
    });

  });

  describe('String#singularize', function() {

    it('singularizes -s to no -s', function() {
      expect('posts'.singularize()).toEqual('post');
    });

    it('singularizes -ness to -ness', function() {
      expect('sweetness'.singularize()).toEqual('sweetness');
    });

    it('singularizes -es to no -es', function() {
      expect('sweetnesses'.singularize()).toEqual('sweetness');
    });

    it('handles uncountables', function() {
      expect('news'.singularize()).toEqual('news');
      expect('series'.singularize()).toEqual('series');
    });

    it('singularizes -tia to -tium', function() {
      expect('consortia'.singularize()).toEqual('consortium');
    });

    it('singularizes -tia to -tium', function() {
      expect('analyses'.singularize()).toEqual('analysis');
      expect('diagnoses'.singularize()).toEqual('diagnosis');
      expect('parantheses'.singularize()).toEqual('paranthesis');
      expect('prognoses'.singularize()).toEqual('prognosis');
      expect('synopses'.singularize()).toEqual('synopsis');
      expect('theses'.singularize()).toEqual('thesis');
    });

    it('singularizes -ves to -ve', function() {
      expect('fives'.singularize()).toEqual('fife');
      expect('hives'.singularize()).toEqual('hive');
      expect('cloves'.singularize()).toEqual('clove');
    });


    it('singularizes -quies to -quy', function() {
      expect('soliloquies'.singularize()).toEqual('soliloquy');
    });

    it('singularizes -ies to -ie', function() {
      expect('movies'.singularize()).toEqual('movie');
    });

    it('singularizes -ishes to -ish', function() {
      expect('fishes'.singularize()).toEqual('fish');
    });

    it('singularizes -ouse to -ice', function() {
      expect('lice'.singularize()).toEqual('louse');
    });

    it('singularizes toes to toe', function() {
      expect('toes'.singularize()).toEqual('toe');
    });


    it('singularizes potatoes to potato', function() {
      expect('potatoes'.singularize()).toEqual('potato');
    });

    it('singularizes shoes to shoe', function() {
      expect('shoes'.singularize()).toEqual('shoe');
    });

    it('singularizes -ses and -es to -is', function() {
      expect('crises'.singularize()).toEqual('crisis');
      expect('testes'.singularize()).toEqual('testis');
      expect('aliases'.singularize()).toEqual('alias');
      expect('axes'.singularize()).toEqual('axis');
      expect('vertices'.singularize()).toEqual('vertex');
      expect('matrices'.singularize()).toEqual('matrix');
    });

    it('singularize -i to -us', function() {
      expect('octopi'.singularize()).toEqual('octopus');
    });
    
    it('singularizes oxen/ox', function() {
      expect('oxen'.singularize()).toEqual('ox');
      expect('ox'.singularize()).toEqual('ox');
    });

    it('singularizes irregulars', function() {
      expect('quizzes'.singularize()).toEqual('quiz');
      expect('databases'.singularize()).toEqual('database');
      expect('people'.singularize()).toEqual('person');
      expect('men'.singularize()).toEqual('man');
      expect('women'.singularize()).toEqual('woman');
      expect('children'.singularize()).toEqual('child');
      expect('sexes'.singularize()).toEqual('sex');
      expect('moves'.singularize()).toEqual('move');
      expect('cows'.singularize()).toEqual('cow');
      expect('zombies'.singularize()).toEqual('zombie');
    });

    it('leaves uncountables alone', function() {
      expect('equipment'.singularize()).toEqual('equipment');
      expect('information'.singularize()).toEqual('information');
      expect('rice'.singularize()).toEqual('rice');
      expect('money'.singularize()).toEqual('money');
      expect('species'.singularize()).toEqual('species');
      expect('series'.singularize()).toEqual('series');
      expect('sheep'.singularize()).toEqual('sheep');
      expect('jeans'.singularize()).toEqual('jeans');
      expect('police'.singularize()).toEqual('police');
    });

    describe('idempotence', function() {
      it('has the same effect no matter how many times it is called', function() {
        expect('systems'.singularize().singularize().singularize()).toEqual('system');
      });

      it('will return the singular if passed the singular (same as idempotence)', function() {
        expect('system'.singularize()).toEqual('system');
      });
    });

  });

  describe('String#camelize', function() {
    it('changes a string to camelcase', function() {
      expect('active_model'.camelize()).toEqual('activeModel');
      expect('active_model_party'.camelize()).toEqual('activeModelParty');
    });
  });

  describe('String#underscore', function() {
    it('changes a string to underscore case', function() {
      expect('ActiveModel'.underscore()).toEqual('active_model');
      expect('SuperDuperClass'.underscore()).toEqual('super_duper_class');
      expect('SuperHTMLParser'.underscore()).toEqual('super_html_parser');
    });
  });

  describe('String#hyphenate', function() {
    it('changes a string to hyphen case', function() {
      expect('activeModel'.hyphenate()).toEqual('active-model');
      expect('SuperDuperClass'.hyphenate()).toEqual('super-duper-class');
      expect('SuperHTMLParser'.hyphenate()).toEqual('super-html-parser');
    });
  });

  // Capitalizes the first word and turns underscores into spaces and strips a
  // trailing "_id", if any. Like +titleize+, this is meant for creating pretty
  // output.
  //
  //   'employee_salary'.humanize # => "Employee salary"
  //   'author_id'.humanize       # => "Author"
  describe('String#humanize', function() {
    it('humanizes a phrase', function() {
      expect('employee_salary'.humanize()).toEqual('Employee salary');
      expect('author_id'.humanize()).toEqual('Author');
      expect('AuthorComments'.humanize()).toEqual('Author comments');
    });
  });

  // # Capitalizes all the words and replaces some characters in the string to
  // # create a nicer looking title. +titleize+ is meant for creating pretty
  // # output.
  // #
  // #
  // #   'man from the boondocks'.titleize   # => "Man From The Boondocks"
  // #   'x-men: the last stand'.titleize    # => "X-Men: The Last Stand"
  // #   'TheManWithoutAPast'.titleize       # => "The Man Without A Past"
  // #   'raiders_of_the_lost_ark'.titleize  # => "Raiders Of The Lost Ark"
  describe('String#titleize', function() {
    it('turns a phrase into a title', function() {
      expect('man from the boondocks'.titleize()).toEqual('Man From The Boondocks');
      expect('x-men: the last stand'.titleize()).toEqual('X-Men: The Last Stand');
      expect('TheManWithoutAPast'.titleize()).toEqual('The Man Without A Past');
      expect('raiders_of_the_lost_ark'.titleize()).toEqual('Raiders Of The Lost Ark');
    });
  });

  describe('String#titlecase', function() {
    it('is an alias for titleize', function() {
      expect('man from the boondocks'.titlecase()).toEqual('Man From The Boondocks');
    })
  });

  describe('String#classify', function() {
    it('creates a class name for a plural entity', function() {
      expect('posts'.classify()).toEqual('Post');
      expect('sensors'.classify()).toEqual('Sensor');
      expect('systems'.classify()).toEqual('System');
      expect('user_projects'.classify()).toEqual('UserProject');
      expect('gridController'.classify()).toEqual('GridController');
    });

    it('is idempotent', function() {
      expect('superDuperGridController'.classify().classify())
        .toEqual('SuperDuperGridController');
    });
  });

  describe('String#toForeignKey', function() {
    it('creates the name of a foreign key', function() {
      expect('post'.toForeignKey()).toEqual('post_id');
      expect('Sensor'.toForeignKey()).toEqual('sensor_id');
    });
  });

  describe('String#ordinalize', function() {
    it('ordindalizes a number', function() {
      expect('1'.ordinalize()).toEqual('1st');
      expect('202'.ordinalize()).toEqual('202nd');
      expect('4003'.ordinalize()).toEqual('4003rd');
      expect('5004'.ordinalize()).toEqual('5004th');
      expect('15'.ordinalize()).toEqual('15th');
      expect('16'.ordinalize()).toEqual('16th');
      expect('17'.ordinalize()).toEqual('17th');
      expect('18'.ordinalize()).toEqual('18th');
      expect('19'.ordinalize()).toEqual('19th');
      expect('20'.ordinalize()).toEqual('20th');
    });
  });

});
