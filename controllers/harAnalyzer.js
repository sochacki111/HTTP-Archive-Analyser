const fs = require("fs");
const puppeteer = require('puppeteer');
const PuppeteerHar = require('puppeteer-har');
const parseUrl = require('url-parse');

exports.analyzeUrl = async (req, res) => {
    let url = parseUrl(req.body.url);
    const harFileName = 'results.har';
    let examinedUrlHostname = url.hostname;

    // Get HAR file using puppeteer
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();

    const har = new PuppeteerHar(page);
    await har.start({ path: harFileName });

    try {
        await page.goto(url.href);
    } catch (error) {
        return res.status(500).send('Something broke!');
    }

    await har.stop();
    await browser.close();

    // Read saved HAR file
    const fileContents = fs.readFileSync(harFileName);
    const jsonContents = JSON.parse(fileContents);
    let examinedUrlMediaStructure = [];
    let externalResourceRequests = [];
    let cookies = [];
    let entries = jsonContents.log.entries;

    entries.forEach(entry => {
        if (parseUrl(entry.request.url).hostname == examinedUrlHostname) {
            examinedUrlMediaStructure.push(entry.request.url);
        } else {
            externalResourceRequests.push({ requestSource: entry.request.url });
        }

        if (entry.request.cookies.length) { cookies.push(...entry.request.cookies) };
        if (entry.response.cookies.length) { cookies.push(...entry.response.cookies) };
    });

    // chop urls into paths
    let paths = examinedUrlMediaStructure.map(url => {
        return parseUrl(url).pathname.split('/');
    });

    // build tree structure from url paths
    let tree = createJsonTree(paths);
    let mediaStructure = JSON.stringify(tree, null, 4);

    res.json({
        mediaStructure: mediaStructure,
        externalResourceRequests: externalResourceRequests,
        cookies: cookies
    });
}

function createJsonTree(paths) {
    let tree = [];

    for (let i = 0; i < paths.length; i++) {
        let path = paths[i];
        let currentLevel = tree;
        for (let j = 0; j < path.length; j++) {
            let part = path[j];
            let existingPath = findWhere(currentLevel, 'text', part);

            if (existingPath) {
                currentLevel = existingPath.nodes;
            } else {
                let newPart = {
                    text: part,
                    nodes: []
                }

                currentLevel.push(newPart);
                currentLevel = newPart.nodes;
            }
        }
    }
    return tree;

    function findWhere(array, key, value) {
        element = 0;
        while (element < array.length && array[element][key] !== value) {
            element++;
        };

        if (element < array.length) {
            return array[element]
        } else {
            return false;
        }
    }
}