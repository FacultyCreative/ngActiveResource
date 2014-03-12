angular
  .module('ActiveResource')
  .provider('URLify', function() {
    this.$get = ['ARParameterize', 'ARQuerystring', function(parameterize, querystring) {
      return function(url, terms) {

        if (!url) return;
        if (!terms) return url;

        var qs = '';
        if (querystring.stringify(terms)) qs = '?' + querystring.stringify(terms);
        if (url.match(/\[\:[A-Za-z]+\]/))       url = url.replace(/\[\:[A-Za-z]+\]/, qs);
        else if (url.match(/\:\_*[A-Za-z]+/))   url = parameterize(url, terms);

        return url;
      };
    }];
  });