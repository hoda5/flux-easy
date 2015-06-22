var Itens = React.createClass({
    getInitialState: function getInitialState() {
        var state = {
            itens: ["item1", "item2"]
        };

        return state;
    },

    render: function() {
        return (
            <ul>
                {this.itens.map(function(item) {
                    return <li>{item}</li>;
                })}
            </ul>
        );
    }
});;
