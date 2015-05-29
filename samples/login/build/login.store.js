function LoginStore() {
    type $StateType = {
        logged_user: string
    }
    var $references, $state: $StateType, $instance, $dispatchToken;

    return {
        addStoreReference: function addStoreReference(dispatcher) {
            if ($references.length == 0)
                createStoreInstance(dispatcher);

            var ref = {
                getState: function () {
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

            getLoggedUser: function () {
                return $state.logged_user;
            },

            checkWindowLocationHash: function () {
                if (window.location.hash) {
                    $state.logged_user = window.location.hash;
                    $references.onLoggedIn.forEach($emitter);;
                }
            },

            login: function (name, password) {
                if (name == 'fluxeasy' && password == '123')
                    $state.logged_user = 'fluxeasy';
                else throw "wrong login";
                $onLoggedIn.forEach($emitter);
            },

            logout: function () {
                $state.logged_user = null;
                $event.LoggedOut ');
            }
        };

        $state = $instance.getInitialState();
        $references = [];

        $dispatchToken = dispatcher.register(function (payload) {
            var fn = $instance[payload.action];

            if (fn)
                fn.apply($instance, payload.args);
        });

        if (dispatcher.emitter)
            $emitter = dispatcher.emmiter;
        else $emitter = function (fn, e) {
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
