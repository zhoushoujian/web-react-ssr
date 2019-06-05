const express = require("express");
const path = require("path");

import React from "react";
import { renderToNodeStream } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { Provider as ReduxProvider } from "react-redux";
import Home from "./components/Home";
import createStore, { initializeSession, storeData } from "./store";

const app = express();

app.use( express.static( path.resolve( __dirname, "../dist" ) ) );

app.get( "/", ( req, res ) => {
    const context = { };
    const store = createStore( );

    store.dispatch( initializeSession() );
    store.dispatch( storeData("ready?"));  //comment this to use client data
    const reduxState = store.getState();
    res.writeHead( 200, { "Content-Type": "text/html" } );
    res.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>React SSR</title>
            <link rel="stylesheet" href="./css/bundle.home.css">
        </head>
        
        <body>
            <div id="app">`
    )
    const reactDom = renderToNodeStream(
        (<ReduxProvider store={ store }>
            <StaticRouter context={ context } location={ req.url }>
                <Home />
            </StaticRouter>
        </ReduxProvider>)
    );
    reactDom.pipe(res, { end: false });
    reactDom.on('end', () => {
        res.write(`</div>
                <script>
                    window.REDUX_DATA = ${ JSON.stringify( reduxState ) }
                </script>
                <script src="./js/bundle.js"></script>
                <script src="./js/home.js"></script>
                <script src="./js/manifest.js"></script>
                <script src="./js/vendor.js"></script>
            </body>
            </html>
        `);
        res.end();
    })
} );

app.listen( 9527 );


