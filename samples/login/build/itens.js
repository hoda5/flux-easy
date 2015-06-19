var ItensView = {
  createViewReference: function createViewReference(dispatcher) {
    if (!ItensView.__instance)
      createViewInstance();

    var ref = {
      releaseViewReference: function releaseViewReference() {
        if (ItensView.__dependents.length == 1 && ItensView.__dependents[0] == ref)
          destroyViewInstance();
        else {
          var i = ItensView.__dependents.indexOf(ref);
          ItensView.__dependents.splice(i, 1);
        }
      },

      Class: ItensView.__instance
    };

    ItensView.__dependents.push(ref);
    return ref;

    function createViewInstance() {
      ItensView.__dependents = [];

      ItensView.__instance = React.createClass({
        getInitialState: function getInitialState() {
          var state = {
            itens: ["neto", "fernando"]
          };

          return state;
        },

        render: function() {
          return (
            <div>
                <ul>
                  {this.itens.map(function(item) {
                    return <li>{item}</li>;
                  })}
                </ul>
            </div>
          );
        }
      });
    }

    function destroyViewInstance() {
      delete ItensView.__instance;
      delete ItensView.__dependents;
    }
  }
};;
