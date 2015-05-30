function LoginStore() {
    type $StateType = {logged_user: string}
    var $references, $state: $StateType, $instance, $dispatchToken;

    return {
        addStoreReference: function addStoreReference(dispatcher) {
            if ($references.length == 0)
                createStoreInstance(dispatcher);

            var ref = {
                getState: function() {
                    return $state;
                },

                releaseStoreReference: function releaseStoreReference() {
                    if ($references.length == 1 && $references[0] == ref)
                        destroyStoreInstance();
                    else {
                        var i = $references.indexOf(ref);
                        $references.splice(i, 1);
                    }
                },

                onLoggedIn: null,
                onLoginError: null,
                onLoggedOut: null,
                getLoggedUser: $instance.getLoggedUser.bind($instance)
            };

            $references.push(ref);
            return ref;
        }
    };

    function createStoreInstance(dispatcher) {
        $instance = {
            getInitialState: function getInitialState() {
                var state = {
                    logged_user: null
                };

                this.checkWindowLocationHash();
                return state;
            },

            getLoggedUser: function() {
                return $state.logged_user;
            },

            checkWindowLocationHash: function() {
                if (window.location.hash) {
                    $state.logged_user = window.location.hash;
                    $references.forEach(function(r) {
                        $emitter(r.onLoggedIn);
                    });;
                }
            },

            login: function(name, password) {
                if (name == 'fluxeasy' && password == '123') {
                    $state.logged_user = 'fluxeasy';
                    $references.forEach(function(r) {
                        $emitter(r.onLoggedIn);
                    });;
                } else
                    $references.forEach(function(r) {
                        $emitter(r.onLoginError);
                    });;
            },

            logout: function() {
                $state.logged_user = null;
                $references.forEach(function(r) {
                    $emitter(r.onLoggedOut);
                });;
            }
        };

        $state = $instance.getInitialState();
        $references = [];

        $dispatchToken = dispatcher.register(function(payload) {
            var fn = $instance[payload.action];

            if (fn)
                fn.apply($instance, payload.args);
        });

        if (dispatcher.emitter)
            $emitter = dispatcher.emmiter;
        else $emitter = function(fn, e) {
            fn(e);
        };
    }

    function destroyStoreInstance(dispatcher) {
        dispatcher.unregister($dispatchToken);
        delete $instance;
        delete $state;
        delete $references;
        delete $dispatchToken;
        delete $emitter;
    }
}
