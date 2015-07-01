import FluxEasy from 'flux-easy';

class Store1 extends FluxEasy.Store {
    constructor() {
        this.state.x = 1;
    }
    action1() {
        this.emit("Event");

        Store1.__dependents.forEach(function (r) {
            r._onEvent.forEach(Store1.__emitter);
        });;


    }
}

class Store2 extends FluxEasy.Store {
    constructor() {
        this.state.x = 1;
    }
    action2() {
        this.emit('Teste');
        Store1.emit("Event");
        //
        //        Store1.__dependents.forEach(function(r) {
        //                        r._onEvent.forEach(Store1.__emitter);
        //                    });;

    }
}

var dispatcher = new Flux.Dispatcher();
var ref1 = Store1.createStoreReference(dispatcher);
var ref2 = Store2.createStoreReference(dispatcher);
ref2.action2();
