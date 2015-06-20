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
                string: "B",
                number: 1,
                boolean: true,

                obj: {
                    a: "A"
                },

                objComplex: {
                    a: {
                        number: {
                            number1: 1,
                            number2: 2,
                            number3: 3
                        },
                        letters: {
                            letterA: "A",
                            letterB: "B",
                            letterC: "C"
                        }
                    }
                },

                getInitialState: function getInitialState() {
                    var state = {};
                    return state;
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
