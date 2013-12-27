angular
  .module('ActiveResource')
  .provider('ARValidations', function() {
    this.$get = ['$q', function($q) {
      function Validations(data, instance) {
        var validations = [];
        var fields      = {};
        this.$errors     = {};

        function presence() {
          return function(value) {
            if (value === undefined || value === null) return false;
            if (value.constructor.name == 'String') return !!(value && value.length);
            return value !== undefined;
          };
        };

        function absence() {
          return function(value) {
            return !value;
          };
        };

        function email() {
          return function(value) {
            if (!value) return true;
            return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,6}$/.test(value);
          };
        };

        function zip() {
          return function(value) {
            if(!value) return true;
            return /(^\d{5}$)|(^\d{5}-{0,1}\d{4}$)/.test(value);
          };
        };

        function regex() {
          return function(value) {
            if (!value) return true;
            return regex.test(value);
          };
        };

        function inclusion(options) {
          return function(value) {
            if (!value) return true;
            if (!options.in) throw "Inclusion validator must specify 'in' attribute.";
            var included = false;
            options.in.forEach(function(i) {
              if (i == value) { included = true; }
            });
            return included;
          };
        };

        function exclusion(options) {
          return function(value) {
            if (!value) return true;
            if (!options.from) throw "Exclusion validator must specify 'from' attribute.";
            var included = true;
            options.from.forEach(function(i) {
              if (i == value) { included = false; }
            });
            return included;
          };
        };
      
        function lengthIn(array) {
          return function (value) {
            if (!value) return true;
            return value.length >= array[0] && value.length <= array[array.length - 1];
          };
        };

        function min(min) {
          return function(value) {
            if (!value) return true;
            return value.length >= min;
          };
        };
      
        function max(max) {
          return function(value) {
            if (!value) return true;
            return value.length <= max;
          };
        };

        function lengthIs(is) {
          return function(value) {
            if (!value) return true;
            return String(value).length == is;
          };
        }

        function acceptance() {
          return function(value) {
            if (not(value)) return true;
            return value == true;
          };
        };

        function confirmation() {
          return function(value, field) {
            confirmationName  = field + 'Confirmation';
            confirmationField = instance[confirmationName];
            return value == confirmationField;
          };
        };

        function numericality(options) {
          return function(value) {
            if (!value) return true;
            value = String(value);
            if (options.ignore) { value = value.replace(options.ignore, ''); }
            return !isNaN(Number(value));
          };
        };

        function customValidation(validation) {
          return function(value, field) {
            return function(value, field) {
              if (!value) return true;
              return validation(value);
            }
          };
        };

        function not(value) {
          if (value === false) return false;
          return !value;
        };

        presence.message   = function(value) {
          return "Can't be blank";
        }

        absence.message    = function(value) {
          return "Can't be defined";
        }

        email.message      = function(value) {
          return "Is not a valid email address";
        }

        zip.message        = function(value) {
          return "Is not a valid zip code";
        }
        
        regex.message      = function(value) {
          return "Is not the proper format";
        }

        inclusion.message  = function(value) {
          lastVal     = 'or ' + value.in.slice(-1);
          joinedArray = value.in.slice(0, -1);
          joinedArray.push(lastVal);
          if (joinedArray.length >= 3) list = joinedArray.join(', ');
          else list = joinedArray.join(' ');
          return "Must be included in " + list;
        }

        exclusion.message  = function(value) {
          lastVal = 'or ' + value.from.slice(-1);
          joinedArray = value.from.slice(0, -1);
          joinedArray.push(lastVal);
          if (joinedArray.length >= 3) list = joinedArray.join(', ');
          else list = joinedArray.join(' ');
          return "Must not be " + list;
        }

        lengthIn.message   = function(value) {
          var x = value[0];
          var y = value.slice(-1);
          return "Must be between " + x + " and " + y  + " characters";
        }

        min.message        = function(value) {
          return "Must be at least " + value + " characters";
        }

        max.message        = function(value) {
          return "Must be no more than " + value + " characters";
        }

        lengthIs.message   = function(value) {
          return "Must be exactly " + value +  " characters";
        }

        acceptance.message = function(value) {
          return "Must be accepted";
        }

        confirmation.message = function(value) {
          return "Must match confirmation field";
        }

        numericality.message = function(value) {
          return "Must be a number";
        }

        var validators = {
          presence: presence,
          absence: absence,
          format: {
            email: email,
            zip: zip,
            regex: regex
          },
          inclusion: inclusion,
          exclusion: exclusion,
          length: {
            in: lengthIn,
            min: min,
            max: max,
            is: lengthIs
          },
          acceptance: acceptance,
          confirmation: confirmation,
          numericality: numericality
        };

        for (var validator in data) {
          fields[validator] = new Validation(data[validator], validator);
        }

        this.validate = function(field) {

          // If a field name is passed into #validate, only validate that field:
          var toValidate  = fields[field] || fields;
          
          // If a no field name is passed in, validate all fields:
          if (toValidate.constructor.name == 'Array') toValidate = _.zipObject([field], toValidate);

          for (var field in toValidate) {
            _.each(fields[field], function(validator) {
              if (!isValid(validator, instance, field)) {
                if (!this.$errors[field]) this.$errors[field] = [];
                this.$errors[field].nodupush(validator.message);
              } else {
                if (!this.$errors[field]) return;
                _.remove(this.$errors[field], function(error) { return error == validator.message; });
                if (this.$errors[field].length === 0) {
                  delete this.$errors[field];
                }
              };
            }, this);
          };
          return Object.keys(this.$errors).length === 0;
        };

        function isValid(validator, instance, field) {
          var validation = validator(instance[field]);
          if (validation === undefined) return false;
          if (validation === false)     return false;
          return true;
        }

        this.updateInstance = function(inst) {
          instance = inst;
        };

        function Validation(data, field) {

            var validations = [];

            for (var validator in data) {
              addValidations(validator, data[validator], validators, field);
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
            function addValidations(key, value, remainingHash, field) {
              // If the key points to a function, it is ready to be made into
              // a validator. The value of the hash (e.g. {in: _.range(1, 10)}) is treated 
              // as the argument to the factory function to build the appropriate validator
              // (in this case, a validator where the length of the input is between)
              // 1 and 9. pushParser creates a $parser function and adds it to the $parsers
              // array on the input. 

              if (isFunction(remainingHash[key])) { 
                pushValidation(remainingHash[key], value, field); 
                return; 
              }

              // If remainingHash[key] returns a subset of the hash, we need to recurse
              // through the method until we find a function or return nothing from the hash.
              if (isObject(remainingHash[key]))   {
                // Cut down the hash to only the section we're still interested in.
                remainingHash = remainingHash[key];
                // The recursive keys will be the keys from the next segment of the hash
                keys = Object.keys(value);

                // Loop through each key to add a validator for each value in the event of
                // multiple values like { length: { min: 1, max: 10 } }
                keys.forEach(function(key) {
                  // The recursive value will be the value from the next segment of the hash
                  nestedValue = value[key];
                  // Recurse through the function
                  addValidations(key, nestedValue, remainingHash, field);
                });
                return;
              }

              // If the key cannot be found in the hash, we assume that it is a custom
              // validator that implements a validates key.
              if (isUndefined(remainingHash[key])) {
                if (!value.validates) { throw "Custom validators must provide a validates key containing a Boolean function."; }
              }
                pushValidation(customValidation(value.validates), value, field);
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

            function pushValidation(validationKey, value, field) {
              var validation = function(val) {
                if (value.validates) value = value.validates;
                if (validationKey(value)(val, field)) {
                  return true;
                } else {
                  return false;
                };
              };
              if (value.message) {
                validation.message = value.message;
              } else {
                validation.message = validationKey.message(value);
              }
              validations.push(validation);
            }
            return validations;
          }
        }

      function getConstructor(instance) {
        if (instance && instance.constructor) return instance.constructor;
        return undefined;
      };

      return Validations;
    }];
  });
