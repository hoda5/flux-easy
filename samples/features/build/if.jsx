var IfSample = React.createClass({
    getInitialState: function getInitialState() {
        var state = {
            x: false
        };

        return state;
    },

    exchange: function exchange() {
        this.setState({
            x: !x
        });
    },

    render: function() {
        return (
            <div onClick={this.exchange}>
                {(this.state.x ? <div>TRUE</div> : null)}
                {(!this.state.x ? <div>false</div> : null)}
            </div>
        );
    }
});;
