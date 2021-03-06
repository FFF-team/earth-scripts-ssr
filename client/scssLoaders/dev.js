const ExtractTextPlugin = require('extract-text-webpack-plugin');
const postcss_loader = require('../../config/common/loaders/postcss');
const css_loader = require('../../config/common/loaders/css');
const style_loader = require('../../config/common/loaders/style');
const scss_loader = require('../../config/common/loaders/scss');
const _ = require('lodash');

const mergeLoaders = require('../util').mergeLoaders;


function scssLoaders(customConfig, extractTextPluginOptions) {

    const base = {
        test: /\.scss$/,
    };

    const loaderObj = Object.assign(
        {
            fallback: style_loader,
            use: [
                postcss_loader,
                scss_loader
            ],
        },
        extractTextPluginOptions
    );

    const getRets = (arr) => {

        return arr.map((item) => {

            const {use} = item;
            const others = _.omit(item, 'use');

            // const {use, ..other} = item

            return Object.assign(
                {},
                others,
                base,
                {
                    loader: ExtractTextPlugin.extract(
                        mergeLoaders(loaderObj)({
                            use: use
                        })
                    )
                }
            )
        })


    }


    const normalLoader = () => {

        return getRets([{
            use: [0 , css_loader({
                importLoaders: 2,
                minimize: true,
                sourceMap: true,
            }),]
        }])

        /*return [
            {
                test: /\.scss$/,
                loader: ExtractTextPlugin.extract(
                    Object.assign(
                        {
                            fallback: style_loader,
                            use: [
                                css_loader({
                                    importLoaders: 2,
                                    minimize: true,
                                    sourceMap: false,
                                    // sourceMap: shouldUseSourceMap,
                                }),
                                postcss_loader,
                                scss_loader
                            ],
                        },
                        extractTextPluginOptions
                    )
                ),
                // Note: this won't work without `new ExtractTextPlugin()` in `plugins`.
            }
        ]*/
    };

    const cssModuleLoader = ({exclude, config}) => {

        return exclude ?
            getRets([
                {
                    exclude: exclude,
                    use: [0, css_loader(
                        Object.assign({
                            importLoaders: 2,
                            minimize: true,
                            sourceMap: true,
                            module: true,
                        }, config)
                    )]
                },
                {
                    include: exclude,
                    use: [0, css_loader({
                        importLoaders: 2,
                        minimize: true,
                        sourceMap: true,
                    })]
                }
            ]) :
            getRets([
                {
                    use: [0, css_loader(
                        Object.assign({
                            importLoaders: 2,
                            minimize: true,
                            sourceMap: true,
                            module: true,
                        }, config)
                    )]
                }
            ])

    };




    const {
        exclude,
        config,
        enable
    } = customConfig.cssModule;

    return enable ?
        cssModuleLoader({
            exclude,
            config
        }) :
        normalLoader()


}

module.exports = scssLoaders;