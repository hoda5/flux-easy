var MethodsView = React.createClass({
    getInitialState: function getInitialState() {
        var state = {
            secondsElapsed: 0
        };

        return state;
    },

    tick: function tick() {
        this.setState({
            secondsElapsed: this.state.secondsElapsed + 1
        })
    },

    componentDidMount: function componentDidMount() {
        this.interval = setInterval(this.tick, 1000);
    },

    componentWillMount: function componentWillMount() {
        clearInterval(this.interval);
    },

    render: function() {
        return (
            <div onClick={this.tick}>
                Seconds Elapsed: {this.state.secondsElapsed}
            </div>
        );
    }
});;
