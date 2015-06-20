var IfView = {
    createViewReference: function createViewReference(dispatcher) {
        if (!IfView.__instance)
            createViewInstance();

        var ref = {
            releaseViewReference: function releaseViewReference() {
                if (IfView.__dependents.length == 1 && IfView.__dependents[0] == ref)
                    destroyViewInstance();
                else {
                    var i = IfView.__dependents.indexOf(ref);
                    IfView.__dependents.splice(i, 1);
                }
            },

            Class: IfView.__instance
        };

        IfView.__dependents.push(ref);
        return ref;

        function createViewInstance() {
            IfView.__dependents = [];

            IfView.__instance = React.createClass({
                getInitialState: function getInitialState() {
                    var state = {
                        condicaoA: true,
                        condicaoC: true
                    };

                    return state;
                },

                funcaoCondicaoB: function funcaoCondicaoB() {
                    return false;
                },

                funcaoCondicaoD: function funcaoCondicaoD() {
                    return true;
                },

                render: function() {
                    return (
                        <div>
                            {(this.condicaoA ? <span>Condição A Satistfeita</span> : null)}
                            {(this.funcaoCondicaoB() ? <span>Condição B Satistfeita</span> : null)}
                            {(this.condicaoA== this.condicaoC ? <span>Condição C Satistfeita</span> : null)}
                            {(this.funcaoCondicaoB() == this.funcaoCondicaoD() ? <span>Condição D Satistfeita</span> : null)}
                        </div>
                    );
                }
            });
        }

        function destroyViewInstance() {
            delete IfView.__instance;
            delete IfView.__dependents;
        }
    }
};;
