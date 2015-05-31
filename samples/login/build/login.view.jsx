import LoginStore from './login.store';

function LoginView() {
  var $dependents, $instance;

  return {
    createViewReference: function addViewReference(dispatcher) {
      if (!$instance)
        createViewInstance(dispatcher);

      var ref = {
        releaseViewReference: function releaseViewReference() {
          if ($dependents.length == 1 && $dependents[0] == ref)
            destroyViewInstance();
          else {
            var i = $dependents.indexOf(ref);
            $dependents.splice(i, 1);
          }
        }
      };

      $dependents.push(ref);
      return ref;
    }
  };

  function createViewInstance(dispatcher) {
    $dependents = [];

    $instance = React.createComponent({
      loginStore: LoginStore.createReference(),

      getInitialState: function getInitialState() {
        var state = {
          name: '',
          password: ''
        };

        return state;
      },

      render: function() {
        var valueLink_username = {
              value: this.state.username,
              requestChange: this.valueLink_username_change
            },
            valueLink_password = {
              value: this.state.password,
              requestChange: this.valueLink_password_change
            };

        return (
          <div>
              <input type="text" name="username" placeholder="Digite o usuário"
                       valueLink={valueLink_username} />
              <input className={''} type="password" name="password" placeholder="Digite a senha"
                      valueLink={valueLink_password} />
              <button onClick={this.onClick}>Login</button>
          </div>
        );
      },

      onClick: function() {
        var user = this.state.username;
        var pass = this.state.password;
        this.loginStore.autentication(user, pass);
      },

      valueLink_username_change: function(newValue) {
        this.setState({
          username: newValue
        });
      },

      valueLink_password_change: function(newValue) {
        this.setState({
          password: newValue
        });
      }
    });
  }

  function destroyViewInstance(dispatcher) {
    $instance.loginStore.releaseReference();
    delete $instance;
    delete $dependents;
  }
}

var component = loginView.constructComponent();

react.Render( <component /> , document.getElementById('app'));
