import FluxEasy from 'flux-easy';

class Store1 extends FluxEasy.Store {
    constructor() {
        this.state.x = 1;
    }
    X() {
        this.state.x = this.state.x + 1;
        this.emit('X');
    }
    get x1() {
        return this.state.x;
    }
    set x2(v) {
        this.state.x = v;
        this.emit('X');
    }
}
