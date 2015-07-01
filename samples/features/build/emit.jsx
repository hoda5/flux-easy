var Store1 = {
    createStoreReference: function createStoreReference(dispatcher) {
        if (!Store1.__instance)
            createStoreInstance();

        var ref = {
            _onEvent: [],

            releaseStoreReference: function releaseStoreReference() {
                if (Store1.__dependents.length == 1 && Store1.__dependents[0] == ref)
                    destroyStoreInstance();
                else {
                    var i = Store1.__dependents.indexOf(ref);
                    Store1.__dependents.splice(i, 1);
                }
            },

            getState: function() {
                return Store1.__state;
            },

            dispatchTokens: Store1.__dispatchTokens,

            addEventListener: function(event, listener) {
                var e = ref["_on" + event];

                if (!e)
                    throw new Error("Invalid event: " + event);

                e.push(listener);
            },

            removeEventListener: function(event, listener) {
                var e = ref["_on" + event];

                if (!e)
                    throw new Error("Invalid event: " + event);

                var i = e.indexOf(listener);

                if (i >= 0)
                    e.splice(i, 1);
            },

            action1: Store1.__instance.action1.bind(Store1.__instance)
        };

        Store1.__dependents.push(ref);
        return ref;

        function createStoreInstance() {
            Store1.__dependents = [];

            Store1.__instance = {
                getInitialState: function getInitialState() {
                    var state = {
                        x: 1
                    };

                    return state;
                },

                action1: function() {
                    Store1.__dependents.forEach(function(r) {
                        r._onEvent.forEach(Store1.__emitter);
                    });;

                    Store1.__dependents.forEach(function (r) {
                        r._onEvent.forEach(Store1.__emitter);
                    });;


                }
            };

            Store1.__state = Store1.__instance.getInitialState();
            Store1.__dispatchTokens = {};

            if (dispatcher.emitter)
                Store1.__emitter = dispatcher.emmiter;
            else Store1.__emitter = function(fn, e) {
                fn(e);
            };
        }

        function destroyStoreInstance() {
            delete Store1.__dispatchTokens;
            delete Store1.__state;
            delete Store1.__emitter;
            delete Store1.__instance;
            delete Store1.__dependents;
        }
    }
};

var Store2 = {
    createStoreReference: function createStoreReference(dispatcher) {
        if (!Store2.__instance)
            createStoreInstance();

        var ref = {
            _onTeste: [],
            _onEvent: [],

            releaseStoreReference: function releaseStoreReference() {
                if (Store2.__dependents.length == 1 && Store2.__dependents[0] == ref)
                    destroyStoreInstance();
                else {
                    var i = Store2.__dependents.indexOf(ref);
                    Store2.__dependents.splice(i, 1);
                }
            },

            getState: function() {
                return Store2.__state;
            },

            dispatchTokens: Store2.__dispatchTokens,

            addEventListener: function(event, listener) {
                var e = ref["_on" + event];

                if (!e)
                    throw new Error("Invalid event: " + event);

                e.push(listener);
            },

            removeEventListener: function(event, listener) {
                var e = ref["_on" + event];

                if (!e)
                    throw new Error("Invalid event: " + event);

                var i = e.indexOf(listener);

                if (i >= 0)
                    e.splice(i, 1);
            },

            action2: Store2.__instance.action2.bind(Store2.__instance)
        };

        Store2.__dependents.push(ref);
        return ref;

        function createStoreInstance() {
            Store2.__dependents = [];

            Store2.__instance = {
                getInitialState: function getInitialState() {
                    var state = {
                        x: 1
                    };

                    return state;
                },

                action2: function() {
                    Store2.__dependents.forEach(function(r) {
                        r._onTeste.forEach(Store2.__emitter);
                    });;
                    Store1.__dependents.forEach(function(r) {
                        r._onEvent.forEach(Store1.__emitter);
                    });;
                    //
                    //        Store1.__dependents.forEach(function(r) {
                    //                        r._onEvent.forEach(Store1.__emitter);
                    //                    });;

                }
            };

            Store2.__state = Store2.__instance.getInitialState();
            Store2.__dispatchTokens = {};

            if (dispatcher.emitter)
                Store2.__emitter = dispatcher.emmiter;
            else Store2.__emitter = function(fn, e) {
                fn(e);
            };
        }

        function destroyStoreInstance() {
            delete Store2.__dispatchTokens;
            delete Store2.__state;
            delete Store2.__emitter;
            delete Store2.__instance;
            delete Store2.__dependents;
        }
    }
};

var dispatcher = new Flux.Dispatcher();
var ref1 = Store1.createStoreReference(dispatcher);
var ref2 = Store2.createStoreReference(dispatcher);
ref2.action2();
