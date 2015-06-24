var ValueLinkSample = React.createClass({
    getInitialState: function getInitialState() {
        var state = {
            editing: {name : "Mary"}
        };

        return state;
    },

    render: function() {
        var valueLink_editing_name_a_a_a_a_a_a_y_q = {
                value: this.state.editing.name.a.a.a.a.a.a.y.q,
                requestChange: this.valueLink_editing_name_a_a_a_a_a_a_y_q_change
            },
            valueLink_editing_name_a_a_a_a_a_a_y_p = {
                value: this.state.editing.name.a.a.a.a.a.a.y.p,
                requestChange: this.valueLink_editing_name_a_a_a_a_a_a_y_p_change
            };

        return (
            <div>
            <label>
                Name:
                <input type="text" valueLink={valueLink_editing_name_a_a_a_a_a_a_y_q} />
                <input type="text" valueLink={valueLink_editing_name_a_a_a_a_a_a_y_p} />
                <input type="text" valueLink={valueLink_editing_name_a_a_a_a_a_a_y_q} />
            </label>
                </div>
        );
    },

    valueLink_editing_name_a_a_a_a_a_a_y_q_change: function(newValue) {
        this.state.editing.name.a.a.a.a.a.a.y.q = newValue;
        this.setState({});
    },

    valueLink_editing_name_a_a_a_a_a_a_y_p_change: function(newValue) {
        this.state.editing.name.a.a.a.a.a.a.y.p = newValue;
        this.setState({});
    }
});;
