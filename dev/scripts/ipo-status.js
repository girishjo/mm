const tableLIT = document.getElementById('tableLIT');

async function CheckLIT() {
    const ipo = document.getElementById('ddlIPO').value;
    const panCards = document.getElementById('panCards').textContent.split('\n');
    for (const pan of panCards) {
        let response = await fetch("https://linkintime.co.in/mipo/IPO.aspx/SearchOnPan", {
            "headers": {
                "accept": "application/json, text/javascript, */*; q=0.01",
                "cache-control": "no-cache",
                "content-type": "application/json; charset=UTF-8",
                "pragma": "no-cache"
            },
            "referrer": "https://linkintime.co.in/mipo/ipoallotment.html",
            "referrerPolicy": "strict-origin-when-cross-origin",
            "body": "{'clientid': '" + ipo + "','PAN': '" + pan + "','key_word': 'PAN'}",
            "method": "POST",
            "mode": "cors",
            "credentials": "include"
        });

        let dataJson = await response.json();
        const parser = new DOMParser();
        const table = parser.parseFromString(dataJson.d, "application/xml").children[0].children[0];
        const data = {};
        for (const child of table.children) {
            data[child] = child.textContent;
        }

        let newRow = addEmptyRow(tableLIT);
        newRow.cells[1].innerText = data.PEMNDG;
        newRow.cells[2].innerText = data.NAME1;
        newRow.cells[3].innerText = data.SHARES;
        newRow.cells[4].innerText = data.offer_price;
        newRow.cells[5].innerText = data.ALLOT;
        newRow.cells[6].innerText = data.AMTADJ;
        if (data.INVCODE == 91 && data.BNKCODE == 0) {
            newRow.cells[7].innerText = "Application bidded but amount not blocked";
        }
    }

    updateRowNumber(tableLIT);
}