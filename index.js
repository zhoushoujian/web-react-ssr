require( "babel-register" )( {
    "presets": [
        [ "env",
            {
                "modules": false,
                "useBuiltIns": "usage"
            }
        ],
        "react",
        "es2015", 
        "stage-2",
    ],
    'plugins': [
        [
          'babel-plugin-transform-require-ignore',
          {
            extensions: ['.less']
          }
        ]
      ]
} );
require( "./src/server" );
