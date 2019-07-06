const dev = process.env.NODE_ENV !== "production";
const path = require( "path" );
const { BundleAnalyzerPlugin } = require( "webpack-bundle-analyzer" );
// const FriendlyErrorsWebpackPlugin = require( "friendly-errors-webpack-plugin" );
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');

const plugins = [
    // new FriendlyErrorsWebpackPlugin(),
    new MiniCssExtractPlugin({
        filename: 'css/fileServer.css'
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
      fileServer: ["./client.js", "./components/fileServer.less"]
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
                use: {
                    loader: 'babel-loader',
                    options: {
                        "presets": [
                            ["env",
                                {
                                    "modules": false,
                                    "useBuiltIns": "usage"
                                }
                            ],
                            "react",
                            "stage-2",
                        ],
                        "plugins": [
                            [
                                "babel-plugin-transform-require-ignore",
                                {
                                    "extensions": [".less"]
                                }
                            ],
                            ["transform-runtime", "transform-decorators-legacy"],
                            "babel-polyfill",
                            ["import", {
                                "libraryName": "antd-mobile",
                                "style": "css"
                            }]
                        ]
                    }
                }
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
    plugins,
    optimization: {
        minimizer: [
          new UglifyJsPlugin({ cache: true, parallel: true, sourceMap: false }),
          new OptimizeCSSAssetsPlugin({})
        ],
        splitChunks:{
          chunks: 'async',
          minSize: 30000,
          minChunks: 1,
          maxAsyncRequests: 5,
          maxInitialRequests: 3,
          name: false,
          cacheGroups: {
            vendor: {
              name: 'vendor',
              chunks: 'initial',
              priority: -10,
              reuseExistingChunk: false,
              test: /node_modules\/(.*)\.js/
            },
            styles: {
              name: 'bundle',
              test: /\.(less|css)$/,
              chunks: 'all',
              minChunks: 1,
              reuseExistingChunk: true,
              enforce: true
            }
          }
        },
        runtimeChunk: {
          name: 'manifest',
        }
    },
};

