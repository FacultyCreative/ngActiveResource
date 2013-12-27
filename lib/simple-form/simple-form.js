var simpleForm = angular.module('simpleForm', ['ActiveResource']);

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

simpleForm.directive('ngModel', ['$compile', 
    function($compile) {

  return {
    restrict: 'A',
    require: ['^ngModel', '^form'],
    compile: function() {
      return {
        post: function(scope, element, attrs, ctrls) {
          var $model,
          modelCtrl            = ctrls[0],
          formCtrl             = ctrls[1] || nullFormCtrl;
          modelCtrl.$name      = attrs.name || attrs.ngModel || 'unnamedInput',
          $modelname           = attrs.ngModel.replace(/\.\w{0,}/g, ''),

          scope.$watch($modelname, function(model) {
            $model               = model;
            if (!$model) return;
            fieldNames           = _.without(Object.getOwnPropertyNames($model),
                                    'validate', '$valid', '$invalid', '$errors', 'validateIfErrored');

            var originalValidate = angular.copy($model.validate);

            $model.validate      = function(fieldToValidate) {
              var nameOfFieldNgModelIsOn = attrs.ngModel.replace(/\w{0,}\./, '');
              originalValidate.call($model, fieldToValidate);
              setValid(nameOfFieldNgModelIsOn);
              setInvalid(nameOfFieldNgModelIsOn);
              return Object.keys($model.$errors).length === 0;
            };

            function setInvalid(nameOfField) {
              if ($model.$errors[nameOfField]) modelCtrl.$setValidity(nameOfField, false);
            };

            function setValid(nameOfField) {
              if (!$model.$errors[nameOfField]) modelCtrl.$setValidity(nameOfField, true);
            };
          });
          
        }
      };
    }
  };
}]);

