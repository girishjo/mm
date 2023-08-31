var coll = document.getElementsByClassName("collapsible");

for (var i = 0; i < coll.length; i++) {
    coll[i].addEventListener("click", function () {
        this.classList.toggle("active");
        let content = document.getElementById(this.attributes["data"].value)
        if (content.style.display === "block") {
            content.style.display = "none";
        } else {
            content.style.display = "block";
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