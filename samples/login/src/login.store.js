import FluxEasy from 'flux-easy';

class LoginStore extends FluxEasy.Store {

    logged_user: string;

    login(name, password) {
        if (name == 'fe' && password == '123')
            this.logged_user = 'fluxeasy';
        else throw "wrong login";
    }

    logout() {
        state.logged_user = null;
    }
}
