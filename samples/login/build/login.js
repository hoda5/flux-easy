var LoginStore = {
    createStoreReference: function createStoreReference(dispatcher) {
        if (!LoginStore.__instance)
            createStoreInstance();

        var ref = {
            _onLoggedIn: [],
            _onBla: [],
            _onLoginError: [],
            _onLoggedOut: [],

            releaseStoreReference: function releaseStoreReference() {
                if (LoginStore.__dependents.length == 1 && LoginStore.__dependents[0] == ref)
                    destroyStoreInstance();
                else {
                    var i = LoginStore.__dependents.indexOf(ref);
                    LoginStore.__dependents.splice(i, 1);
                }
            },

            getState: function () {
                return LoginStore.__state;
            },

            dispatchTokens: LoginStore.__dispatchTokens,

            addEventListener: function (event, listener) {
                var e = ref["_on" + event];

                if (!e)
                    throw new Error("Invalid event: " + event);

                e.push(listener);
            },

            removeEventListener: function (event, listener) {
                var e = ref["_on" + event];

                if (!e)
                    throw new Error("Invalid event: " + event);

                var i = e.indexOf(listener);

                if (i >= 0)
                    e.splice(i, 1);
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
                x: {
                    alguma: 1
                },

                getInitialState: function getInitialState() {
                    var state = {
                        logged_user: null
                    };

                    this.checkWindowLocationHash();
                    LoginStore.__state.logged_user.trim();



                    return state;
                },

                getLoggedUser: function () {
                    return LoginStore.__state.logged_user;
                },

                checkWindowLocationHash: function () {
                    if (window.location.hash) {
                        LoginStore.__state.logged_user = window.location.hash;
                        LoginStore.__dependents.forEach(function (r) {
                            r._onLoggedIn.forEach(LoginStore.__emitter);
                        });;
                    }
                },

                login: function (name, password) {
                    setTimeout(function () {
                        LoginStore.__dependents.forEach(function (r) {
                            r._onBla.forEach(LoginStore.__emitter);
                        });;
                        LoginStore.__state.logged_user = null;

                    }.bind(this), 1);
                    if (name != '' && password == '123') {
                        LoginStore.__state.logged_user = name;
                        LoginStore.__dependents.forEach(function ($ref) {
                            $ref._onLoggedIn.forEach(function ($event) {
                                LoginStore.__emitter($event, {
                                    name: name
                                });
                            });
                        });;
                    } else
                        LoginStore.__dependents.forEach(function (r) {
                            r._onLoginError.forEach(LoginStore.__emitter);
                        });;
                },

                logout: function () {
                    LoginStore.__state.logged_user = null;
                    LoginStore.__dependents.forEach(function (r) {
                        r._onLoggedOut.forEach(LoginStore.__emitter);
                    });;
                }
            };

            LoginStore.__state = LoginStore.__instance.getInitialState();

            LoginStore.__dispatchTokens = {
                checkWindowLocationHash: dispatcher.register(function (payload) {
                    if (payload.action === "LoginStore_checkWindowLocationHash")
                        LoginStore.__instance.checkWindowLocationHash.call(LoginStore.__instance);
                }),

                login: dispatcher.register(function (payload) {
                    if (payload.action === "LoginStore_login")
                        LoginStore.__instance.login.call(LoginStore.__instance, payload.arg_name, payload.arg_password);
                }),

                logout: dispatcher.register(function (payload) {
                    if (payload.action === "LoginStore_logout")
                        LoginStore.__instance.logout.call(LoginStore.__instance);
                })
            };

            if (dispatcher.emitter)
                LoginStore.__emitter = dispatcher.emmiter;
            else LoginStore.__emitter = function (fn, e) {
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
            if (!LoginView.__instance)
                createViewInstance();

            var ref = {
                releaseViewReference: function releaseViewReference() {
                    if (LoginView.__dependents.length == 1 && LoginView.__dependents[0] == ref)
                        destroyViewInstance();
                    else {
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

                LoginView.__instance = React.createClass({
                        render: function () {
                            var valueLink_username = {
                                    value: this.state.username,
                                    requestChange: this.valueLink_username_change
                                },
                                valueLink_password = {
                                    value: this.state.password,
                                    requestChange: this.valueLink_password_change
                                };

                            return ( < div >
                                    (1 == 1 ? < input type = "text"
                                        placeholder = "Digite o usuário"
                                        valueLink = {
                                            valueLink_username
                                        }
                                        /> : null)
                                        x.map(function (item) {
                                            return ( < input type = "password"
                                                placeholder = "Digite a senha"
                                                valueLink = {
                                                    valueLink_password
                                                }
                                                />
                                            );
                                        }) < button onClick = {
                                            this.login
                                        } > Login < /button> < /div >
                                    );
                                },

                                valueLink_username_change: function (newValue) {
                                    this.setState({
                                        username: newValue
                                    });
                                },

                                valueLink_password_change: function (newValue) {
                                    this.setState({
                                        password: newValue
                                    });
                                }
                        });
                }

                function destroyViewInstance() {
                    delete LoginView.__instance;
                    delete LoginView.__dependents;
                }
            }
        };;

        /*
        class LoginView extends FluxEasy.View {

          constructor(){
            this.username='';
            this.password='123';
            this.loginStore= LoginStore.createStoreReference();
            this.loginStore.addEventListener('LoggedIn', this);
            this.loginStore.addEventListener('LoggedOut', this);
          }

          render() {
            var store=this.loginStore.getState();
            if (store.logged_user)
              return (<div>Hello {store.logged_user}
                  <button onClick={this.logout}>Logout</button>
                  </div>
               );
               else{
                  return (
                  <div>
                  <input type="text" placeholder="Digite o usuário"
                               valueLink={this.state.username} />
                      <input type="password" placeholder="Digite a senha"
                              valueLink={this.state.password} />
                      <button onClick={this.login}>Login</button>
                  </div>
                  );
              }
          }

          refresh(){
            this.setState({});
          }

          login(){
            var user = this.state.username;
            var pass = this.state.password;
            this.loginStore.login(user, pass);
          }

          logout(){
            this.loginStore.logout();
          }
        }
        */

        var dispatcher = new Flux.Dispatcher();
        var LoginViewComponent = LoginView.createViewReference(dispatcher).Class;

        var l = < LoginViewComponent / > ;
        var a = document.getElementById('app');
        React.render(l, a);
