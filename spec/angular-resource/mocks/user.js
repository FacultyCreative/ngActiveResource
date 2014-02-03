angular
  .module('ActiveResource.Mocks')
  .provider('User', function() {

    this.$get = ['ActiveResource', function(ActiveResource) {

      function uuid(uuid) {
        return /(^\d{5}$)|(^\d{5}-{0,1}\d{4}$)/.test(uuid);
      };

      uuid.message = 'ist not a unique id';

      function User(data) {
        this.name                 = data.name;
        this.username             = data.username;
        this.email                = data.email;
        this.zip                  = data.zip;
        this.uniqueIdentifier     = data.uniqueIdentifier;
        this.termsOfService       = data.termsOfService;
        this.password             = data.password;
        this.passwordConfirmation = data.passwordConfirmation;
        this.social               = data.social;
        this.socialConfirmation   = data.socialConfirmation;
        this.size                 = data.size;
        this.accountBalance       = data.accountBalance;
        this.badField             = data.badField;
        this.echeck               = data.echeck;
        this.sometimesRequired    = data.sometimesRequired;
        
        if(data.echeck){
            this.echeck.type      = data.echeck.type;
        }
        
        this.validates({
          name:                 { presence: { validates: true, message: 'Must provide name' } },
          username:             { length: { min: 5, max: 20 } },
          email:                { format: { email: true, message: 'Must provide email' } },
          zip:                  { format: { zip: true },
                                  numericality: { ignore: /[\-]/g } },
          uniqueIdentifier:     { uuid: { validates: uuid,
                                          message: 'Invalid uuid' },
                                  numericality: true,
                                  length: { is: 5 }
                                },
          termsOfService:       { acceptance: true },
          password:             { confirmation: true },
          passwordConfirmation: { presence: true },
          social:               { confirmation: true},
          size:                 { inclusion: { in: ['small', 'medium', 'large'] },
                                  exclusion: { from: ['XL', 'XXL'] } },
          accountBalance:       { numericality: { ignore: /[\,]/g } },
          badField:             { absence: true },
          'echeck.type':        { length: {max: 20} },
          sometimesRequired:    { requiredIf: { requiredIf: sizeIsLarge, message: 'Field required if size is large' } }
        });

        function sizeIsLarge(value, field, instance) {
          return instance.size == 'large';
        }
      };

      User = ActiveResource.Base.apply(User);
      User.api.set('http://api.faculty.com');
      return User;
    }];
  });
