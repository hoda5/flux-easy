var Store1 = {
    createStoreReference: function createStoreReference(dispatcher) {
        if (!Store1.__instance)
            createStoreInstance();

        var ref = {
            _onX: [],

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

            x1: Store1.__instance.x1.bind(Store1.__instance),
            x2: Store1.__instance.x2.bind(Store1.__instance),

            X: function X_dispatch() {
                dispatcher.dispatch({
                    action: "Store1_X"
                });
            }
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

                x1: function() {
                    return Store1.__state.x;
                },

                x2: function(v) {
                    Store1.__state.x = v;
                    Store1.__dependents.forEach(function(r) {
                        r._onX.forEach(Store1.__emitter);
                    });;
                },

                X: function() {
                    Store1.__state.x = Store1.__state.x + 1;
                    Store1.__dependents.forEach(function(r) {
                        r._onX.forEach(Store1.__emitter);
                    });;
                }
            };

            Store1.__state = Store1.__instance.getInitialState();

            Store1.__dispatchTokens = {
                X: dispatcher.register(function(payload) {
                    if (payload.action === "Store1_X")
                        Store1.__instance.X.call(Store1.__instance);
                })
            };

            if (dispatcher.emitter)
                Store1.__emitter = dispatcher.emmiter;
            else Store1.__emitter = function(fn, e) {
                fn(e);
            };
        }

        function destroyStoreInstance() {
            dispatcher.unregister(Store1.__dispatchTokens.X);
            delete Store1.__dispatchTokens;
            delete Store1.__state;
            delete Store1.__emitter;
            delete Store1.__instance;
            delete Store1.__dependents;
        }
    }
};
