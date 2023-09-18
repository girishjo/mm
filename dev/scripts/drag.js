var row;

function DragStart() {
    row = event.target;
}

function DragOver() {
    var e = event;
    e.preventDefault();

    let children = Array.from(e.target.parentNode.parentNode.children);

    if (children.indexOf(e.target.parentNode) > children.indexOf(row))
        e.target.parentNode.after(row);
    else
        e.target.parentNode.before(row);

    updateRowNumber(listTable);
}