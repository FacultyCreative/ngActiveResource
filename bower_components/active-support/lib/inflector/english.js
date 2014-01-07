'use strict';

var Inflections = require('./inflections');

var English = {};

English.inflections = new Inflections();

English.inflections.plural(/$/, 's');
English.inflections.plural(/s$/i, 's');
English.inflections.plural(/^(ax|test)is$/i, '$1es');
English.inflections.plural(/(octop)us$/i, '$1i');
English.inflections.plural(/(vir)us$/i, '$1uses');
English.inflections.plural(/(alias|status)$/, '$1es');
English.inflections.plural(/(bu)s$/i, '$1ses');
English.inflections.plural(/(buffal|tomat)o$/i, '$1oes');
English.inflections.plural(/([ti])um$/i, '$1a');
English.inflections.plural(/([ti])a$/i, '$1a');
English.inflections.plural(/sis$/i, 'ses');
English.inflections.plural(/(?:([^f])fe|([lr])f)$/i, '$1$2ves');
English.inflections.plural(/(hive)$/i, '$1s');
English.inflections.plural(/([^aeiouy]|qu)y$/i, '$1ies');
English.inflections.plural(/(x|ch|ss|sh)$/i, '$1es');
English.inflections.plural(/(matr|vert|ind)(?:ix|ex)$/i, '$1ices');
English.inflections.plural(/^(m|l)ouse$/i, '$1ice');
English.inflections.plural(/^(m|l)ice$/i, '$1ice');
English.inflections.plural(/^(ox)$/i, '$1en');
English.inflections.plural(/^(oxen)$/i, '$1');
English.inflections.plural(/(quiz)$/i, '$1zes');

English.inflections.singular(/s$/i, '');
English.inflections.singular(/(ss)$/i, '$1');
English.inflections.singular(/(n)ews$/i, '$1ews');
English.inflections.singular(/([ti])a$/i, '$1um');
English.inflections.singular(/((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)(sis|ses)$/i, '$1sis');
English.inflections.singular(/(^analy)(sis|ses)$/i, '$1sis');
English.inflections.singular(/([^f])ves$/i, '$1fe');
English.inflections.singular(/(hive)s$/i, '$1');
English.inflections.singular(/(tive)s$/i, '$1');
English.inflections.singular(/([lr])ves$/i, '$1f');
English.inflections.singular(/(c[lr])oves$/i, '$1ove');
English.inflections.singular(/([^aeiouy]|qu)ies$/i, '$1y');
English.inflections.singular(/(s)eries$/i, '$1eries');
English.inflections.singular(/(m)ovies$/i, '$1ovie');
English.inflections.singular(/(x|ch|ss|sh)es$/i, '$1');
English.inflections.singular(/^(m|l)ice$/i, '$1ouse');
English.inflections.singular(/(bus)(es)?$/i, '$1');
English.inflections.singular(/(o)es$/i, '$1');
English.inflections.singular(/^(toe)s$/i, '$1');
English.inflections.singular(/(shoe)s$/i, '$1');
English.inflections.singular(/(cris|test)(is|es)$/i, '$1is');
English.inflections.singular(/^(a)x[ie]s$/i, '$1xis');
English.inflections.singular(/(octop|vir)(us|i)$/i, '$1us');
English.inflections.singular(/(alias|status)(es)?$/i, '$1');
English.inflections.singular(/^(ox)en/i, '$1');
English.inflections.singular(/(vert|ind)ices$/i, '$1ex');
English.inflections.singular(/(matr)ices$/i, '$1ix');
English.inflections.singular(/(quiz)zes$/i, '$1');
English.inflections.singular(/(database)s$/i, '$1');

English.inflections.irregular('person', 'people');
English.inflections.irregular('man', 'men');
English.inflections.irregular('child', 'children');
English.inflections.irregular('sex', 'sexes');
English.inflections.irregular('move', 'moves');
English.inflections.irregular('zombie', 'zombies');

English.inflections.acronym('HTML');

English.inflections.uncountable('equipment',
  'information', 'rice', 'money', 'species', 'series', 'fish',
  'sheep', 'jeans', 'police');

module.exports = English;
