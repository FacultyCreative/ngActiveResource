'use strict';

var _ = require('lodash');
var English = require('./english');

module.exports = (function() {

  var STRPROTO = String.prototype;

  function isRegExp(test) {
    return test instanceof RegExp;
  };

  Object.defineProperty(STRPROTO, 'gsub', {
    enumerable: false,
    value: function(regex, w) {
      var r = regex.toString().replace(/^\//, '').replace(/\/$/, '');
      return this.replace(new RegExp(r, 'g'), w);
    }
  });

  Object.defineProperty(STRPROTO, 'sub', {
    enumerable: false,
    value: function(test, rep) {
      var regex;
      if (isRegExp(test))    regex = test;
      if (!isRegExp(test))   regex = new RegExp(test);
      if (this.match(regex)) return this.replace(regex, rep);
    }
  });

  Object.defineProperty(STRPROTO, 'isEmpty', {
    enumerable: false,
    value: function() { return this.length === 0; }
  });

  Object.defineProperty(STRPROTO, 'pluralize', {
    enumerable: false,
    value: function(number) {
      if (number == 1) return this;
      return applyInflections(this, English.inflections.plurals);
    }
  });

  Object.defineProperty(STRPROTO, 'singularize', {
    enumerable: false,
    value: function() {
      return applyInflections(this, English.inflections.singulars);
    }
  });


  function applyInflections(word, rules) {
    var returner, result;
    returner = result = _.clone(word.toString());
    if (result.isEmpty() || _.include(English.inflections.uncountables, result.toLowerCase())) return result;
    for (var i in rules) {
      var rule        = rules[i][0];
      var replacement = rules[i][1];
      if (result.sub(rule, replacement)) {
        returner = result.sub(rule, replacement);
        break;
      }
    }
    return returner;
  };

  Object.defineProperty(STRPROTO, 'capitalize', {
    enumerable: false,
    value: function() {
      return this[0].toUpperCase() + this.slice(1).toLowerCase();
    }
  });

  Object.defineProperty(STRPROTO, 'camelize', {
    enumerable: false,
    value: function() {
      var string = _.clone(this);
      if (!string.match(/[A-Z][a-z]/)) {
        string = string.replace(/[a-z\d]+/g, function(t) { 
          return t.capitalize(); 
        });
      }
      string = string[0].downcase() + string.slice(1);
      string = string.replace(/(?:_|(\/))([a-z\d]*)/gi, "$1" + 
        (English.inflections.acronyms["$2"] || "$2".capitalize()));
      return string;
    }
  });

  Object.defineProperty(STRPROTO, 'underscore', {
    enumerable: false,
    value: function() {
      var word  = _.clone(this);
      var regex = new RegExp('(?:([A-Za-z\d])|^)' + English.inflections.acronymRegex + '(?=\b|[^a-z])', 'g');
      word = word.replace(regex, '$1$1_$2');
      word = word.replace(/([A-Z\d]+)([A-Z][a-z])/g,'$1_$2');
      word = word.replace(/([a-z\d])([A-Z])/g,'$1_$2');
      word = word.toLowerCase();
      return word;
    }
  });

  Object.defineProperty(STRPROTO, 'hyphenate', {
    enumerable: false,
    value: function() {
      var word = _.clone(this);
      word     = word.underscore();
      word     = word.replace(/\_/g, '-');
      return word;
    }
  });

  // Capitalizes the first word and turns underscores into spaces and strips a
  // trailing "_id", if any. Like +titleize+, this is meant for creating pretty
  // output.
  //
  //   'employee_salary'.humanize # => "Employee salary"
  //   'author_id'.humanize       # => "Author"
  Object.defineProperty(STRPROTO, 'humanize', {
    enumerable: false,
    value: function() {
      var word = _.clone(this);
      word     = word.underscore();
      word     = word.gsub(/_id$/, '');
      word     = word.gsub(/\_/, ' ');
      word     = word.gsub(/([a-z\d])*/i, function(t) {
        return English.inflections.acronyms[t] || t.toLowerCase();
      });
      word     = word.replace(/^\w/, function(t) { return t.capitalize(); });
      return word;
    }
  });

  // # Capitalizes all the words and replaces some characters in the string to
  // # create a nicer looking title. +titleize+ is meant for creating pretty
  // # output. It is not used in the Rails internals.
  // #
  // # +titleize+ is also aliased as +titlecase+.
  // #
  // #   'man from the boondocks'.titleize   # => "Man From The Boondocks"
  // #   'x-men: the last stand'.titleize    # => "X Men: The Last Stand"
  // #   'TheManWithoutAPast'.titleize       # => "The Man Without A Past"
  // #   'raiders_of_the_lost_ark'.titleize  # => "Raiders Of The Lost Ark"
  Object.defineProperty(STRPROTO, 'titleize', {
    enumerable: false,
    value: function() {
      return this.humanize().replace(/\b(\w+)/g, 
        function(a) { return a.capitalize(); })
    }
  });

  Object.defineProperty(STRPROTO, 'titlecase', {
    enumerable: false,
    value: function() {
      return this.titleize(); 
    }
  });

  Object.defineProperty(STRPROTO, 'classify', {
    enumerable: false,
    value: function() {
      var camelized = this.singularize().camelize().replace(/.*\./, '');
      return camelized[0].capitalize() + camelized.slice(1);
    }
  });

  Object.defineProperty(STRPROTO, 'toForeignKey', {
    enumerable: false,
    value: function() {
      return this.underscore() + '_id';
    }
  });

  Object.defineProperty(STRPROTO, 'ordinalize', {
    enumerable: false,
    value: function() {
      var number = Number(this);

      if (_.include([11, 12, 13], number % 100)) {
        return number + 'th';
      } else {
        var remain = number % 10;
        if (remain == 1) return number + 'st';
        if (remain == 2) return number + 'nd';
        if (remain == 3) return number + 'rd';
        return number + 'th';
      }
    }
  });
  
}).call(this);
