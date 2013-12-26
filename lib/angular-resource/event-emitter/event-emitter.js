angular
  .module('ActiveResource')
  .provider('AREventable', function() {
    this.$get = function() {
      function Eventable() {
        var events = {handlers: {}};

        Object.defineProperty(this, 'emit', {
          enumerable: true,
          value: function(eventType) {
            if (!events.handlers[eventType]) return;
            var handlerArgs = Array.prototype.slice.call(arguments, 1);
            for (var i = 0, l = handlerArgs.length; i<l; i++) {
              events.handlers[eventType][i].apply(this, handlerArgs);
            }
            return events;
          }
        });

        function addAspect(eventType, handler) {
          if (!(eventType in events.handlers)) {
            events.handlers[eventType] = [];
          }
          events.handlers[eventType].push(handler);
          return this;
        };

        this.before = function(eventType, handler) {
          return addAspect(eventType + ':called', handler);
        };

        this.after = function(eventType, handler) {
          return addAspect(eventType + ':complete', handler);
        };

        this.fail  = function(eventType, handler) {
          return addAspect(eventType + ':fail', handler);
        };

      };
      return Eventable;
    };
  });
