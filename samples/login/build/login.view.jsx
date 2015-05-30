import loginStore from './login.store';

function LoginView() {
  var $references, $instance;

  return {
    createViewReference: function addViewReference(dispatcher) {
      if ($references.length == 0)
        createViewInstance(dispatcher);

      var ref = {
        releaseViewReference: function releaseViewReference() {
          if ($references.length == 1 && $references[0] == ref)
            destroyViewInstance();
          else {
            var i = $references.indexOf(ref);
            $references.splice(i, 1);
          }
        }
      };

      $references.push(ref);
      return ref;
    }
  };

  function createViewInstance(dispatcher) {
    $references = [];

    $instance = React.createComponent({
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
        loginStore.autentication(user, pass);
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
    delete $instance;
    delete $references;
  }
}

var component = loginView.constructComponent();

react.Render( <component /> , document.getElementById('app'));
