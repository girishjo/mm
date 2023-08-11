function loadDataFromLocal() {
    if (document.cookie.length != 0) {
        var cookieArray = document.cookie.split("=");
        const jsonData = JSON.parse(cookieArray[1]);
        for (let i = 0; i < jsonData.length; i++) {
            const rowData = jsonData[i];
            addRow(rowData);
        }
        if (table.rows.length == 2) {
            addEmptyRow(table, 1);        
        }
        updateRowNumber();
    }
}

function addRow(rowData) {
    if (rowData[0]) {
        addEmptyRow(table, table.rows.length - 1);
        const newRow = table.rows[table.rows.length - 2];
        newRow.cells[3].innerText = rowData[0];
        newRow.cells[4].innerText = rowData[1];
        newRow.cells[5].innerText = rowData[2];
        newRow.cells[6].innerText = rowData[3];
    }
}

function saveDataOnLocal() {
    const jsonStr = JSON.stringify(toObject(table));
    document.cookie = "stocksList=" + jsonStr;
}

const table = document.querySelector('#stocksList');
table.addEventListener('click', function (e) {
    const cell = e.target.closest('td');
    if (!cell) { return; } // Quit, not clicked on a cell
    const row = cell.parentElement;
    console.log(cell.innerHTML, row.rowIndex, cell.cellIndex);
    if (cell.classList.contains('add')) {
        addEmptyRow(table, row.rowIndex + 1);
        updateRowNumber();
    }
    else if (cell.classList.contains('remove')) {
        table.deleteRow(row.rowIndex);
        if (table.rows.length == 2) {
            addEmptyRow(table, 1);
        }
        updateRowNumber();
    }
});

function addEmptyRow(table, index = undefined) {
    const emptyRow = table.getElementsByClassName('hide')[0];
    var clone = emptyRow.cloneNode(true); // copy children too
    clone.classList.remove("hide");
    var newRow = table.insertRow(index ?? index);
    newRow.outerHTML = clone.outerHTML;
    return newRow;
}

function updateRowNumber() {
    for (let index = 1; index < table.rows.length; index++) {
        table.rows[index].cells[0].innerText = index;
    }
}