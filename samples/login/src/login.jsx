import FluxEasy from 'flux-easy';

class LoginStore extends FluxEasy.Store {

    constructor() {
        this.logged_user = null;
        this.checkWindowLocationHash();
    }

    getLoggedUser() {
        return this.logged_user;
    }

    checkWindowLocationHash() {
        if (window.location.hash) {
            this.logged_user = window.location.hash;
            this.emit('LoggedIn');
        }
    }

    login(name, password) {
        if (name == 'fluxeasy' && password == '123') {
            this.logged_user = 'fluxeasy';
            this.emit('LoggedIn', {
                name: name
            })
        } else
            this.emit('LoginError')
    }

    logout() {
        this.logged_user = null;
        this.emit('LoggedOut')
    }
}

class LoginView extends FluxEasy.View {

  constructor(){
    this.loginStore= LoginStore.createStoreReference();
    this.name='';
    this.password='';
  }

  render() {
    return (
      <div>
          <input type="text" name="username" placeholder="Digite o usuário"
                   valueLink={this.state.username} />
          <input className={''} type="password" name="password" placeholder="Digite a senha"
                  valueLink={this.state.password} />
          <button onClick={this.onClick}>Login</button>
      </div>
    );
  }

  onClick(){
    var user = this.state.username;
    var pass = this.state.password;
    this.loginStore.autentication(user, pass);
  }
}

var dispatcher=new Flux.Dispatcher();
var LoginViewComponent = LoginView.createViewReference(dispatcher).Class;

var l= <LoginViewComponent />;
var a=document.getElementById('app')
React.Render( l,a );
