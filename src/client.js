import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router } from "react-router-dom";
import { Provider } from "react-redux";
import $ from "jquery";
import App from "./components/fileServer";
import { createDuxStore } from "./store";

const store = createDuxStore( window.REDUX_DATA );
window.$getState = store.getState;
window.$dispatch = store.dispatch;
window.$ = $;

ReactDOM.hydrate(
    (<Provider store={ store }>
        <Router>
            <App />
        </Router>
    </Provider>
), document.getElementById( "app" ) );
