const fs = require("fs");
const puppeteer = require('puppeteer');
const PuppeteerHar = require('puppeteer-har');
const parseUrl = require('url-parse');

exports.analyzeUrl = async (req, res) => {
    let url = parseUrl(req.body.url);
    const harFileName = 'results.har';
    let examinedUrlHostname = url.hostname;

    // downloadHarFile(url);

    // Get HAR file using puppeteer
    // async function downloadHarFile(url) {

    const browser = await puppeteer.launch({args: ['--no-sandbox']});
    const page = await browser.newPage();

    const har = new PuppeteerHar(page);
    await har.start({ path: harFileName });

    await page.goto(url.href);

    await har.stop();
    await browser.close();
    // }
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
        // console.log(url);
        // console.log(parseUrl(url).pathname.substring(1).split('/'));
        return parseUrl(url).pathname.split('/');
    });

    // build tree structure from url paths
    console.log(paths);
    var tree = arrangeIntoTree(paths);
    let mediaStructure = JSON.stringify(tree, null, 4);

    console.log(mediaStructure);
    res.json({
        mediaStructure: mediaStructure,
        externalResourceRequests: externalResourceRequests,
        cookies: cookies
    });
}

function arrangeIntoTree(paths) {
    var tree = [];

    for (var i = 0; i < paths.length; i++) {
        var path = paths[i];
        var currentLevel = tree;
        for (var j = 0; j < path.length; j++) {
            var part = path[j];
            var existingPath = findWhere(currentLevel, 'text', part);

            if (existingPath) {
                currentLevel = existingPath.nodes;
            } else {
                var newPart = {
                    text: part,
                    nodes: []
                }
                // var newPart = {
                //     text: part
                // }
                
                currentLevel.push(newPart);
                currentLevel = newPart.nodes;
            }
        }
    }
    return tree;

    function findWhere(array, key, value) {
        t = 0; // t is used as a counter
        while (t < array.length && array[t][key] !== value) { t++; }; // find the index where the id is the as the aValue

        if (t < array.length) {
            return array[t]
        } else {
            return false;
        }
    }
}