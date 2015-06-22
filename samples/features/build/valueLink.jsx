var ValueLinkSample = React.createClass({
    getInitialState: function getInitialState() {
        var state = {
            name: "Mary"
        };

        return state;
    },

    render: function() {
        var valueLink_name = {
            value: this.state.name,
            requestChange: this.valueLink_name_change
        };

        return (
            <label>
                Name:
                <input type="text" valueLink={valueLink_name} />
            </label>
        );
    },

    valueLink_name_change: function(newValue) {
        this.setState({
            name: newValue
        });
    }
});;
