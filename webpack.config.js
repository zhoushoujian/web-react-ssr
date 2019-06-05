const dev = process.env.NODE_ENV !== "production";
const path = require( "path" );
const { BundleAnalyzerPlugin } = require( "webpack-bundle-analyzer" );
const FriendlyErrorsWebpackPlugin = require( "friendly-errors-webpack-plugin" );
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const plugins = [
    new FriendlyErrorsWebpackPlugin(),
    new MiniCssExtractPlugin({
        filename: 'css/home.css'
      })
];

if ( !dev ) {
    plugins.push( new BundleAnalyzerPlugin( {
        analyzerMode: "static",
        reportFilename: "webpack-report.html",
        openAnalyzer: false,
    } ) );
}

module.exports = {
    mode: dev ? "development" : "production",
    context: path.join( __dirname, "src" ),
    devtool: dev ? "cheap-module-eval-source-map" : "cheap-module-source-map",
    entry: {
        home: ["./client.js", "./components/home.less"]
    },
    output: {
        path: path.resolve( __dirname, "dist" ),
        publicPath:'/dist/',
        filename: "js/[name].js",
    },
    resolve: {
        modules: [
            path.resolve( "./src" ),
            "node_modules",
        ],
        alias: {
            components: __dirname + "/src/components"
        }
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /(node_modules|bower_components)/,
                loader: "babel-loader",
            },
            {
                test: /\.css$|\.less$/,
                use: [
                    {
                      loader: MiniCssExtractPlugin.loader,
                      options: {
                        hmr: process.env.NODE_ENV === 'development',
                      },
                    },
                    'css-loader',
                    'postcss-loader',
                    'less-loader',
                  ],
            },
            {
                test: /\.(png|jpg|ttf|woff|woff2|eot)$/i,
                use: [{
                    loader: 'url-loader',
                    options: {
                        name:'fonts/[name].[ext]',
                        limit: 102400
                    }
                }]
            },
            {
                test: /\.(svg)$/i, 
                loader: ['file-loader'],
                include: []
            }
        ],
    },
    plugins
};

