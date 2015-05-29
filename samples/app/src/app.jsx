import Flux from "flux";
import React from "react";
import loginView from "./login.view";

class App extends React.Component
{
    constructor(){
      this.current_view = loginView;
    }
    show(view) {

    }
}

react.Render( <App /> , document.getElementById('app'));
