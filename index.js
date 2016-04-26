const loOrderBy = require('lodash.orderby');
const searchNpm = require('./search-npm');

module.exports = (pluginContext) => {
    const toast = pluginContext.toast;
    const shell = pluginContext.shell;

    function search(q, res) {
        const query = q.trim();

        if (query.length <= 0) {
            res.add({
                title: 'Please enter search query',
                desc: 'hain-plugin-npm'
            });

            return;
        }

        res.add({
            id: '__temp',
            title: 'Searching …',
            icon: '#fa fa-circle-o-notch fa-spin',
        });

        searchNpm(query).then((pkgs) => {
            let packages = pkgs || [];
            packages = loOrderBy(packages, 'downloads', ['desc']);

            res.remove('__temp');

            const results = packages.map((p) => ({
                id: p.name,
                payload: p.name,
                title: `${p.name} <span style="font-size: 9pt">${p.version} by <b>${p.author}</b></span>`,
                desc: (p.downloads !== undefined && p.modified !== undefined) ? `${p.downloads} Downloads / ${p.desc}` : `${p.desc}`,
            }));

            res.add(results);

            if (!results.length) {
                res.add({
                    id: 'error',
                    title: 'No packages found',
                    desc: `<b>Query:</b> ${query}`,
                    icon: '#fa fa-close',
                });
            }
        }).catch(() => {
            toast.enqueue('We are sorry but there has been an error while searching npm packages', 3500);
        });
    }

    function execute(id, payload) {
        if (payload) {
            shell.openExternal(`https://www.npmjs.com/package/${payload}`);
        }
    }

    return { search, execute };
};
