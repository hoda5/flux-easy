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
        if (name!='' && password == '123') {
            this.logged_user = name;
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
    this.username='';
    this.password='123';
    this.loginStore.addLoggedInListenner();
    this.loginStore.addLoggedOutListenner();
  }

  render() {
    var store=this.loginStore.getState();
    if (store.logged_user)
      return (<div>Hello {store.logged_user}
          <button onClick={this.logout}>Logout</button>
          </div>
       );
    else
      return (
      <div>
          <input type="text" placeholder="Digite o usuário"
                   valueLink={this.state.username} />
          <input className={''} type="password" placeholder="Digite a senha"
                  valueLink={this.state.password} />
          <button onClick={this.login}>Login</button>
      </div>
      );
  }

  refresh(){
    this.setState({});
  }

  login(){
    var user = this.state.username;
    var pass = this.state.password;
    this.loginStore.login(user, pass);
  }

  logout(){
    this.loginStore.logout();
  }
}

var dispatcher=new Flux.Dispatcher();
var LoginViewComponent = LoginView.createViewReference(dispatcher).Class;

var l= <LoginViewComponent />;
var a=document.getElementById('app')
React.render( l,a );
