const got = require('got');
const loAssign = require('lodash.assign');

const QUERY_LIMIT = 100;
const FIELDS = 'name,rating,version,description,keywords,author,modified';

function fetchDownloadsCount(packages, period) {
    const query = packages.join(',');
    const baseUrl = `http://api.npmjs.org/downloads/point/${period}/${encodeURIComponent(query)},`;

    return got(baseUrl, { json: true }).then((res) => res.body);
}

function splitIntoChunks(arr, chunkSize) {
    const chunks = [];

    for (let i = 0; i < arr.length; i += chunkSize) {
        const begin = i;
        const end = begin + chunkSize;

        chunks.push(arr.slice(begin, end));
    }

    return chunks;
}

function getDownloadsCount(packages, period) {
    const packageChunks = splitIntoChunks(packages, 20);

    const promises = [];

    for (const packageChunk of packageChunks) {
        const promise = fetchDownloadsCount(packageChunk, period || 'last-month');
        promises.push(promise);
    }

    return Promise.all(promises).then((results) => {
        let merged = {};

        for (const ret of results) {
            merged = loAssign(merged, ret);
        }

        return merged;
    });
}

function findPackages(query) {
    const url = `http://npmsearch.com/query?q=name:${encodeURIComponent(query)}&fields=${FIELDS}&default_operator=AND&sort=rating:desc&size=${QUERY_LIMIT}`;

    return got(url, { json: true }).then((res) => res.body.results.map((x) => ({
        name: x.name[0],
        version: x.version[0],
        desc: x.description[0],
        modified: x.modified[0].substring(0, 10),
        __modified: x.modified[0],
        author: x.author[0] || '',
    })));
}

function findPackagesWithDownloads(query) {
    return findPackages(query).then((pkgInfos) => {
        const packageNames = pkgInfos.map((x) => x.name);

        return getDownloadsCount(packageNames).then((ret) => {
            for (const pkgName in ret) {
                if (ret.hasOwnProperty(pkgName)) {
                    const i = packageNames.indexOf(pkgName);
                    const info = ret[pkgName];

                    pkgInfos[i].downloads = info.downloads;
                }
            }

            return pkgInfos;
        });
    });
}

module.exports = findPackagesWithDownloads;
