var coll = document.getElementsByClassName("collapsible");

for (var i = 0; i < coll.length; i++) {
    coll[i].addEventListener("click", function () {
        this.classList.toggle("active");
        let content = document.getElementById(this.attributes["data"].value)
        if (content.style.display === "block") {
            content.style.display = "none";
            this.innerText = this.innerText.replace("Hide", "Show");
        } else {
            content.style.display = "block";
            this.innerText = this.innerText.replace("Show", "Hide");
        }
    });
}

document.body.addEventListener('click', function (evt) {
    if (evt.target.classList.contains('sort') || evt.target.classList.contains('sort-by')) {
        const header = evt.target.closest('th');
        if (!header) { return; } // Quit, not clicked on a cell        
        sortTable(header);
    }
}, false);

function AddWatchlistCode(value, name) {
    let input = document.createElement("input");
    input.type = "radio";
    input.name = "stockListRadio";
    input.addEventListener('change', () => UpdateWatchList());

    input.value = value;
    input.id = "w" + input.value;

    let label = document.createElement("label");
    label.innerText = name;
    label.setAttribute("for", input.id);

    const watchlistDiv = document.getElementById('watchlistDiv');
    const button = document.getElementById('addWatchlistBtn');

    watchlistDiv.insertBefore(input, button);
    watchlistDiv.insertBefore(label, button);
    return true;
}

function RemoveWatchlistCode(watchlistId) {
    const selectedWatchList = document.getElementById(watchlistId);
    if (selectedWatchList) {
        const selectedLabel = document.querySelector('label[for=' + selectedWatchList.id + ']')
        if (selectedLabel) {
            const watchlistDiv = document.getElementById('watchlistDiv');
            watchlistDiv.removeChild(selectedWatchList);
            watchlistDiv.removeChild(selectedLabel);
            return true;
        }
    }
}