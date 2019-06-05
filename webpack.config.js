const dev = process.env.NODE_ENV !== "production";
const path = require( "path" );
const { BundleAnalyzerPlugin } = require( "webpack-bundle-analyzer" );
const FriendlyErrorsWebpackPlugin = require( "friendly-errors-webpack-plugin" );
// const ExtractTextPlugin = require("extract-text-webpack-plugin");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const plugins = [
    // new ExtractTextPlugin('styles.css', {
    //     allChunks: true
    // }),
    new FriendlyErrorsWebpackPlugin(),
    new MiniCssExtractPlugin({
        filename: dev ? '[name].css' : '[name].[hash].css',
        chunkFilename: dev ? '[id].css' : '[id].[hash].css',
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
        app: "./client.js",
    },
    output: {
        path: path.resolve( __dirname, "dist" ),
        filename: "[name].bundle.js",
    },
    resolve: {
        modules: [
            path.resolve( "./src" ),
            "node_modules",
        ],
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
                // use: ExtractTextPlugin.extract([ 'css-loader', 'postcss-loader', 'less-loader' ])
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
                        name:'fonts/[name].[hash:8].[ext]',
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

