import FluxEasy from 'flux-easy';
import loginStore from './login.store';

class WelcomeView extends FluxEasy.View {

  render() {
            return ( < div >
            } > Login < /button> < /div >
        );
    }
    onClick () {
        var user = this.state.username;
        var pass = this.state.password;
        await login.autentication(user, pass);
        if (login.nome != null)
            app.show('./welcome');
    }

}
