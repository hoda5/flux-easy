import loginStore from './login.store';

function LoginView() {
  type $StateType = {
    name: string;
    password: string;
  }

  var $references, $state: $StateType, $instance, $dispatchToken;

  return {
    createViewReference: function addViewReference(dispatcher) {
      if ($references.length == 0)
        createViewInstance(dispatcher);

      var ref = {
        getState: function() {
          return $state;
        },

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
    $instance = {
      getInitialState: function getInitialState() {
        var state = {
          name: '',
          password: ''
        };

        return state;
      },

      render: function() {
        return (
          <div>
              <input type="text" name="username" placeholder="Digite o usuário"
                       valueLink={$state.state.username} />
              <input className={''} type="password" name="password" placeholder="Digite a senha"
                      valueLink={$state.state.password} />
              <button onClick={$state.onClick}>Login</button>
          </div>
        );
      },

      onClick: function() {
        var user = $state.state.username;
        var pass = $state.state.password;
        loginStore.autentication(user, pass);
        if (loginStore.nome != null)
          app.show('./welcome');
      }
    };

    $state = $instance.getInitialState();
    $references = [];
  }

  function destroyViewInstance(dispatcher) {
    delete $instance;
    delete $state;
    delete $references;
    delete $dispatchToken;
    delete $emitter;
  }
}

var component = loginView.constructComponent();

react.Render( <component /> , document.getElementById('app'));
