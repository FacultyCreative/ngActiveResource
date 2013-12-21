angular
  .module('ActiveResource.Mocks')
  .provider('User', function() {

    this.$get = ['ActiveResource', function(ActiveResource) {

      function uuid(uuid) {
        if(!uuid) return true;
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
        this.size                 = data.size;
        this.validates = {
          name:                 { presence: { validates: true, message: 'Must provide name' } },
          username:             { presence: true, 
                                  length: { min: 5, max: 20 } },
          email:                { presence: true, format: { email: true } },
          zip:                  { format: { zip: true },
                                  numericality: { ignore: /[\-]/g } },
          uniqueIdentifier:     { presence: true, 
                                  uuid: { validates: uuid,
                                          message: 'Invalid uuid' },
                                  numericality: true,
                                  length: { is: 5 }
                                },
          termsOfService:       { acceptance: true },
          password:             { confirmation: true },
          passwordConfirmation: { presence: true },
          size:                 { inclusion: { in: ['small', 'medium', 'large'] },
                                  exclusion: { from: ['XL', 'XXL'] } }
        }
      }

      User = ActiveResource.Base.apply(User);
      User.api.set('http://api.faculty.com');
      return User;
    }];
  });
