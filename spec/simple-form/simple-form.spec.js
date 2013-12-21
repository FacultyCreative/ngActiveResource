describe('Simple Form', function () {

  var $compile, $rootScope, parentScope, zipValidator,
  $scope, html, element, f, ngFormCtrl;

  beforeEach(module('simpleForm'));

  beforeEach(inject(function(_$compile_, _$rootScope_) {
    $compile         = _$compile_;
    $rootScope       = _$rootScope_;

    // Simulate a controller scope that ng-model will inherit from
    parentScope      = $rootScope.$new();

    zipValidator     = function(zip) {
      if(!zip) return true;
      return /(^\d{5}$)|(^\d{5}-{0,1}\d{4}$)/.test(zip);
    };

    // Simulate a model on the parent scope
    parentScope.user = {
      name: '',
      username: '',
      email: '',
      zip: '',
      id: '',
      termsOfService: false,
      password: '',
      passwordConfirmation: '',
      validates: {
        name:                 { presence: true },
        username:             { presence: true, length: { in: _.range(1, 10) } },
        email:                { presence: true, format: { email: true } },
        zip:                  { presence: true, zip: { validates: zipValidator, 
                                                message: "Must contain a valid zip code" } },
        termsOfService:       { acceptance: true },
        password:             { confirmation: true },
        passwordConfirmation: { presence: true }
      },
      save: angular.noop,
      find: angular.noop
    };

    // When a scope calls $new(), the child scope inherits prototypically
    $scope           = parentScope.$new();

    // Basic HTML use case
    html             = '<form for="user">' +
                          '<input ng-model="user.name">' +
                          '<input ng-model="user.username">' +
                          '<input ng-model="user.email">' +
                          '<input ng-model="user.zip">' +
                          '<input ng-model="user.termsOfService">' +
                          '<input ng-model="user.password">' +
                          '<input ng-model="user.passwordConfirmation">' +
                       '</form>';

    // Compile the view and bind to the scope
    element          = $compile(html)($scope);

    ngFormCtrl       = element.controller('form');
  }));

  describe('form creation and validation', function() {

    describe('built-in properties', function() {

      it('sets the form name to the name of the model + Form', function() {
        expect(ngFormCtrl.$name).toEqual('userForm');
      });

      it('sets the input name to the ng-model by default', function() {
        expect(ngFormCtrl.$fields['user.name'].$name).toEqual('user.name');
      });

      it('overrides the $name property with the name attribute, if defined', function() {
        html       =  '<form for="user">'+
                        '<input name="username" ng-model="user.name">' +
                      '</form>';

        // Compile the view and bind to the scope
        element    = $compile(html)($scope);

        ngFormCtrl = element.controller('form');
        expect(ngFormCtrl.$fields['username'].$name).toEqual('username');
      });

      it('exposes its fields publicly on the fields array', function() {
        expect(ngFormCtrl.$fields['user.name']).toBeDefined();
      });

      it('sets $valid to true/false based on the validity of the input', function() {
        ngFormCtrl.$fields['user.name'].$setViewValue(null);
        expect(ngFormCtrl.$fields['user.name'].$valid).toBe(false);
      });

    });

    describe('built-in validations', function() {
      it('adds validations based on instance#validates#property', function() {
        expect(ngFormCtrl.$fields['user.email'].$validates).toEqual({
          presence: true, 
          format: { email: true } 
        });
      });

      describe('presence validation', function() {
        it('is invalid if the field is not filled in', function() {
          ngFormCtrl.$fields['user.name'].$setViewValue(null);
          expect(ngFormCtrl.$fields['user.name'].$valid).toBe(false);
        });

        it('is valid if the field is filled in', function() {
          ngFormCtrl.$fields['user.name'].$setViewValue('a');
          expect(ngFormCtrl.$fields['user.name'].$valid).toBe(true);
        });
      });

      describe('email validation', function() {
        it('is invalid if the value is not an email', function() {
          ngFormCtrl.$fields['user.email'].$setViewValue('porky');
          expect(ngFormCtrl.$fields['user.email'].$valid).toBe(false);
        });

        it('is valid if the value is an email', function() {
          ngFormCtrl.$fields['user.email'].$setViewValue('porky@pig.net');
          expect(ngFormCtrl.$fields['user.email'].$valid).toBe(true);
        });
      });

      describe('zip validation', function() {
        beforeEach(function() {
          parentScope.user = {
            zip: '',
            validates: {
              zip:   { format: { zip: true } }
            }
          };

          html             = '<form for="user">' +
                                '<input ng-model="user.zip">' +
                              '</form>';
          element          = $compile(html)($scope);
          ngFormCtrl       = element.controller('form');
        });

        it('is valid if the zip code entered contains a hyphen', function() {
          ngFormCtrl.$fields['user.zip'].$setViewValue('11111-1111');
          expect(ngFormCtrl.$fields['user.zip'].$valid).toBe(true);
        });

        it('is valid if the zip code entered contains five digits', function() {
          ngFormCtrl.$fields['user.zip'].$setViewValue('11111');
          expect(ngFormCtrl.$fields['user.zip'].$valid).toBe(true);
        });

        it('is valid if the zip code entered contains nine digits and no hyphen', function() {
          ngFormCtrl.$fields['user.zip'].$setViewValue('111112222');
          expect(ngFormCtrl.$fields['user.zip'].$valid).toBe(true);
        });

        it('is otherwise invalid', function() {
          ngFormCtrl.$fields['user.zip'].$setViewValue('not a zip');
          expect(ngFormCtrl.$fields['user.zip'].$valid).toBe(false);
        });
      });

      describe('acceptance validation', function() {
        it('is valid if the value === true', function() {
          ngFormCtrl.$fields['user.termsOfService'].$setViewValue(true);
          expect(ngFormCtrl.$fields['user.termsOfService'].$valid).toBe(true);
        });

        it('is otherwise invalid', function() {
          ngFormCtrl.$fields['user.termsOfService'].$setViewValue(false);
          expect(ngFormCtrl.$fields['user.termsOfService'].$valid).toBe(false);
        });
      });

      describe('confirmation validation', function() {
        it('is invalid if both fields do not match', function() {
          ngFormCtrl.$fields['user.password'].$setViewValue('myPassword');
          expect(ngFormCtrl.$fields['user.password'].$valid).toBe(false);
        });

        it('is valid if both fields match', function() {
          ngFormCtrl.$fields['user.passwordConfirmation'].$setViewValue('myPassword');
          ngFormCtrl.$fields['user.password'].$setViewValue('myPassword');
          expect(ngFormCtrl.$fields['user.password'].$valid).toBe(true);
        });
      });

      describe('inclusion validation', function() {
        beforeEach(function() {
          parentScope.user = {
            size: '',
            validates: {
              size: { inclusion: { in: ["small", "medium", "large"] } }
            }
          };

          html =  '<form for="user">' +
                  '<input ng-model="user.size">' +
                '</form>';

          element          = $compile(html)($scope);

          ngFormCtrl       = element.controller('form');
        });

        it('is valid if the value is included in the list of terms', function() {
          ngFormCtrl.$fields['user.size'].$setViewValue('small');
          expect(ngFormCtrl.$fields['user.size'].$valid).toBe(true);
        });

        it('is invalid if the value is not included in the list of terms', function() {
          ngFormCtrl.$fields['user.size'].$setViewValue('hefty');
          expect(ngFormCtrl.$fields['user.size'].$valid).toBe(false);
        });
      });

      describe('exclusion validation', function() {
        beforeEach(function() {
          parentScope.user = {
            size: '',
            validates: {
              size: { exclusion: { from: ["XL", "XXL", "XXL"] } }
            }
          };

          html =  '<form for="user">' +
                    '<input ng-model="user.size">' +
                  '</form>';

          element          = $compile(html)($scope);

          ngFormCtrl       = element.controller('form');
        });

        it('is valid if the value is NOT in the list of terms', function() {
          ngFormCtrl.$fields['user.size'].$setViewValue('small');
          expect(ngFormCtrl.$fields['user.size'].$valid).toBe(true);
        });

        it('is invalid if the value is in the list of terms', function() {
          ngFormCtrl.$fields['user.size'].$setViewValue('XL');
          expect(ngFormCtrl.$fields['user.size'].$valid).toBe(false);
        });
      });


      describe('length validators', function() {
        describe('length in validation', function() {
          
          // Length in _.range(1, 10)
          
          it('is invalid if the length is not within the given range', function() {
            ngFormCtrl.$fields['user.username'].$setViewValue('abcdefghijk');
            expect(ngFormCtrl.$fields['user.username'].$valid).toBe(false);
          });

          it('is valid if the length is within the given range', function() {
            ngFormCtrl.$fields['user.username'].$setViewValue('username');
            expect(ngFormCtrl.$fields['user.username'].$valid).toBe(true);
          });
        });

        describe('length min & max', function() {
          beforeEach(function() {
            parentScope.user = {
              username: '',
              validates: {
                username: { presence: true, length: { min: 1, max: 10 } }
              }
            };

            html             =  '<form for="user">' +
                                  '<input ng-model="user.username">' +
                                '</form>';

            element          = $compile(html)($scope);

            ngFormCtrl       = element.controller('form');
          });

          it('is invalid if the value is less than min', function() {
            ngFormCtrl.$fields['user.username'].$setViewValue(null);
            expect(ngFormCtrl.$fields['user.username'].$valid).toBe(false);
          });

          it('is invalid if the value is greater than max', function() {
            ngFormCtrl.$fields['user.username'].$setViewValue('abcdefghijk');
            expect(ngFormCtrl.$fields['user.username'].$valid).toBe(false);
          });

          it('is valid if the value is at least min and not more than max', function() {
            ngFormCtrl.$fields['user.username'].$setViewValue('a');
            expect(ngFormCtrl.$fields['user.username'].$valid).toBe(true);
          });

          it('is valid if the value is at most max', function() {
            ngFormCtrl.$fields['user.username'].$setViewValue('abcdefghi');
            expect(ngFormCtrl.$fields['user.username'].$valid).toBe(true);
          });
        });

        describe('length is validation', function() {
          beforeEach(function() {
            parentScope.user = {
              username: '',
              validates: {
                username: { presence: true, length: { is: 6 } }
              }
            };

            html             =  '<form for="user">' +
                                  '<input ng-model="user.username">' +
                                '</form>';

            element          = $compile(html)($scope);

            ngFormCtrl       = element.controller('form');
          });

          it('is invalid if the length is not exactly equal to the specified number', function() {
            ngFormCtrl.$fields['user.username'].$setViewValue('abc');
            expect(ngFormCtrl.$fields['user.username'].$valid).toBe(false);
          });

          it('is valid if the length is exactly equal to the specified number', function() {
            ngFormCtrl.$fields['user.username'].$setViewValue('abcdef');
            expect(ngFormCtrl.$fields['user.username'].$valid).toBe(true);
          });
        });
      });

      describe('numericality validation', function() {
        beforeEach(function() {
          parentScope.user = {
            orderNumber: '',
            validates: {
              orderNumber: { presence: true, numericality: true }
            }
          };

          html             =  '<form for="user">' +
                                '<input ng-model="user.orderNumber">' +
                            '</form>';

          element          = $compile(html)($scope);

          ngFormCtrl       = element.controller('form');
        });

        it('is invalid if the value entered is not a number', function() {
          ngFormCtrl.$fields['user.orderNumber'].$setViewValue('abc');
          expect(ngFormCtrl.$fields['user.orderNumber'].$valid).toBe(false);
        });

        it('is valid if the value entered is a number', function() {
          ngFormCtrl.$fields['user.orderNumber'].$setViewValue('1111');
          expect(ngFormCtrl.$fields['user.orderNumber'].$valid).toBe(true);
        });

        it('is valid if the value entered contains a single decimal', function() {
          ngFormCtrl.$fields['user.orderNumber'].$setViewValue('1.111');
          expect(ngFormCtrl.$fields['user.orderNumber'].$valid).toBe(true);
        });

        it('is invalid if the value entered contains multiple decimals', function() {
          ngFormCtrl.$fields['user.orderNumber'].$setViewValue('1.11.1');
          expect(ngFormCtrl.$fields['user.orderNumber'].$valid).toBe(false);
        });

        it('is invalid (by default) if commas are present', function() {
          ngFormCtrl.$fields['user.orderNumber'].$setViewValue('1,111');
          expect(ngFormCtrl.$fields['user.orderNumber'].$valid).toBe(false);
        });

        it('is invalid (by default) if hyphens are present', function() {
          ngFormCtrl.$fields['user.orderNumber'].$setViewValue('555-867-5309');
          expect(ngFormCtrl.$fields['user.orderNumber'].$valid).toBe(false);
        });

        describe('numericality ignore', function() {
          beforeEach(function() {
            parentScope.user = {
              orderNumber: '',
              validates: {
                orderNumber: { presence: true, numericality: { ignore: /[\-\,]/g } }
              }
            };

            html             =  '<form for="user">' +
                                  '<input ng-model="user.orderNumber">' +
                                '</form>';

            element          = $compile(html)($scope);

            ngFormCtrl       = element.controller('form');
          });

          it('will ignore any value it is told to ignore', function() {
            ngFormCtrl.$fields['user.orderNumber'].$setViewValue('1-111-00-11');
            expect(ngFormCtrl.$fields['user.orderNumber'].$valid).toBe(true);
          });
        });
      });

      describe('absence validation', function() {
        beforeEach(function() {
          parentScope.user = {
            badField: '',
            validates: {
              badField: { absence: true }
            }
          };

          html             =  '<form for="user">' +
                                '<input ng-model="user.badField">' +
                            '</form>';

          element          = $compile(html)($scope);

          ngFormCtrl       = element.controller('form');
        });

        it('is invalid if a view value is set', function() {
          ngFormCtrl.$fields['user.badField'].$setViewValue('something');
          expect(ngFormCtrl.$fields['user.badField'].$valid).toBe(false);
        });

        it('is valid if no value is set', function() {
          ngFormCtrl.$fields['user.badField'].$setViewValue(null);
          expect(ngFormCtrl.$fields['user.badField'].$valid).toBe(true);
        });
      });

      describe('uniqueness validation', function() {
        beforeEach(function() {
          parentScope.user = {
            username: '',
            validates: {
              username: { uniqueness: true }
            },
            all: function() {
              return [
              {
                username: 'brettcassette'
              },
              {
                username: 'brettshollenberger'
              }];
            }
          };

          html             =  '<form for="user">' +
                                '<input ng-model="user.username">' +
                              '</form>';

          element          = $compile(html)($scope);

          ngFormCtrl       = element.controller('form');
        });

        it('is invalid if the field is set to a value that is already taken', function() {
          ngFormCtrl.$fields['user.username'].$setViewValue('brettcassette');
          expect(ngFormCtrl.$fields['user.username'].$valid).toBe(false);
        });

        it('is valid if the field is set to a value that is not already taken', function() {
          ngFormCtrl.$fields['user.username'].$setViewValue('androidgeoff');
          expect(ngFormCtrl.$fields['user.username'].$valid).toBe(true);
        });
      });
    });

    describe('custom validations', function() {

      it('accepts custom validations', function() {
        expect(element.html().match(/validates="presence,zip"/)).not.toBeNull();
      });
      
      it('validates a custom format using FORMAT: REGEX', function() {
        parentScope.user = {
          orderNumber: '',
          validates: {
            orderNumber: { format: { regex: /\d{3}\w{2}\d{3}/ } }
          }
        };

        html =  '<form for="user">' +
                  '<input ng-model="user.orderNumber">' +
              '</form>';

        element          = $compile(html)($scope);

        ngFormCtrl       = element.controller('form');
        ngFormCtrl.$fields['user.orderNumber'].$setViewValue('123ab456');
        expect(ngFormCtrl.$fields['user.orderNumber'].$valid).toBe(true);
      });

      it('parses true/false validation evaluations into $parser functions', function() {
        ngFormCtrl.$fields['user.zip'].$setViewValue('11111-1111');
        expect(ngFormCtrl.$fields['user.zip'].$valid).toEqual(true);
      });

      it('sets custom validations to false when they fail', function() {
        ngFormCtrl.$fields['user.zip'].$setViewValue('abcdefg');
        expect(ngFormCtrl.$fields['user.zip'].$valid).toEqual(false);
      });

      it('adds ng-valid css class to inputs when valid', function() {
        ngFormCtrl.$fields['user.zip'].$setViewValue('11111-1111');
        expect(element.html().match(/ng-valid/)).not.toBeNull();
      });

      it('adds ng-invalid css class to inputs when invalid', function() {
        ngFormCtrl.$fields['user.zip'].$setViewValue('abcdefg');
        expect(element.html().match(/ng-invalid/)).not.toBeNull();
      });

      it('adds ng-valid-NAME css class, indicating the passing validation', function() {
        ngFormCtrl.$fields['user.zip'].$setViewValue('11111-1111');
        expect(element.html().match(/ng-valid-zip/)).not.toBeNull();
      });

      it('adds ng-invalid-NAME css class, indicating the failing validation', function() {
        ngFormCtrl.$fields['user.zip'].$setViewValue('abcdefg');
        expect(element.html().match(/ng-invalid-zip/)).not.toBeNull();
      });
    });
  });
});
