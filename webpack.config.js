const path = require('path')
const outputPath = path.join(__dirname, './dist')
const CopyPlugin = require('copy-webpack-plugin');

module.exports = [
    {
        target: 'electron-renderer',
        mode: 'production',
        node: {
            __dirname: false
        },
        entry: {
            main: './index.js'
        },
        output: {
            path: outputPath,
            filename: 'preload.js'
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: [['@babel/preset-env', {targets: {electron: '13.0.0'}}]],
                            plugins: ['@babel/plugin-transform-runtime']
                        }
                    }
                }
            ]
        },
        plugins: [
            new CopyPlugin({
                patterns: [{
                    from: './utools'
                }]
            })
        ]
    }
]
