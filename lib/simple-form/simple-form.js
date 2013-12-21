var simpleForm = angular.module('simpleForm', []);

simpleForm.directive('form', function() {
  return {
    restrict: 'E',
    require: '^form',
    compile: function() {
      return {
        pre: function(scope, formElement, attrs, ctrl) {
          // Very little is changed compared to Angular 1.2.0rc3's ngForm. 

          // We add a default name to the field based on the 'for' attribute, but allow
          // this to be overridden by the name attribute. 

          // We add a fields hash to separate form inputs from the rest of the controller
          // methods of ngFormController, so they can be iterated through on their own.
          ctrl.$name   = attrs.name || nameDefault() || attrs.ngForm;
          ctrl.$fields = {};

          // Ex. for="user" returns "userForm"
          function nameDefault() {
            return attrs['for'] ? attrs['for'] + 'Form' : '';
          }

          // Private method of ngForm that we had to copy out here to ensure we continued
          // to raise this assertion in $addControl, which we override below
          function assertNotHasOwnProperty(name, context) {
            if (name === 'hasOwnProperty') {
              throw ngMinErr('badname', "hasOwnProperty is not a valid {0} name", context);
            }
          }

          // We only add one new line here to add the control to the $fields hash. We
          // continue to allow the controls to sit as properties on the form itself
          // for backwards compatibility, but this functionality is deprecated in our version.
          // Future releases will only add controls to the fields hash. 
          ctrl.$addControl = function(control) {
            assertNotHasOwnProperty(control.$name, 'input');

            if (control.$name) {
              ctrl.$fields[control.$name] = control;
              ctrl[control.$name] = control;
            }
          };
        }
      };
    }
  };
});

simpleForm.directive('ngModel', function($compile) {

  return {
    restrict: 'A',
    require: ['^ngModel', '^form'],
    compile: function() {
      return {
        pre: function(scope, element, attrs, ctrls) {
          var $model, modelName, fieldName, confirmationName, validationKey, keyName,
          modelCtrl            = ctrls[0],
          formCtrl             = ctrls[1] || nullFormCtrl;
          modelCtrl.$name      = attrs.name || attrs.ngModel || 'unnamedInput';
          $model               = scope.$eval(attrs.ngModel.replace(/\.\w{0,}/g, ''));
          modelCtrl.$validates = $model.validates[attrs.ngModel.replace(/\w{0,}\./, '')];

          var validators = {
            presence: function() {
              return function(value) {
                return value && value.length;
              };
            },
            absence: function() {
              return function(value) {
                return !value;
              };
            },
            format: {
              email: function() {
                return function(value) {
                  if (!value) return undefined;
                  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,6}$/.test(value);
                };
              },
              zip: function() {
                return function(value) {
                  if(!value) return undefined;
                  return /(^\d{5}$)|(^\d{5}-{0,1}\d{4}$)/.test(value);
                };
              },
              regex: function(regex) {
                return function(value) {
                  if (!value) return undefined;
                  return regex.test(value);
                };
              }
            },
            inclusion: function(options) {
              return function(value) {
                if (!value) return undefined;
                if (!options.in) throw "Inclusion validator must specify 'in' attribute.";
                var included = false;
                options.in.forEach(function(i) {
                  if (i == value) { included = true; }
                });
                return included;
              };
            },
            exclusion: function(options) {
              return function(value) {
                if (!value) return undefined;
                if (!options.from) throw "Exclusion validator must specify 'from' attribute.";
                var included = true;
                options.from.forEach(function(i) {
                  if (i == value) { included = false; }
                });
                return included;
              };
            },
            length: {
              in: function(array) {
                return function (value) {
                  if (!value) return undefined;
                  return (value.length >= array[0] && value.length <= array[array.length - 1]);
                };
              },
              min: function(min) {
                return function(value) {
                  if (!value) return undefined;
                  return value.length >= min;
                };
              },
              max: function(max) {
                return function(value) {
                  if (!value) return undefined;
                  return value.length <= max;
                };
              },
              is: function(is) {
                return function(value) {
                  if (!value) return undefined;
                  return value.length == is;
                };
              }
            },
            acceptance: function() {
              return function(value) {
                return value == true;
              };
            },
            confirmation: function() {
              return function(value) {
                modelName        = attrs.ngModel.replace(/\.\w{0,}/g, '');
                fieldName        = modelCtrl.$name.replace(/\w{0,}\./, '');
                confirmationName = modelName + '.' + fieldName + 'Confirmation';
                return value == formCtrl.$fields[confirmationName].$viewValue;
              };
            },
            numericality: function(options) {
              return function(value) {
                if (!value) return undefined;
                if (options.ignore) { value = value.replace(options.ignore, ''); }
                return !isNaN(Number(value));
              };
            },
            uniqueness: function() {
              return function(value) {
                models = $model.all();
                var unique = true;
                var fieldName = modelCtrl.$name.replace(/\w{0,}\./, '');
                models.forEach(function(model) {
                  if (model[fieldName] == value) { unique = false; }
                });
                return unique;
              };
            }
          };

          for (var validator in modelCtrl.$validates) {
            addValidations(validator, modelCtrl.$validates[validator], validators);
          }

          // VALIDATION STRATEGY FACTORY
          // The user assigns key-value pairs where the key represents the name of the
          // validator she wants to use, and the value represents a particular set of
          // instructions for customization. 
          // 
          // If the key matches a validation function in the validators hash, the
          // instructions are passed as an argument to the factory function, which
          // returns a validation strategy to be added to the array of $parsers used
          // by any inputs that reference that model property. The $parsers 
          // array runs as a pipeline whenever the control reads a value from the DOM,
          // and the value is passed from one function to the next, unless at any point
          // it is determined invalid, in which case it returns undefined. The $parsers
          // functions also use ngModelCtrl.$setValidity to signal the validity of the
          // input, and trigger responses on the page, like ng-valid/invalid CSS classes,
          // and the addition messages in the $error hash on the form & each input.
          // 
          // If the key does not refer to a function, but instead returns a subset of
          // the hash ({format: {email: true}} would return the format section of the
          // hash), then we loop recursively through the addValidations function, moving
          // to the next key:value pair in the set using the subset of the hash as the
          // lookup table. In this case {email: true} would result in a terminal lookup
          // that refers to a factory function, and the resultant function would be added 
          // to the $parsers array.
          //
          // In the case where the key refers to nothing in the lookup table, the value
          // in the user's key:value pair is presumed to be a function that evaluates to
          // a boolean. This function is used to build a custom validator. 
          function addValidations(key, value, remainingHash) {
            // If the key points to a function, it is ready to be made into
            // a validator. The value of the hash (e.g. {in: _.range(1, 10)}) is treated 
            // as the argument to the factory function to build the appropriate validator
            // (in this case, a validator where the length of the input is between)
            // 1 and 9. pushParser creates a $parser function and adds it to the $parsers
            // array on the input. 
            if (isFunction(remainingHash[key])) { pushParser(remainingHash[key](value)); return; }

            // If remainingHash[key] returns a subset of the hash, we need to recurse
            // through the method until we find a function or return nothing from the hash.
            if (isObject(remainingHash[key]))   {
              // Cut down the hash to only the section we're still interested in.
              remainingHash = remainingHash[key];
              // The recursive keys will be the keys from the next segment of the hash
              keys   = Object.keys(value);

              // Loop through each key to add a validator for each value in the event of
              // multiple values like { length: { min: 1, max: 10 } }
              keys.forEach(function(key) {
                // The recursive value will be the value from the next segment of the hash
                nestedValue = value[key];
                // Recurse through the function
                addValidations(key, nestedValue, remainingHash);
              });
              return;
            }

            // If the key cannot be found in the hash, we assume that it is a custom
            // validator that implements a validates key.
            if (isUndefined(remainingHash[key])) {
              if (!value.validates) { throw "Custom validators must provide a validates key containing a Boolean function."; }
              pushParser(value.validates);
            }

            // Signal to the user that their validations have taken place by adding them
            // to the validates attribute on the element.
            element.attr({validates: Object.keys(modelCtrl.$validates)});
          }

          function getProto(value) {
            return Object.prototype.toString.call(value);
          }

          function isObject(value) {
            return getProto(value) === '[object Object]';
          }

          function isFunction(value) {
            return getProto(value) === '[object Function]';
          }

          function isUndefined(value) {
            return value === undefined;
          }

          function pushParser(validationKey) {
            modelCtrl.$parsers.push(function(value) {
              if (validationKey(value))  { modelCtrl.$setValidity(validator, true);  }
              if (!validationKey(value)) { modelCtrl.$setValidity(validator, false); return undefined; }
              return value;
            });
          }
        }
      };
    }
  };
});

