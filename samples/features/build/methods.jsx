var MethodsView = {
    createViewReference: function createViewReference(dispatcher) {
        if (!MethodsView.__instance)
            createViewInstance();

        var ref = {
            releaseViewReference: function releaseViewReference() {
                if (MethodsView.__dependents.length == 1 && MethodsView.__dependents[0] == ref)
                    destroyViewInstance();
                else {
                    var i = MethodsView.__dependents.indexOf(ref);
                    MethodsView.__dependents.splice(i, 1);
                }
            },

            Class: MethodsView.__instance
        };

        MethodsView.__dependents.push(ref);
        return ref;

        function createViewInstance() {
            MethodsView.__dependents = [];

            MethodsView.__instance = React.createClass({
                getInitialState: function getInitialState() {
                    var state = {
                        secondsElapsed: 0
                    };

                    return state;
                },

                tick: function tick() {
                    this.setState({
                        secondsElapsed: this.secondsElapsed + 1
                    })
                },

                componentDidMount: function componentDidMount() {
                    this.interval = setInterval(function () {
                        this.tick()
                    }.bind(this), 1000);
                },

                componentWillMount: function componentWillMount() {
                    clearInterval(this.interval);
                },

                render: function() {
                    return (
                        <div onClick={this.tick}>
                            Seconds Elapsed: {this.secondsElapsed}
                        </div>
                    );
                }
            });
        }

        function destroyViewInstance() {
            delete MethodsView.__instance;
            delete MethodsView.__dependents;
        }
    }
};;
