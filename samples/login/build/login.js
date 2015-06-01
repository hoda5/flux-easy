"use strict";

var LoginStore = {
    createStoreReference: function createStoreReference(dispatcher) {
        if (!LoginStore.__instance) createStoreInstance();

        var ref = {
            _onLoggedIn: [],
            _onLoginError: [],
            _onLoggedOut: [],

            releaseStoreReference: function releaseStoreReference() {
                if (LoginStore.__dependents.length == 1 && LoginStore.__dependents[0] == ref) destroyStoreInstance();else {
                    var i = LoginStore.__dependents.indexOf(ref);
                    LoginStore.__dependents.splice(i, 1);
                }
            },

            getState: function getState() {
                return LoginStore.__state;
            },

            dispatchTokens: LoginStore.__dispatchTokens,

            addEventListener: function addEventListener(event, listener) {
                var e = ref["_on" + event];

                if (!e) throw new Error("Invalid event: " + event);

                e.push(listener);
            },

            removeEventListener: function removeEventListener(event, listener) {
                var e = ref["_on" + event];

                if (!e) throw new Error("Invalid event: " + event);

                var i = e.indexOf(listener);

                if (i >= 0) e.splice(i, 1);
            },

            getLoggedUser: LoginStore.__instance.getLoggedUser.bind(LoginStore.__instance),

            checkWindowLocationHash: function checkWindowLocationHash_dispatch() {
                dispatcher.dispatch({
                    action: "LoginStore_checkWindowLocationHash"
                });
            },

            login: function login_dispatch(name, password) {
                dispatcher.dispatch({
                    action: "LoginStore_login",
                    arg_name: name,
                    arg_password: password
                });
            },

            logout: function logout_dispatch() {
                dispatcher.dispatch({
                    action: "LoginStore_logout"
                });
            }
        };

        LoginStore.__dependents.push(ref);
        return ref;

        function createStoreInstance() {
            LoginStore.__dependents = [];

            LoginStore.__instance = {
                getInitialState: function getInitialState() {
                    var state = {
                        logged_user: null
                    };

                    this.checkWindowLocationHash();
                    return state;
                },

                getLoggedUser: function getLoggedUser() {
                    return LoginStore.__state.logged_user;
                },

                checkWindowLocationHash: function checkWindowLocationHash() {
                    if (window.location.hash) {
                        LoginStore.__state.logged_user = window.location.hash;
                        LoginStore.__dependents.forEach(function (r) {
                            r._onLoggedIn.forEach(LoginStore.__emitter);
                        });;
                    }
                },

                login: function login(name, password) {
                    if (name != "" && password == "123") {
                        LoginStore.__state.logged_user = name;
                        LoginStore.__dependents.forEach(function ($ref) {
                            $ref._onLoggedIn.forEach(function ($event) {
                                LoginStore.__emitter($event, {
                                    name: name
                                });
                            });
                        });;
                    } else LoginStore.__dependents.forEach(function (r) {
                        r._onLoginError.forEach(LoginStore.__emitter);
                    });;
                },

                logout: function logout() {
                    LoginStore.__state.logged_user = null;
                    LoginStore.__dependents.forEach(function (r) {
                        r._onLoggedOut.forEach(LoginStore.__emitter);
                    });;
                }
            };

            LoginStore.__state = LoginStore.__instance.getInitialState();

            LoginStore.__dispatchTokens = {
                checkWindowLocationHash: dispatcher.register(function (payload) {
                    if (payload.action === "LoginStore_checkWindowLocationHash") LoginStore.__instance.checkWindowLocationHash.call(LoginStore.__instance);
                }),

                login: dispatcher.register(function (payload) {
                    if (payload.action === "LoginStore_login") LoginStore.__instance.login.call(LoginStore.__instance, payload.arg_name, payload.arg_password);
                }),

                logout: dispatcher.register(function (payload) {
                    if (payload.action === "LoginStore_logout") LoginStore.__instance.logout.call(LoginStore.__instance);
                })
            };

            if (dispatcher.emitter) LoginStore.__emitter = dispatcher.emmiter;else LoginStore.__emitter = function (fn, e) {
                fn(e);
            };
        }

        function destroyStoreInstance() {
            dispatcher.unregister(LoginStore.__dispatchTokens.checkWindowLocationHash);
            dispatcher.unregister(LoginStore.__dispatchTokens.login);
            dispatcher.unregister(LoginStore.__dispatchTokens.logout);
            delete LoginStore.__dispatchTokens;
            delete LoginStore.__state;
            delete LoginStore.__emitter;
            delete LoginStore.__instance;
            delete LoginStore.__dependents;
        }
    }
};

var LoginView = {
    createViewReference: function createViewReference(dispatcher) {
        if (!LoginView.__instance) createViewInstance();

        var ref = {
            releaseViewReference: function releaseViewReference() {
                if (LoginView.__dependents.length == 1 && LoginView.__dependents[0] == ref) destroyViewInstance();else {
                    var i = LoginView.__dependents.indexOf(ref);
                    LoginView.__dependents.splice(i, 1);
                }
            },

            Class: LoginView.__instance
        };

        LoginView.__dependents.push(ref);
        return ref;

        function createViewInstance() {
            LoginView.__dependents = [];

            LoginView.__requires = {
                loginStore: LoginStore.createStoreReference(dispatcher)
            };

            LoginView.__instance = React.createClass({
                displayName: "__instance",

                loginStore: LoginView.__requires.loginStore,

                getInitialState: function getInitialState() {
                    var state = {
                        username: "",
                        password: "123"
                    };

                    this.loginStore.addEventListener("LoggedIn", this.refreshView);
                    this.loginStore.addEventListener("LoggedOut", this.refreshView);
                    return state;
                },

                render: function render() {
                    var valueLink_username = {
                        value: this.state.username,
                        requestChange: this.valueLink_username_change
                    },
                        valueLink_password = {
                        value: this.state.password,
                        requestChange: this.valueLink_password_change
                    };

                    var store = this.loginStore.getState();
                    if (store.logged_user) return React.createElement(
                        "div",
                        null,
                        "Hello ",
                        store.logged_user,
                        React.createElement(
                            "button",
                            { onClick: this.logout },
                            "Logout"
                        )
                    );else return React.createElement(
                        "div",
                        null,
                        React.createElement("input", { type: "text", placeholder: "Digite o usuário",
                            valueLink: valueLink_username }),
                        React.createElement("input", { type: "password", placeholder: "Digite a senha",
                            valueLink: valueLink_password }),
                        React.createElement(
                            "button",
                            { onClick: this.login },
                            "Login"
                        )
                    );
                },

                refresh: function refresh() {
                    this.setState({});
                },

                login: function login() {
                    var user = this.state.username;
                    var pass = this.state.password;
                    this.loginStore.login(user, pass);
                },

                logout: function logout() {
                    this.loginStore.logout();
                },

                valueLink_username_change: function valueLink_username_change(newValue) {
                    this.setState({
                        username: newValue
                    });
                },

                valueLink_password_change: function valueLink_password_change(newValue) {
                    this.setState({
                        password: newValue
                    });
                },

                refreshView: function refreshView() {
                    this.setState({});
                }
            });
        }

        function destroyViewInstance() {
            LoginView.__requires.loginStore.releaseStoreReference();
            delete LoginView.__requires;
            delete LoginView.__instance;
            delete LoginView.__dependents;
        }
    }
};

var dispatcher = new Flux.Dispatcher();
var LoginViewComponent = LoginView.createViewReference(dispatcher).Class;

var l = React.createElement(LoginViewComponent, null);
var a = document.getElementById("app");
React.render(l, a);

//# sourceMappingURL=data:application/json;base64,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U3RvcmUgPSB7XG4gICAgY3JlYXRlU3RvcmVSZWZlcmVuY2U6IGZ1bmN0aW9uIGNyZWF0ZVN0b3JlUmVmZXJlbmNlKGRpc3BhdGNoZXIpIHtcbiAgICAgICAgaWYgKCFMb2dpblN0b3JlLl9faW5zdGFuY2UpXG4gICAgICAgICAgICBjcmVhdGVTdG9yZUluc3RhbmNlKCk7XG5cbiAgICAgICAgdmFyIHJlZiA9IHtcbiAgICAgICAgICAgIF9vbkxvZ2dlZEluOiBbXSxcbiAgICAgICAgICAgIF9vbkxvZ2luRXJyb3I6IFtdLFxuICAgICAgICAgICAgX29uTG9nZ2VkT3V0OiBbXSxcblxuICAgICAgICAgICAgcmVsZWFzZVN0b3JlUmVmZXJlbmNlOiBmdW5jdGlvbiByZWxlYXNlU3RvcmVSZWZlcmVuY2UoKSB7XG4gICAgICAgICAgICAgICAgaWYgKExvZ2luU3RvcmUuX19kZXBlbmRlbnRzLmxlbmd0aCA9PSAxICYmIExvZ2luU3RvcmUuX19kZXBlbmRlbnRzWzBdID09IHJlZilcbiAgICAgICAgICAgICAgICAgICAgZGVzdHJveVN0b3JlSW5zdGFuY2UoKTtcbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGkgPSBMb2dpblN0b3JlLl9fZGVwZW5kZW50cy5pbmRleE9mKHJlZik7XG4gICAgICAgICAgICAgICAgICAgIExvZ2luU3RvcmUuX19kZXBlbmRlbnRzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBnZXRTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIExvZ2luU3RvcmUuX19zdGF0ZTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGRpc3BhdGNoVG9rZW5zOiBMb2dpblN0b3JlLl9fZGlzcGF0Y2hUb2tlbnMsXG5cbiAgICAgICAgICAgIGFkZEV2ZW50TGlzdGVuZXI6IGZ1bmN0aW9uKGV2ZW50LCBsaXN0ZW5lcikge1xuICAgICAgICAgICAgICAgIHZhciBlID0gcmVmW1wiX29uXCIgKyBldmVudF07XG5cbiAgICAgICAgICAgICAgICBpZiAoIWUpXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgZXZlbnQ6IFwiICsgZXZlbnQpO1xuXG4gICAgICAgICAgICAgICAgZS5wdXNoKGxpc3RlbmVyKTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIHJlbW92ZUV2ZW50TGlzdGVuZXI6IGZ1bmN0aW9uKGV2ZW50LCBsaXN0ZW5lcikge1xuICAgICAgICAgICAgICAgIHZhciBlID0gcmVmW1wiX29uXCIgKyBldmVudF07XG5cbiAgICAgICAgICAgICAgICBpZiAoIWUpXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgZXZlbnQ6IFwiICsgZXZlbnQpO1xuXG4gICAgICAgICAgICAgICAgdmFyIGkgPSBlLmluZGV4T2YobGlzdGVuZXIpO1xuXG4gICAgICAgICAgICAgICAgaWYgKGkgPj0gMClcbiAgICAgICAgICAgICAgICAgICAgZS5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBnZXRMb2dnZWRVc2VyOiBMb2dpblN0b3JlLl9faW5zdGFuY2UuZ2V0TG9nZ2VkVXNlci5iaW5kKExvZ2luU3RvcmUuX19pbnN0YW5jZSksXG5cbiAgICAgICAgICAgIGNoZWNrV2luZG93TG9jYXRpb25IYXNoOiBmdW5jdGlvbiBjaGVja1dpbmRvd0xvY2F0aW9uSGFzaF9kaXNwYXRjaCgpIHtcbiAgICAgICAgICAgICAgICBkaXNwYXRjaGVyLmRpc3BhdGNoKHtcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiBcIkxvZ2luU3RvcmVfY2hlY2tXaW5kb3dMb2NhdGlvbkhhc2hcIlxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgbG9naW46IGZ1bmN0aW9uIGxvZ2luX2Rpc3BhdGNoKG5hbWUsIHBhc3N3b3JkKSB7XG4gICAgICAgICAgICAgICAgZGlzcGF0Y2hlci5kaXNwYXRjaCh7XG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbjogXCJMb2dpblN0b3JlX2xvZ2luXCIsXG4gICAgICAgICAgICAgICAgICAgIGFyZ19uYW1lOiBuYW1lLFxuICAgICAgICAgICAgICAgICAgICBhcmdfcGFzc3dvcmQ6IHBhc3N3b3JkXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBsb2dvdXQ6IGZ1bmN0aW9uIGxvZ291dF9kaXNwYXRjaCgpIHtcbiAgICAgICAgICAgICAgICBkaXNwYXRjaGVyLmRpc3BhdGNoKHtcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiBcIkxvZ2luU3RvcmVfbG9nb3V0XCJcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBMb2dpblN0b3JlLl9fZGVwZW5kZW50cy5wdXNoKHJlZik7XG4gICAgICAgIHJldHVybiByZWY7XG5cbiAgICAgICAgZnVuY3Rpb24gY3JlYXRlU3RvcmVJbnN0YW5jZSgpIHtcbiAgICAgICAgICAgIExvZ2luU3RvcmUuX19kZXBlbmRlbnRzID0gW107XG5cbiAgICAgICAgICAgIExvZ2luU3RvcmUuX19pbnN0YW5jZSA9IHtcbiAgICAgICAgICAgICAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uIGdldEluaXRpYWxTdGF0ZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN0YXRlID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9nZ2VkX3VzZXI6IG51bGxcbiAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNoZWNrV2luZG93TG9jYXRpb25IYXNoKCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzdGF0ZTtcbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgZ2V0TG9nZ2VkVXNlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBMb2dpblN0b3JlLl9fc3RhdGUubG9nZ2VkX3VzZXI7XG4gICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgIGNoZWNrV2luZG93TG9jYXRpb25IYXNoOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHdpbmRvdy5sb2NhdGlvbi5oYXNoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBMb2dpblN0b3JlLl9fc3RhdGUubG9nZ2VkX3VzZXIgPSB3aW5kb3cubG9jYXRpb24uaGFzaDtcbiAgICAgICAgICAgICAgICAgICAgICAgIExvZ2luU3RvcmUuX19kZXBlbmRlbnRzLmZvckVhY2goZnVuY3Rpb24ocikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHIuX29uTG9nZ2VkSW4uZm9yRWFjaChMb2dpblN0b3JlLl9fZW1pdHRlcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgbG9naW46IGZ1bmN0aW9uKG5hbWUsIHBhc3N3b3JkKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChuYW1lIT0nJyAmJiBwYXNzd29yZCA9PSAnMTIzJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgTG9naW5TdG9yZS5fX3N0YXRlLmxvZ2dlZF91c2VyID0gbmFtZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIExvZ2luU3RvcmUuX19kZXBlbmRlbnRzLmZvckVhY2goZnVuY3Rpb24oJHJlZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRyZWYuX29uTG9nZ2VkSW4uZm9yRWFjaChmdW5jdGlvbigkZXZlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTG9naW5TdG9yZS5fX2VtaXR0ZXIoJGV2ZW50LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBuYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7O1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIExvZ2luU3RvcmUuX19kZXBlbmRlbnRzLmZvckVhY2goZnVuY3Rpb24ocikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHIuX29uTG9naW5FcnJvci5mb3JFYWNoKExvZ2luU3RvcmUuX19lbWl0dGVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pOztcbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgbG9nb3V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgTG9naW5TdG9yZS5fX3N0YXRlLmxvZ2dlZF91c2VyID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgTG9naW5TdG9yZS5fX2RlcGVuZGVudHMuZm9yRWFjaChmdW5jdGlvbihyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByLl9vbkxvZ2dlZE91dC5mb3JFYWNoKExvZ2luU3RvcmUuX19lbWl0dGVyKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIExvZ2luU3RvcmUuX19zdGF0ZSA9IExvZ2luU3RvcmUuX19pbnN0YW5jZS5nZXRJbml0aWFsU3RhdGUoKTtcblxuICAgICAgICAgICAgTG9naW5TdG9yZS5fX2Rpc3BhdGNoVG9rZW5zID0ge1xuICAgICAgICAgICAgICAgIGNoZWNrV2luZG93TG9jYXRpb25IYXNoOiBkaXNwYXRjaGVyLnJlZ2lzdGVyKGZ1bmN0aW9uKHBheWxvYWQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBheWxvYWQuYWN0aW9uID09PSBcIkxvZ2luU3RvcmVfY2hlY2tXaW5kb3dMb2NhdGlvbkhhc2hcIilcbiAgICAgICAgICAgICAgICAgICAgICAgIExvZ2luU3RvcmUuX19pbnN0YW5jZS5jaGVja1dpbmRvd0xvY2F0aW9uSGFzaC5jYWxsKExvZ2luU3RvcmUuX19pbnN0YW5jZSk7XG4gICAgICAgICAgICAgICAgfSksXG5cbiAgICAgICAgICAgICAgICBsb2dpbjogZGlzcGF0Y2hlci5yZWdpc3RlcihmdW5jdGlvbihwYXlsb2FkKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwYXlsb2FkLmFjdGlvbiA9PT0gXCJMb2dpblN0b3JlX2xvZ2luXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICBMb2dpblN0b3JlLl9faW5zdGFuY2UubG9naW4uY2FsbChMb2dpblN0b3JlLl9faW5zdGFuY2UsIHBheWxvYWQuYXJnX25hbWUsIHBheWxvYWQuYXJnX3Bhc3N3b3JkKTtcbiAgICAgICAgICAgICAgICB9KSxcblxuICAgICAgICAgICAgICAgIGxvZ291dDogZGlzcGF0Y2hlci5yZWdpc3RlcihmdW5jdGlvbihwYXlsb2FkKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwYXlsb2FkLmFjdGlvbiA9PT0gXCJMb2dpblN0b3JlX2xvZ291dFwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgTG9naW5TdG9yZS5fX2luc3RhbmNlLmxvZ291dC5jYWxsKExvZ2luU3RvcmUuX19pbnN0YW5jZSk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmIChkaXNwYXRjaGVyLmVtaXR0ZXIpXG4gICAgICAgICAgICAgICAgTG9naW5TdG9yZS5fX2VtaXR0ZXIgPSBkaXNwYXRjaGVyLmVtbWl0ZXI7XG4gICAgICAgICAgICBlbHNlIExvZ2luU3RvcmUuX19lbWl0dGVyID0gZnVuY3Rpb24oZm4sIGUpIHtcbiAgICAgICAgICAgICAgICBmbihlKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBkZXN0cm95U3RvcmVJbnN0YW5jZSgpIHtcbiAgICAgICAgICAgIGRpc3BhdGNoZXIudW5yZWdpc3RlcihMb2dpblN0b3JlLl9fZGlzcGF0Y2hUb2tlbnMuY2hlY2tXaW5kb3dMb2NhdGlvbkhhc2gpO1xuICAgICAgICAgICAgZGlzcGF0Y2hlci51bnJlZ2lzdGVyKExvZ2luU3RvcmUuX19kaXNwYXRjaFRva2Vucy5sb2dpbik7XG4gICAgICAgICAgICBkaXNwYXRjaGVyLnVucmVnaXN0ZXIoTG9naW5TdG9yZS5fX2Rpc3BhdGNoVG9rZW5zLmxvZ291dCk7XG4gICAgICAgICAgICBkZWxldGUgTG9naW5TdG9yZS5fX2Rpc3BhdGNoVG9rZW5zO1xuICAgICAgICAgICAgZGVsZXRlIExvZ2luU3RvcmUuX19zdGF0ZTtcbiAgICAgICAgICAgIGRlbGV0ZSBMb2dpblN0b3JlLl9fZW1pdHRlcjtcbiAgICAgICAgICAgIGRlbGV0ZSBMb2dpblN0b3JlLl9faW5zdGFuY2U7XG4gICAgICAgICAgICBkZWxldGUgTG9naW5TdG9yZS5fX2RlcGVuZGVudHM7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG52YXIgTG9naW5WaWV3ID0ge1xuICAgIGNyZWF0ZVZpZXdSZWZlcmVuY2U6IGZ1bmN0aW9uIGNyZWF0ZVZpZXdSZWZlcmVuY2UoZGlzcGF0Y2hlcikge1xuICAgICAgICBpZiAoIUxvZ2luVmlldy5fX2luc3RhbmNlKVxuICAgICAgICAgICAgY3JlYXRlVmlld0luc3RhbmNlKCk7XG5cbiAgICAgICAgdmFyIHJlZiA9IHtcbiAgICAgICAgICAgIHJlbGVhc2VWaWV3UmVmZXJlbmNlOiBmdW5jdGlvbiByZWxlYXNlVmlld1JlZmVyZW5jZSgpIHtcbiAgICAgICAgICAgICAgICBpZiAoTG9naW5WaWV3Ll9fZGVwZW5kZW50cy5sZW5ndGggPT0gMSAmJiBMb2dpblZpZXcuX19kZXBlbmRlbnRzWzBdID09IHJlZilcbiAgICAgICAgICAgICAgICAgICAgZGVzdHJveVZpZXdJbnN0YW5jZSgpO1xuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaSA9IExvZ2luVmlldy5fX2RlcGVuZGVudHMuaW5kZXhPZihyZWYpO1xuICAgICAgICAgICAgICAgICAgICBMb2dpblZpZXcuX19kZXBlbmRlbnRzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBDbGFzczogTG9naW5WaWV3Ll9faW5zdGFuY2VcbiAgICAgICAgfTtcblxuICAgICAgICBMb2dpblZpZXcuX19kZXBlbmRlbnRzLnB1c2gocmVmKTtcbiAgICAgICAgcmV0dXJuIHJlZjtcblxuICAgICAgICBmdW5jdGlvbiBjcmVhdGVWaWV3SW5zdGFuY2UoKSB7XG4gICAgICAgICAgICBMb2dpblZpZXcuX19kZXBlbmRlbnRzID0gW107XG5cbiAgICAgICAgICAgIExvZ2luVmlldy5fX3JlcXVpcmVzID0ge1xuICAgICAgICAgICAgICAgIGxvZ2luU3RvcmU6IExvZ2luU3RvcmUuY3JlYXRlU3RvcmVSZWZlcmVuY2UoZGlzcGF0Y2hlcilcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIExvZ2luVmlldy5fX2luc3RhbmNlID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICAgICAgICAgICAgICAgIGxvZ2luU3RvcmU6IExvZ2luVmlldy5fX3JlcXVpcmVzLmxvZ2luU3RvcmUsXG5cbiAgICAgICAgICAgICAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uIGdldEluaXRpYWxTdGF0ZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN0YXRlID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdXNlcm5hbWU6ICcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGFzc3dvcmQ6ICcxMjMnXG4gICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2dpblN0b3JlLmFkZEV2ZW50TGlzdGVuZXIoJ0xvZ2dlZEluJywgdGhpcy5yZWZyZXNoVmlldyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubG9naW5TdG9yZS5hZGRFdmVudExpc3RlbmVyKCdMb2dnZWRPdXQnLCB0aGlzLnJlZnJlc2hWaWV3KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHN0YXRlO1xuICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdmFsdWVMaW5rX3VzZXJuYW1lID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiB0aGlzLnN0YXRlLnVzZXJuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3RDaGFuZ2U6IHRoaXMudmFsdWVMaW5rX3VzZXJuYW1lX2NoYW5nZVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlTGlua19wYXNzd29yZCA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogdGhpcy5zdGF0ZS5wYXNzd29yZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0Q2hhbmdlOiB0aGlzLnZhbHVlTGlua19wYXNzd29yZF9jaGFuZ2VcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIHN0b3JlPXRoaXMubG9naW5TdG9yZS5nZXRTdGF0ZSgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc3RvcmUubG9nZ2VkX3VzZXIpXG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICg8ZGl2PkhlbGxvIHtzdG9yZS5sb2dnZWRfdXNlcn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXt0aGlzLmxvZ291dH0+TG9nb3V0PC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInRleHRcIiBwbGFjZWhvbGRlcj1cIkRpZ2l0ZSBvIHVzdcOhcmlvXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWVMaW5rPXt2YWx1ZUxpbmtfdXNlcm5hbWV9IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicGFzc3dvcmRcIiBwbGFjZWhvbGRlcj1cIkRpZ2l0ZSBhIHNlbmhhXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZUxpbms9e3ZhbHVlTGlua19wYXNzd29yZH0gLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXt0aGlzLmxvZ2lufT5Mb2dpbjwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgIHJlZnJlc2g6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7fSk7XG4gICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgIGxvZ2luOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgIHZhciB1c2VyID0gdGhpcy5zdGF0ZS51c2VybmFtZTtcbiAgICAgICAgICAgICAgICAgIHZhciBwYXNzID0gdGhpcy5zdGF0ZS5wYXNzd29yZDtcbiAgICAgICAgICAgICAgICAgIHRoaXMubG9naW5TdG9yZS5sb2dpbih1c2VyLCBwYXNzKTtcbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgbG9nb3V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMubG9naW5TdG9yZS5sb2dvdXQoKTtcbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgdmFsdWVMaW5rX3VzZXJuYW1lX2NoYW5nZTogZnVuY3Rpb24obmV3VmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICB1c2VybmFtZTogbmV3VmFsdWVcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgIHZhbHVlTGlua19wYXNzd29yZF9jaGFuZ2U6IGZ1bmN0aW9uKG5ld1ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFzc3dvcmQ6IG5ld1ZhbHVlXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICByZWZyZXNoVmlldzogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe30pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZGVzdHJveVZpZXdJbnN0YW5jZSgpIHtcbiAgICAgICAgICAgIExvZ2luVmlldy5fX3JlcXVpcmVzLmxvZ2luU3RvcmUucmVsZWFzZVN0b3JlUmVmZXJlbmNlKCk7XG4gICAgICAgICAgICBkZWxldGUgTG9naW5WaWV3Ll9fcmVxdWlyZXM7XG4gICAgICAgICAgICBkZWxldGUgTG9naW5WaWV3Ll9faW5zdGFuY2U7XG4gICAgICAgICAgICBkZWxldGUgTG9naW5WaWV3Ll9fZGVwZW5kZW50cztcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbnZhciBkaXNwYXRjaGVyPW5ldyBGbHV4LkRpc3BhdGNoZXIoKTtcbnZhciBMb2dpblZpZXdDb21wb25lbnQgPSBMb2dpblZpZXcuY3JlYXRlVmlld1JlZmVyZW5jZShkaXNwYXRjaGVyKS5DbGFzcztcblxudmFyIGw9IDxMb2dpblZpZXdDb21wb25lbnQgLz47XG52YXIgYT1kb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYXBwJyk7XG5SZWFjdC5yZW5kZXIoIGwsYSApO1xuIl19
