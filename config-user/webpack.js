const _ = require('lodash');
const path = require('path');
const chalk = require('chalk');
const fs = require('fs');
const resolveApp = require('../tools').resolveApp;


const EARTH_CONFIG_NAME = `config`;

const ENV = process.env.NODE_ENV === 'development' ? 'dev' : 'prod';
const webpackConfig = (function getCustomConfig() {
    const customConfigPath = path.resolve(`./${EARTH_CONFIG_NAME}/webpack.client.${ENV}.js`);
    return fs.existsSync(customConfigPath) ? require(customConfigPath) : {}
})();


/**
 * get filenames from config.output.filenames or earth-config/filenames.js
 *
 * @param webpackConfig
 * {
 *      ...,
 *      output: {
 *          filenames: {
 *              js: 'static/js/[name].js',
 *              jsChunk: 'static/js/[name].chunk.js',
 *              css: '', // 在<style>中，无需配置
 *              img: 'static/img/[name].[hash:8].[ext]',
 *              media: 'static/media/[name].[hash:8].[ext]'
 *          }
 *
 *      },
 *      ...
 * }
 *
 * @return {object} filenames
 */
function getFilenames(webpackConfig) {

    let filenames = _.get(webpackConfig, ['output', 'filenames']);

    if (filenames && !_.isEmpty(filenames)) {
        return filenames
    }

    // deprecated
    log(chalk.yellow(`\n warning: ${EARTH_CONFIG_NAME}/filenames is deprecated, please use webpackconfig.output.filenames instead \n`));

    try {
        const env = process.env.NODE_ENV === 'development' ? 'dev' : 'prod';
        return require(path.resolve('config/filenames'))[env]
    } catch (e){

    }

    // show missing error
    if (_.isEmpty(filenames)) {
        console.log(chalk.red('\n warning: webpackconfig.output.filenames is missing!'));
        process.exit(1);
    }

}

/**
 * get publicPath from config.output.publicPath or earth-config/cndPath.js
 *
 * @param webpackConfig
 * {
 *      ...,
 *      output: {
 *          // string
 *          publicPath: 'path'
 *          // or obj (only prod)
 *          publicPath: {
 *            js: 'path',
 *            css: 'path',
 *            img: 'path',
 *            media: 'path'
 *          }
 *
 *      },
 *      ...
 * }
 *
 *
 * @return {*} publicPath [object | null]
 */
/*function getCdnPath(webpackConfig) {

    const defaultPublicPath = '';
    const publicPath = _.get(webpackConfig, ['output', 'publicPath']);

    let cdnConfig = {};


    if (_.isString(publicPath)) {
        return publicPath
    }


    // get publicPath from staticPath
    let staticPath  = null;
    try {
        staticPath = require(path.resolve('config/staticPath'))
    } catch (e) {
        staticPath = {}
    }


    if (ENV === 'dev') {
        return staticPath.dev
    }


    if (ENV === 'prod') {

        if (staticPath[ENV].js) return staticPath[ENV];

        if (_.isPlainObject(publicPath)) {

            cdnConfig = publicPath;

            return {
                js: cdnConfig.js || defaultPublicPath,
                css: cdnConfig.css || defaultPublicPath,
                img: cdnConfig.img || defaultPublicPath,
                media: cdnConfig.media || defaultPublicPath
            }
        }

        // deprecated
        // try{
        //     cdnConfig = require(path.resolve('config/cdnPath'));
        //     cdnConfig && log(chalk.yellow(`\n warning: ${EARTH_CONFIG_NAME}/cdnPath.js is deprecated, please use webpackconfig.output.publicPath instead \n`));
        //     return {
        //         js: cdnConfig.prodJsCDN || defaultPublicPath,
        //         css: cdnConfig.prodCssCDN || defaultPublicPath,
        //         img: cdnConfig.prodImgCDN || defaultPublicPath,
        //         media: cdnConfig.prodMediaCDN || defaultPublicPath
        //     }
        // }catch(e){
        //
        //     // show missing error
        //     if (!_.isEmpty(webpackConfig) && _.isEmpty(publicPath)) {
        //         log(chalk.yellow('\n warning: webpackconfig.output.publicPath is missing!'));
        //         return null
        //     }
        //
        // }


    }


    return null



}*/

/**
 * get alias from config.resolve.alias or earth-config/alias.js
 *
 * @param webpackConfig
 * {
 *     ...,
 *     resolve: {
 *         alias: {
 *            // custom config
 *         }
 *     },
 *     ...
 * }
 *
 * @return {object} alias
 */
function getAliasConfig(webpackConfig) {
    let defaultConfig = {
        commons: path.resolve('src/components_common/'),
        tools: path.resolve('src/tools/'),
        api: path.resolve('src/api/'),
        config: path.resolve('src/config'),
        public: path.resolve('public/'),
        scss: path.resolve('src/scss_mixin/scss/'),
        scss_mixin: path.resolve('src/scss_mixin/'),
    };

    let alias = _.get(webpackConfig, ['resolve', 'alias']);

    if (_.isEmpty(alias)) {
        alias = defaultConfig;

        log(chalk.yellow('\n warning: ' + `${EARTH_CONFIG_NAME}/alias.js is deprecated. You can use alias in webpackconfig.resolve.alias.` + '\n'));

        try{
            alias = require(path.resolve(path.resolve('config/alias')));
        }catch(e){
        }
    }


    return alias

}

/**
 * get cssModule from config.cssModule
 *
 * @param webpackConfig
 * {
 *     ...,
 *     cssModule: {
           exclude: 'src/static',
           name: '[name]__[local]-[hash:base64:5]'
       },
       ...
 * }
 *
 * @return {object}
 * {
 *     exclude: 'path',
 *     name: '',
 *     enable: false / true
 * }
 */
function getCssModuleConfig(webpackConfig) {
    let cssModule = _.get(webpackConfig, 'cssModule');

    if (_.isEmpty(cssModule)) {
        return {
            exclude: '',
            name: '',
            enable: false
        }
    }


    let excludePath;

    if (_.isArray(cssModule.exclude)) {
        excludePath = cssModule.exclude.map((path) => resolveApp(path))
        // fs.existsSync(resolveApp(cssModule.exclude)) ? resolveApp(cssModule.exclude) : ''
    } else {
        excludePath = resolveApp(cssModule.exclude)
    }

    const getLocalIdent = cssModule.getLocalIdent ? {getLocalIdent: cssModule.getLocalIdent} : {};


    return {
        exclude: excludePath,
        enable: true,
        config: Object.assign(
            getLocalIdent,
            {
                localIdentName: cssModule.localIdentName || cssModule.name || '[folder]__[local]-[hash:base64:5]',
            }
        )
    }
}

/**
 * get externals for webpack from config.externals

 * @param webpackConfig
 *{
 *     ...,
 *     externals: {
 *          jquery: {
 *              root: '_',
 *              entry: {
 *                  ...
 *              },
 *              files: [...,...]
 *          },
 *          library2: 'library2'
 *      },
 *      ...
 * }
 *
 *
 * @return {object}
 * {
 *     jquery: {
 *         root: '_'
 *     },
 *     library2: 'library2'
 * }
 */
function getExternals(webpackConfig) {
    const externals = _.get(webpackConfig, 'externals');

    let newExternals = {};
    _.forEach(externals, (v, k) => {
        // fix: externals直接传string
        if (_.isString(v)) {
            newExternals[k] = v;
            return;
        }
        newExternals[k] = _.omit(v, ['entry', 'files'])
    });

    return newExternals
}


function log(msg) {
    console.log(msg)
}


function getStaticPath() {

    const STATICPATH_CONFIG_NAME = 'config/staticPath.js';


    let config = {};
    const publicPath = _.get(webpackConfig, ['output', 'publicPath']);

    if (!publicPath) {
        try {
            config = require(path.resolve(STATICPATH_CONFIG_NAME))
        } catch (e) {
            log(chalk.error('\n error: ' + `${STATICPATH_CONFIG_NAME} is missing!` + '\n'));
            process.exit(1);
        }
    }

    // read from webpack.config.js
    if (_.isString(publicPath)) {
        return {
            js: publicPath,
            img: publicPath,
            css: publicPath,
            media: publicPath
        }
    }

    // read from staticPath.js
    if (ENV === 'dev') {

        // config/staticPath
        return {
            js: config[ENV],
            img: config[ENV],
            css: config[ENV],
            media: config[ENV]
        }
    }

    if (ENV === 'prod') {

        // webpack.config.dev.js
        if (_.isPlainObject(publicPath)) {
            return publicPath
        }

        // config/staticPath
        return config[ENV]
    }

    return null
}

module.exports = {
    _origin: webpackConfig,

    filenames: getFilenames(webpackConfig),
    // cdnPath: getCdnPath(webpackConfig),
    alias: getAliasConfig(webpackConfig),
    cssModule: getCssModuleConfig(webpackConfig),
    externals: getExternals(webpackConfig),
    staticPath: getStaticPath()
};
