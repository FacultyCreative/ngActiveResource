'use strict';

var _ = require('lodash');

var STRPROTO = String.prototype;

STRPROTO.downcase = function() {
  return this.toLowerCase();
};

module.exports = Inflections;

function Inflections() {

  (function init() {
    this.plurals      = [];
    this.singulars    = [];
    this.uncountables = [];
    this.humans       = [];
    this.acronyms     = {};
    this.acronymRegex = /(?=a)b/;
  }).call(this);

  // Specifies a new acronym. An acronym must be specified as it will appear
  // in a camelized string. An underscore string that contains the acronym
  // will retain the acronym when passed to +camelize+, +humanize+, or
  // +titleize+. A camelized string that contains the acronym will maintain
  // the acronym when titleized or humanized, and will convert the acronym
  // into a non-delimited single lowercase word when passed to +underscore+.
  this.acronym = function(word) {
    this.acronyms[word.downcase()] = word;
    var acronyms = _.values(this.acronyms).join('|');
    this.acronymRegex = new RegExp(acronyms);
  };

  // Specifies a new pluralization rule and its replacement. The rule can
  // either be a string or a regular expression. The replacement should
  // always be a string that may include references to the matched data from
  // the rule.
  this.plural = function(rule, replacement) {
    if (_.isString(rule)) _.without(this.uncountables, rule);
    _.without(this.uncountables, replacement);
    this.plurals.unshift([rule, replacement]);
  };

  // Specifies a new singularization rule and its replacement. The rule can
  // either be a string or a regular expression. The replacement should
  // always be a string that may include references to the matched data from
  // the rule.
  this.singular = function(rule, replacement) {
    if (_.isString(rule)) _.without(this.uncountables, rule);
    _.without(this.uncountables, replacement);
    this.singulars.unshift([rule, replacement]);
  };

  // Specifies a new irregular that applies to both pluralization and
  // singularization at the same time. This can only be used for strings, not
  // regular expressions. You simply pass the irregular in singular and
  // plural form.
  //
  //   irregular 'octopus', 'octopi'
  //   irregular 'person', 'people'
  this.irregular = function(singular, plural) {
    _.without(this.uncountables, singular);
    _.without(this.uncountables, plural);

    var s0    = singular[0];
    var srest = singular.slice(1);

    var p0    = plural[0];
    var prest = plural.slice(1);

    var sReg = '(' + s0 + ')' + srest;
    var pReg = '(' + p0 + ')' + prest;
    this.plural(new RegExp(sReg + '$', 'i'), '$1' + prest);
    this.plural(new RegExp(pReg + '$', 'i'), '$1' + prest);

    this.singular(new RegExp(sReg + '$', 'i'), '$1' + srest);
    this.singular(new RegExp(pReg + '$', 'i'), '$1' + srest);
  };

  // Add uncountable words that shouldn't be attempted inflected.
  //
  //   uncountable 'money'
  //   uncountable 'money', 'information'
  this.uncountable = function() {
    for (var i in arguments) {
      this.uncountables.push(arguments[i]);
    }
  };

}
