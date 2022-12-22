#!/usr/bin/env node
import { config } from "./../config";

const fs = require('fs');
const moment = require('moment');
const _ = require('lodash');
const path = require('path');
const agent = require('superagent-promise')(require('superagent'), Promise);
const { translate } = require("google-translate-api-browser");
let dicc = {};

//Lang Codes https://ctrlq.org/code/19899-google-translate-languages

if (true) {

    //Args
    const inputFile = "en.json";
    const destinationCodes = ["ar"];
    const apiKey = config.googleMap.API_KEY;

    const apiUrl = _.template('https://www.googleapis.com/language/translate/v2?key=<%= apiKey %>&q=<%= value %>&source=en&target=<%= languageKey %>');

    const transformResponse = (res) => {
        return _.get(JSON.parse(res.text), ['data', 'translations', 0, 'translatedText'], '');
    }

    const getCache = (languageKey) => {
        try {
            dicc[languageKey] = {};
            let fileContent = fs.readFileSync(`./translateCache-${languageKey}.txt`, 'utf-8').split('\n');
            fileContent.map((line)=> {
                let cached = line.split('|');
                if(cached[0]) dicc[languageKey][cached[0]] = cached[1];
            });
        } catch (error) {

        }
    }
    const cachedIndex = (key, value, languageKey) => {
        const line = key + '|' + value + '\n';
        dicc[languageKey][key] = value;
        fs.appendFileSync(`./translateCache-${languageKey}.txt`, line);
        return value;
    }

    function iterLeaves(value, keyChain, accumulator, languageKey) {
        accumulator = accumulator || {};
        keyChain = keyChain || [];
        if (_.isObject(value)) {
            return _.chain(value).reduce((handlers, v, k) => {
                return handlers.concat(iterLeaves(v, keyChain.concat(k), accumulator, languageKey));
            }, []).flattenDeep().value();
        } else {
            if(typeof value !== 'string')
                return value;

            return function () {
                if(!(value in dicc[languageKey])) {
                    console.log(_.template('Translating <%= value %> to <%= languageKey %>')({value, languageKey}));

                    let prom;
                    //Translates individual string to language code
                    if(apiKey != '') {
                        //using apiKey
                        prom = agent('GET', apiUrl({
                            value: encodeURI(value),
                            languageKey,
                            apiKey
                        })).then(transformResponse)
                    }
                    else {
                        //using free api key
                        prom = translate(value, { to: languageKey })
                    }

                    return prom.then((res) => cachedIndex(value, res, languageKey))
                    .catch((err) => console.log(err))
                    .then((text) => {
                        //Sets the value in the accumulator
                        _.set(accumulator, keyChain, text);

                        //This needs to be returned to it's eventually written to json
                        return accumulator;
                    });
                }
                else {
                    console.log(value + ' cached: ' + dicc[languageKey][value]);
                    _.set(accumulator, keyChain, dicc[languageKey][value]);
                    return accumulator;
                }
            };
        }
    }

    Promise.all(_.reduce(destinationCodes, (sum, languageKey) => {
        const fileName = _.template('./<%= languageKey %>-<%= timeStamp %>.json')({
            languageKey,
            timeStamp: moment().unix()
        });

        //read languageKey Cache.
        getCache(languageKey);

        //Starts with the top level strings
        return sum.concat(_.reduce(iterLeaves(JSON.parse(fs.readFileSync(path.resolve(inputFile), 'utf-8')), undefined, undefined, languageKey), (promiseChain, fn) => {
            return promiseChain.then(fn);
        }, Promise.resolve()).then((payload) => {
            fs.writeFileSync(fileName, JSON.stringify(payload, null, 4));
        }).then(_.partial(console.log, 'Successfully translated all nodes, file output at ' + fileName)));
    }, [])).then(() => {
        process.exit();
    });

} else {
    console.error('You must provide an input json file and a comma-separated list of destination language codes.');
}
