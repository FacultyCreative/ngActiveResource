'use strict';

describe('Inflections', function() {

  var Inflections, inflections;
  beforeEach(function() {
    Inflections = require('../../lib/inflector/inflections');
    inflections = new Inflections();
  });

  describe('Inflections#acronym', function() {

    it('adds acronyms', function() {
      inflections.acronym('HTML');
      inflections.acronym('REST');
      expect(inflections.acronyms['html']).toEqual('HTML');
      expect(inflections.acronyms['rest']).toEqual('REST');
      expect(inflections.acronymRegex).toEqual(/HTML|REST/);
    });

  });

  describe('Inflections#plural', function() {

    it('adds plural rules', function() {
      inflections.plural(/$/, 's');
      expect(inflections.plurals).toEqual([[/$/, 's']]);
      inflections.plural(/s$/i, 's');
      expect(inflections.plurals).toEqual([[/s$/i, 's'], [/$/, 's']]);
    });

  });

  describe('Inflections#singular', function() {

    it('adds singular rules', function() {
      inflections.singular(/s$/i, '');
      expect(inflections.singulars).toEqual([[/s$/i, '']]);
      inflections.singular(/(ss)$/i, '$1');
      expect(inflections.singulars).toEqual([[/(ss)$/i, '$1'], [/s$/i, '']]);
    });

  });

  describe('Inflections#irregular', function() {

    it('adds irregular rules', function() {
      inflections.irregular('octopus', 'octopi');
      expect(inflections.plurals).toEqual([[/(o)ctopi$/i, '$1ctopi'], [/(o)ctopus$/i, '$1ctopi']]);
      expect(inflections.singulars).toEqual([[/(o)ctopi$/i, '$1ctopus'], [/(o)ctopus$/i, '$1ctopus']]);
    });

  });

  describe('Inflections#uncountable', function() {

    it('adds uncountables', function() {
      inflections.uncountable('money', 'information');
      expect(inflections.uncountables).toEqual(['money', 'information']);
    });

  });

});
