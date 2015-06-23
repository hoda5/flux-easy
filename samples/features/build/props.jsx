var PropsView = {
    createViewReference: function createViewReference(dispatcher) {
        if (!PropsView.__instance)
            createViewInstance();

        var ref = {
            releaseViewReference: function releaseViewReference() {
                if (PropsView.__dependents.length == 1 && PropsView.__dependents[0] == ref)
                    destroyViewInstance();
                else {
                    var i = PropsView.__dependents.indexOf(ref);
                    PropsView.__dependents.splice(i, 1);
                }
            },

            Class: PropsView.__instance
        };

        PropsView.__dependents.push(ref);
        return ref;

        function createViewInstance() {
            PropsView.__dependents = [];

            PropsView.__instance = React.createClass({
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
                            Test props
                        </div>
                    );
                }
            });
        }

        function destroyViewInstance() {
            delete PropsView.__instance;
            delete PropsView.__dependents;
        }
    }
};;
