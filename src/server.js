const express = require("express");
const path = require("path");

import React from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { Provider as ReduxProvider } from "react-redux";
import Home from "./components/Home";
import createStore, { initializeSession, storeData } from "./store";

const app = express();

app.use( express.static( path.resolve( __dirname, "../dist" ) ) );

app.get( "/", ( req, res ) => {
    const context = { };
    const store = createStore( );

    store.dispatch( initializeSession( ) );
    store.dispatch( storeData("GO!") );  //comment this to use client data
    const jsx = (
        <ReduxProvider store={ store }>
            <StaticRouter context={ context } location={ req.url }>
                <Home />
            </StaticRouter>
        </ReduxProvider>
    );
    const reactDom = renderToString( jsx );
    const reduxState = store.getState( );
    res.writeHead( 200, { "Content-Type": "text/html" } );
    res.end( htmlTemplate( reactDom, reduxState ) );
} );

app.listen( 9527 );

function htmlTemplate( reactDom, reduxState ) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>React SSR</title>
            <link rel="stylesheet" href="./css/home.css">
        </head>
        
        <body>
            <div id="app">${ reactDom }</div>
            <script>
                window.REDUX_DATA = ${ JSON.stringify( reduxState ) }
            </script>
            <script src="./js/home.js"></script>
        </body>
        </html>
    `;
}
