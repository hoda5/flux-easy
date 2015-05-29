import FluxEasy from 'flux-easy';
import loginStore from './login.store';

class LoginView extends FluxEasy.View {

  name: string='';
  password: string='';

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
    loginStore.autentication(user, pass);
    if (loginStore.nome != null)
      app.show('./welcome');
  }

}
