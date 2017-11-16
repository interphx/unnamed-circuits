'use strict';

var path              = require('path'),
    webpack           = require('webpack');

module.exports = {
    context: path.join(__dirname, 'src/server'),
    entry: './app.ts',
    target: 'node',
    plugins: [
        new webpack.NamedModulesPlugin(),
        new webpack.NoEmitOnErrorsPlugin(),
        new webpack.DefinePlugin({
            "process.env": {
                "BUILD_TARGET": JSON.stringify('server')
            }
        }),
    ],
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                exclude: path.join(__dirname, 'node_modules')
            }
        ]        
    },
    output: {
        path: path.join(__dirname, './dist'),
        filename: 'app.js'
    },
    resolve: {
        modules: [path.resolve(__dirname, 'src'), 'node_modules'],
        extensions: ['.tsx', '.ts', '.js', '.jsx']
    }
}