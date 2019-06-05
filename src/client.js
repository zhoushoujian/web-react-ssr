import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router } from "react-router-dom";
import { Provider as ReduxProvider } from "react-redux";

import Home from "./components/Home";
import createStore from "./store";

const store = createStore( window.REDUX_DATA );

ReactDOM.hydrate( (
    <ReduxProvider store={ store }>
        <Router>
            <Home />
        </Router>
    </ReduxProvider>
), document.getElementById( "app" ) );
