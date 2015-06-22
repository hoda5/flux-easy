var StateSample = React.createClass({
    getInitialState: function getInitialState() {
        var state = {
            name: "Mary"
        };

        return state;
    },

    changed: function changed(e) {
        this.setState({
            name: e.target.value
        });
    },

    render: function() {
        return (
            <label>
                Name:
                <input type="text" value={this.state.name} onChange={this.changed} />
            </label>
        );
    }
});;
