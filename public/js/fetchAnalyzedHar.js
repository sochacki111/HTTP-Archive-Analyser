const submitButton = document.getElementById('submitButton');
submitButton.addEventListener('click', fetchHarAnalyzedHar);

function fetchHarAnalyzedHar() {
    let urlInput = document.getElementById('urlInput').value;
    let externalResourceRequests = document.getElementById('externalResourceRequests');
    let cookies = document.getElementById('cookies');
    let mediaStructureHeader = document.getElementById('mediaStructureHeader');
    let externalResourceHeader = document.getElementById('externalResourceHeader');
    let cookiesHeader = document.getElementById('cookiesHeader');
    let logger = document.getElementById('logger');

    logger.innerHTML = 'Processing. Please wait a few seconds...';
    logger.style.color = 'blue';
    fetch('/', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: urlInput })
    })
        .then(response => response.json())
        .then(payload => {
            $('#tree').treeview({
                data: payload.mediaStructure
            });

            generateTable(externalResourceRequests, payload.externalResourceRequests);
            generateTable(cookies, payload.cookies);
            mediaStructureHeader.innerHTML = 'Media structure';
            externalResourceHeader.innerHTML = 'External Resource Requests';
            cookiesHeader.innerHTML = 'Cookies';
            logger.innerHTML = 'Success!';
            logger.style.color = 'green';
        })
        .catch((error) => {
            logger.innerHTML = 'Uh oh. Something went wrong. Please try again. Remember to provide full path URL!';
            logger.style.color = 'red';
          });
}

function generateTableHead(table, data) {
    let thead = table.createTHead();
    let row = thead.insertRow();

    data.forEach(key => {
        let th = document.createElement("th");
        let text = document.createTextNode(key);
        th.appendChild(text);
        row.appendChild(th);
    });
}

function generateTable(table, data) {
    // Clear table body
    table.innerHTML = '';
    // Fill table rows with data
    data.forEach(element => {
        let row = table.insertRow();
        for (key in element) {
            let cell = row.insertCell();
            let text = document.createTextNode(element[key]);
            cell.appendChild(text);
        }
    });

    let cookiesTableHeaders = Object.keys(data[0]);
    generateTableHead(table, cookiesTableHeaders);
}