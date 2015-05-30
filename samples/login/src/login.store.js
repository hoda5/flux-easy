type EventType = () => void;

import FluxEasy from 'flux-easy';

class LoginStore extends FluxEasy.Store {

    logged_user: string;

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
            this.emit('LoggedIn')
        } else
            this.emit('LoginError')
    }

    logout() {
        this.logged_user = null;
        this.emit('LoggedOut')
    }
}
