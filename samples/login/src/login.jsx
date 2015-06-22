import FluxEasy from 'flux-easy';

class LoginStore extends FluxEasy.Store {

    constructor() {
        this.state.logged_user = null;
        this.checkWindowLocationHash();
    }

    getLoggedUser() {
        return this.state.logged_user;
    }

    checkWindowLocationHash() {
        if (window.location.hash) {
            this.state.logged_user = window.location.hash;
            this.emit('LoggedIn');
        }
    }

    login(name, password) {
         setTimeout(function(){
            this.emit("bla");
            this.state.logged_user = null;

        }.bind(this), 1);
        if (name!='' && password == '123') {
            this.state.logged_user = name;
            this.emit('LoggedIn', {
                name: name
            })
        } else
            this.emit('LoginError')
    }

    logout() {
        this.state.logged_user = null;
        this.emit('LoggedOut')
    }
}

<LoginView>
  <div>
      <input type="text" placeholder="Digite o usuário"
               valueLink={this.state.username} />
      <input type="password" placeholder="Digite a senha"
              valueLink={this.state.password} />
      <button onClick={this.login}>Login</button>
  </div>
  <script>
    {
    function constructor(){
      this.state.username='';
      this.state.password='123';
      LoginView.loginStore= LoginStore.createStoreReference();
      LoginView.loginStore.addEventListener('LoggedIn', this);
      LoginView.loginStore.addEventListener('LoggedOut', this);
      }
    }
  </script>
</LoginView>

/*
class LoginView extends FluxEasy.View {

  constructor(){
    this.username='';
    this.password='123';
    this.loginStore= LoginStore.createStoreReference();
    this.loginStore.addEventListener('LoggedIn', this);
    this.loginStore.addEventListener('LoggedOut', this);
  }

  render() {
    var store=this.loginStore.getState();
    if (store.logged_user)
      return (<div>Hello {store.logged_user}
          <button onClick={this.logout}>Logout</button>
          </div>
       );
       else{
          return (
          <div>
          <input type="text" placeholder="Digite o usuário"
                       valueLink={this.state.username} />
              <input type="password" placeholder="Digite a senha"
                      valueLink={this.state.password} />
              <button onClick={this.login}>Login</button>
          </div>
          );
      }
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
*/

var dispatcher=new Flux.Dispatcher();
var LoginViewComponent = LoginView.createViewReference(dispatcher).Class;

var l= <LoginViewComponent />;
var a=document.getElementById('app')
React.render( l,a );
