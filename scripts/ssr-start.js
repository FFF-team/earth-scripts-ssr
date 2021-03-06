process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';

const del = require('del');
const path = require('path');
const webpack = require('webpack');
const nodemon = require('nodemon');
const config = require('../server/webpack.config');
const console = require('../tools').clog.ssr;
// const openBrowser = require('react-dev-utils/openBrowser');
// const {
//     prepareUrls,
// } = require('react-dev-utils/WebpackDevServerUtils');
//
// let openFlag = false;

/**
 * 0. init
 * 1. webpack watch
 * 2. nodemon start server
 */

const ssrStart = async () => {

    const {entry, webpackEntry} = await require('./_ssr_get_args')();

    console.info(`current environment: development`);

    await require('./_ssr_init')();

    // clear
    del(path.resolve('_server/dist'));


    try {
        await ssrWatch({
            entry: webpackEntry
        });
    } catch (e) {
        console.log(e);
        console.log('watch fail');
        return;
    }

    entry && nodemonStart(entry);

};

// todo: port获取方式
// const _openBrowser = () => {
//     const urls = prepareUrls('http', '0.0.0.0', 8004);
//
//     openBrowser(
//         urls.localUrlForBrowser +
//         `index`
//     )
// }

const ssrWatch = ({
                      entry
                  }) => {
    return new Promise((resolve, reject) => {

        const compiler = webpack(
            Object.assign(config, {
                entry: entry
            }),
            (err, stats) => {
                if (err || stats.hasErrors()) {
                    err && console.log(err);
                    stats.hasErrors() && console.log(stats.toJson().errors)
                    console.log('webpack compiler error');
                    process.exit(1);
                    // Handle errors here
                }
                // Done processing
            }
        );

        compiler.watch({
            // Example watchOptions
            aggregateTimeout: 300,
            poll: true
        }, (err, stats) => {
            // todo: 不输出信息
            // Print watch/build result here...
            if (err) {
                console.error(err);
                reject(err);
                return;
            }

            console.info('react component for ssr has rebuild!')


            const info = stats.toJson();


            if (stats.hasErrors()) {
                console.error(info.errors);
            }

            if (stats.hasWarnings()) {
                console.warn(info.warnings);
            }


            resolve(true);

        });
    })
};

module.exports = ssrWatch;


const nodemonStart = (serverEntry) => {
    nodemon({
        "script": serverEntry,
        "ext": 'js',
        "verbose": true,
        "env": {
            "NODE_ENV": "development"
        },
        "watch": [
            path.resolve('build/server'),
            path.resolve('template'),
            // todo: 没想好怎么传watch参数，暂时写死
            path.resolve('server'),
            serverEntry
        ],
        "ignore": [],
        "delay": "1000"
    });

    nodemon.on('start', function () {
        console.log('=== App has started === \n');

        // if (!openFlag) {
        //     openFlag = true;
        //     _openBrowser()
        // }


    }).on('quit', function () {
        console.log('App has quit');
        process.exit();
    }).on('restart', function (files) {
        // console.log('App restarted due to: ', files);
    });
}


ssrStart();