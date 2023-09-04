function addEmptyRow(table, index = undefined) {
    //const emptyRow = table.getElementsByClassName('hide')[0];
    const emptyRow = table.rows[1];
    var clone = emptyRow.cloneNode(true); // copy children too
    clone.classList.remove("hide");
    var newRow = table.insertRow(index ?? index);
    newRow.innerHTML = clone.innerHTML;
    return newRow;
}

function updateRowNumber(table) {
    for (let index = 2; index < table.rows.length; index++) {
        if (!table.rows[index].getAttribute('frozen')) {
            table.rows[index].cells[0].innerText = index - 1;
        }
    }
}

function sortTable(header) {
    var rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
    var table = header.closest('table');
    var n = header.cellIndex;
    switching = true;
    //Set the sorting direction to ascending:
    dir = "asc";
    /*Make a loop that will continue until
    no switching has been done:*/
    while (switching) {
        //start by saying: no switching is done:
        switching = false;
        rows = table.rows;
        /*Loop through all table rows (except the
        first, which contains table headers):*/
        for (i = 2; i < (rows.length - 1); i++) {
            //start by saying there should be no switching:
            shouldSwitch = false;
            /*Get the two elements you want to compare,
            one from current row and one from the next:*/
            if (rows[i].getAttribute('frozen') || rows[i + 1].getAttribute('frozen')) {
                continue;
            }
            x = rows[i].getElementsByTagName("TD")[n];
            y = rows[i + 1].getElementsByTagName("TD")[n];
            /*check if the two rows should switch place,
            based on the direction, asc or desc:*/
            let numX = Number(x.innerText.replace(/,/g, "").replace("%", ""));
            let numY = Number(y.innerText.replace(/,/g, "").replace("%", ""));
            let dateX = new Date(x.innerText);
            let dateY = new Date(y.innerText);
            if (dir == "asc") {
                if (dateX && dateY) {
                    if (dateX > dateY) {
                        //if so, mark as a switch and break the loop:
                        shouldSwitch = true;
                        break;
                    }
                }
                else if (isNaN(numX) || isNaN(numY)) {
                    if (x.innerText.toLowerCase() > y.innerText.toLowerCase()) {
                        //if so, mark as a switch and break the loop:
                        shouldSwitch = true;
                        break;
                    }
                }
                else {
                    if (numX > numY) {
                        //if so, mark as a switch and break the loop:
                        shouldSwitch = true;
                        break;
                    }
                }
            } else if (dir == "desc") {
                if (dateX && dateY) {
                    if (dateX < dateY) {
                        //if so, mark as a switch and break the loop:
                        shouldSwitch = true;
                        break;
                    }
                }
                else if (isNaN(numX) || isNaN(numY)) {
                    if (x.innerText.toLowerCase() < y.innerText.toLowerCase()) {
                        //if so, mark as a switch and break the loop:
                        shouldSwitch = true;
                        break;
                    }
                }
                else {
                    if (numX < numY) {
                        //if so, mark as a switch and break the loop:
                        shouldSwitch = true;
                        break;
                    }
                }
            }
        }
        if (shouldSwitch) {
            /*If a switch has been marked, make the switch
            and mark that a switch has been done:*/
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            switching = true;
            //Each time a switch is done, increase this count by 1:
            switchcount++;
        } else {
            /*If no switching has been done AND the direction is "asc",
            set the direction to "desc" and run the while loop again.*/
            if (switchcount == 0 && dir == "asc") {
                dir = "desc";
                switching = true;
            }
        }
    }
    // if (n > 0) {
    //     updateRowNumber(table);
    // }
}

function resetTable(table) {
    for (let i = 2; i < table.rows.length; i) {
        table.deleteRow(i);
    }
}