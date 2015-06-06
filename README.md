# flux-easy

[Flux](https://facebook.github.io/flux/) applications have a beautiful architecture but a ugly code. This project propose a transpiler write a better and simple code that generate it. additionally **flux-easy** facilities using of multiple references to Stores/Views.

## Install **flux-easy**

```bash
$ sudo npm install flux-easy
```

## Enabling **flux-easy**

```javascript
import FluxEasy from 'flux-easy';  // fake module that define Store and View fake classes
```

## Defining Stores

```javascript

class STORE_NAME extends FluxEasy.Store {

    constructor () {
        this.prop1 = null; // Store state
        this.prop2 = 0;
    }

    getProp1() {
        return this.prop1; // You can you getState or add specific get methods
    }

    action1(p1,p2) { // automatic creation of dispatcher and callbacks for actions
        this.prop1 = p1;
        this.prop2 = p2;
        this.emit('YourChange'); //write any changes
    }
}
```

## Defining Views

```javascript
class VIEW_NAME extends FluxEasy.View {  // will define a React.Class

  constructor(){
    this.store_ref= STORE_NAME.createStoreReference(); // automatic reference to stores/views
    this.prop3=''; // view state
    this.store_ref.addChangeListenner('YourChange'); // simplification of listenners
  }

  render() {
    var prop1=this.store_ref.getProp1();  // getting partial store state with specific method 
    var prop2=this.store_ref.getState().prop2; // get full store state with getState()
    var prop3=this.state.prop3; // get view state, attention to valueLink automation
    return (<div>
               <div>prop1 {prop1}</div>
               <div>prop2 {prop2}</div>
               <div>prop3 {prop3}</div>
               <input type="text" placeholder="prop3"
                   valueLink={this.state.prop3} />
                   
               <button onClick={this.dispatch_action}>Dispatch action1</button>
            </div>
    );
  }
}

```
## Transpiling 

```bash
  flux-easy src/file.jsx bin/file.jsx
```
> Use automation tools like grunt, gulp, [webpack](https://github.com/thr0w/flux-easy-loader)...

## Using generated code

```javascript
var dispatcher=new Flux.Dispatcher();
var view_ref = VIEW_NAME.createViewReference(dispatcher); // you just need call once
var View_Class = view_ref.Class;

React.render(<View_Class />, document.getElementById('app') );

```
