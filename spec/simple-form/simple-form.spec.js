describe('Simple Form', function () {

  var $compile, $rootScope, parentScope, zipValidator, $timeout,
  $scope, html, element, f, ngFormCtrl, User, user, ActiveResource, Mocks;

  beforeEach(module('simpleForm'));
  beforeEach(module('ActiveResource'));
  beforeEach(module('ActiveResource.Mocks'));

  beforeEach(inject(['ActiveResource', 'ActiveResource.Mocks', '$compile', '$rootScope', '$timeout',
      function(_ActiveResource_, _ARMocks_, _$compile_, _$rootScope_, _$timeout_) {
    ActiveResource   = _ActiveResource_;
    Mocks            = _ARMocks_;
    User             = Mocks.User;
    $compile         = _$compile_;
    $rootScope       = _$rootScope_;
    $timeout         = _$timeout_;

    // Simulate a controller scope that ng-model will inherit from
    parentScope      = $rootScope.$new();

    parentScope.user = User.new({
      name: 'Brett',
      username: 'brettcassette',
      email: 'brett.shollenberger@gmail.com',
      zip: '19454',
      uniqueIdentifier: '02140',
      termsOfService: true,
      password: 'awesomesauce',
      passwordConfirmation: 'awesomesauce',
      size: 'small',
      accountBalance: '1111',
      badField: ''
    });

    // When a scope calls $new(), the child scope inherits prototypically
    $scope           = parentScope.$new();

    // Basic HTML use case
    html             = '<form for="user">' +
                          '<input ng-model="user.name">' +
                          '<input ng-model="user.username">' +
                          '<input ng-model="user.email">' +
                          '<input ng-model="user.zip">' +
                          '<input ng-model="user.uniqueIdentifier">' +
                          '<input ng-model="user.termsOfService">' +
                          '<input ng-model="user.password">' +
                          '<input ng-model="user.passwordConfirmation">' +
                          '<input ng-model="user.size">' +
                          '<input ng-model="user.accountBalance">' +
                          '<input ng-model="user.badField">' +
                       '</form>';

    // Compile the view and bind to the scope
    element          = $compile(html)($scope);

    ngFormCtrl       = element.controller('form');
    user             = parentScope.user;
    $scope.$digest();
  }]));

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
        user.validate();
        expect(ngFormCtrl.$fields['user.name'].$valid).toBe(false);
      });

    });

    describe('built-in validations', function() {
      describe('presence validation', function() {
        it('is invalid if the field is not filled in', function() {
          ngFormCtrl.$fields['user.name'].$setViewValue(null);
          user.validate();
          expect(ngFormCtrl.$fields['user.name'].$valid).toBe(false);
        });

        it('is valid if the field is filled in', function() {
          ngFormCtrl.$fields['user.name'].$setViewValue('a');
          user.validate();
          expect(ngFormCtrl.$fields['user.name'].$valid).toBe(true);
        });
      });

      describe('email validation', function() {
        it('is invalid if the value is not an email', function() {
          ngFormCtrl.$fields['user.email'].$setViewValue('porky');
          user.validate();
          expect(ngFormCtrl.$fields['user.email'].$valid).toBe(false);
        });

        it('is valid if the value is an email', function() {
          ngFormCtrl.$fields['user.email'].$setViewValue('porky@pig.net');
          user.validate();
          expect(ngFormCtrl.$fields['user.email'].$valid).toBe(true);
        });
      });

      describe('zip validation', function() {
        it('is valid if the zip code entered contains a hyphen', function() {
          ngFormCtrl.$fields['user.zip'].$setViewValue('11111-1111');
          user.validate();
          expect(ngFormCtrl.$fields['user.zip'].$valid).toBe(true);
        });

        it('is valid if the zip code entered contains five digits', function() {
          ngFormCtrl.$fields['user.zip'].$setViewValue('11111');
          user.validate();
          expect(ngFormCtrl.$fields['user.zip'].$valid).toBe(true);
        });

        it('is valid if the zip code entered contains nine digits and no hyphen', function() {
          ngFormCtrl.$fields['user.zip'].$setViewValue('111112222');
          user.validate();
          expect(ngFormCtrl.$fields['user.zip'].$valid).toBe(true);
        });

        it('is otherwise invalid', function() {
          ngFormCtrl.$fields['user.zip'].$setViewValue('not a zip');
          user.validate();
          expect(ngFormCtrl.$fields['user.zip'].$valid).toBe(false);
        });
      });

      describe('acceptance validation', function() {
        it('is valid if the value === true', function() {
          ngFormCtrl.$fields['user.termsOfService'].$setViewValue(true);
          user.validate();
          expect(ngFormCtrl.$fields['user.termsOfService'].$valid).toBe(true);
        });

        it('is otherwise invalid', function() {
          ngFormCtrl.$fields['user.termsOfService'].$setViewValue(false);
          user.validate();
          expect(ngFormCtrl.$fields['user.termsOfService'].$valid).toBe(false);
        });
      });

      describe('confirmation validation', function() {
        it('is invalid if both fields do not match', function() {
          ngFormCtrl.$fields['user.password'].$setViewValue('myPassword');
          user.validate();
          expect(ngFormCtrl.$fields['user.password'].$valid).toBe(false);
        });

        it('is valid if both fields match', function() {
          ngFormCtrl.$fields['user.passwordConfirmation'].$setViewValue('myPassword');
          ngFormCtrl.$fields['user.password'].$setViewValue('myPassword');
          user.validate();
          expect(ngFormCtrl.$fields['user.password'].$valid).toBe(true);
        });
      });

      describe('inclusion validation', function() {
        it('is valid if the value is included in the list of terms', function() {
          ngFormCtrl.$fields['user.size'].$setViewValue('small');
          user.validate();
          expect(ngFormCtrl.$fields['user.size'].$valid).toBe(true);
        });

        it('is invalid if the value is not included in the list of terms', function() {
          ngFormCtrl.$fields['user.size'].$setViewValue('hefty');
          user.validate();
          expect(ngFormCtrl.$fields['user.size'].$valid).toBe(false);
        });
      });

      describe('exclusion validation', function() {
        it('is valid if the value is NOT in the list of terms', function() {
          ngFormCtrl.$fields['user.size'].$setViewValue('small');
          user.validate();
          expect(ngFormCtrl.$fields['user.size'].$valid).toBe(true);
        });

        it('is invalid if the value is in the list of terms', function() {
          ngFormCtrl.$fields['user.size'].$setViewValue('XL');
          user.validate();
          expect(ngFormCtrl.$fields['user.size'].$valid).toBe(false);
        });
      });


      describe('length validators', function() {
        describe('length min & max', function() {
          it('is invalid if the value is less than min', function() {
            ngFormCtrl.$fields['user.username'].$setViewValue(null);
            user.validate();
            expect(ngFormCtrl.$fields['user.username'].$valid).toBe(true);
          });

          it('is invalid if the value is greater than max', function() {
            ngFormCtrl.$fields['user.username'].$setViewValue('abcdefghijklmnopqrstuvwxyz');
            user.validate();
            expect(ngFormCtrl.$fields['user.username'].$valid).toBe(false);
          });

          it('is valid if the value is at least min and not more than max', function() {
            ngFormCtrl.$fields['user.username'].$setViewValue('abcde');
            user.validate();
            expect(ngFormCtrl.$fields['user.username'].$valid).toBe(true);
          });

          it('is valid if the value is at most max', function() {
            ngFormCtrl.$fields['user.username'].$setViewValue('abcdefghijklmnopqrst');
            user.validate();
            expect(ngFormCtrl.$fields['user.username'].$valid).toBe(true);
          });
        });

        describe('length is validation', function() {
          it('is invalid if the length is not exactly equal to the specified number', function() {
            ngFormCtrl.$fields['user.uniqueIdentifier'].$setViewValue(1234);
            user.validate();
            expect(ngFormCtrl.$fields['user.uniqueIdentifier'].$valid).toBe(false);
          });

          it('is valid if the length is exactly equal to the specified number', function() {
            ngFormCtrl.$fields['user.uniqueIdentifier'].$setViewValue('12345');
            user.validate();
            expect(ngFormCtrl.$fields['user.uniqueIdentifier'].$valid).toBe(true);
          });
        });
      });

      describe('numericality validation', function() {
        it('is invalid if the value entered is not a number', function() {
          ngFormCtrl.$fields['user.accountBalance'].$setViewValue('abcde');
          user.validate();
          expect(ngFormCtrl.$fields['user.accountBalance'].$valid).toBe(false);
        });

        it('is valid if the value entered is a number', function() {
          ngFormCtrl.$fields['user.accountBalance'].$setViewValue('11111');
          user.validate();
          expect(ngFormCtrl.$fields['user.accountBalance'].$valid).toBe(true);
        });

        it('is valid if the value entered contains a single decimal', function() {
          ngFormCtrl.$fields['user.accountBalance'].$setViewValue('1.111');
          user.validate();
          expect(ngFormCtrl.$fields['user.accountBalance'].$valid).toBe(true);
        });

       it('is invalid if the value entered contains multiple decimals', function() {
          ngFormCtrl.$fields['user.accountBalance'].$setViewValue('1.11.1');
          user.validate();
          expect(ngFormCtrl.$fields['user.accountBalance'].$valid).toBe(false);
        });

        it('is invalid (by default) if commas are present', function() {
          ngFormCtrl.$fields['user.zip'].$setViewValue('1,111');
          user.validate();
          expect(user.$errors.zip).toContain('Must be a number');
        });

        it('is invalid (by default) if hyphens are present', function() {
          ngFormCtrl.$fields['user.accountBalance'].$setViewValue('555-867-5309');
          user.validate();
          expect(ngFormCtrl.$fields['user.accountBalance'].$valid).toBe(false);
        });

        describe('numericality ignore', function() {
          it('ignored values will not cause the field to be invalid', function() {
            ngFormCtrl.$fields['user.accountBalance'].$setViewValue('1,000,000');
            user.validate();
            expect(ngFormCtrl.$fields['user.accountBalance'].$valid).toBe(true);
          });
        });
      });

      describe('absence validation', function() {
        it('is invalid if a view value is set', function() {
          ngFormCtrl.$fields['user.badField'].$setViewValue('something');
          user.validate();
          expect(ngFormCtrl.$fields['user.badField'].$valid).toBe(false);
        });

        it('is valid if no value is set', function() {
          ngFormCtrl.$fields['user.badField'].$setViewValue(null);
          user.validate();
          expect(ngFormCtrl.$fields['user.badField'].$valid).toBe(true);
        });
      });
    });

    describe('custom validations', function() {
      it('adds ng-valid css class to inputs when valid', function() {
        ngFormCtrl.$fields['user.zip'].$setViewValue('11111-1111');
        user.validate();
        expect(element.html().match(/ng-valid/)).not.toBeNull();
      });

      it('adds ng-invalid css class to inputs when invalid', function() {
        ngFormCtrl.$fields['user.zip'].$setViewValue('abcdefg');
        user.$valid;
        expect(element.html().match(/ng-invalid/)).not.toBeNull();
      });

      it('does not add ng-invalid until validated', function() {
        ngFormCtrl.$fields['user.zip'].$setViewValue('abcedfg');
        expect(element.html().match(/ng-invalid/)).toBeNull();
      });

      it('adds ng-valid-NAME css class, indicating the passing validation', function() {
        ngFormCtrl.$fields['user.zip'].$setViewValue('11111-1111');
        user.validate();
        expect(element.html().match(/ng-valid-zip/)).not.toBeNull();
      });

      it('adds ng-invalid-NAME css class, indicating the failing validation', function() {
        ngFormCtrl.$fields['user.zip'].$setViewValue('abcdefg');
        user.validate();
        expect(element.html().match(/ng-invalid-zip/)).not.toBeNull();
      });
    });

    describe('error stacking', function() {
      it('stacks errors when validating individual fields', function() {
        ngFormCtrl.$fields['user.zip'].$setViewValue('1');
        user.validate('zip');
        ngFormCtrl.$fields['user.name'].$setViewValue('');
        user.validate('name');
        expect(Object.keys(user.$errors).length).toBe(2);
      });
    });
  });
});
