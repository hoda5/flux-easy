var h = require("./hello.js");
var RequireSample = React.createClass({
    getInitialState: function getInitialState() {
        var state = {};
        return state;
    },

    render: function() {
        return (
            <div>
                {h.hello()}
            </div>
        );
    }
});;
