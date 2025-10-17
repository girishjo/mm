function tableToCSV(table) {

    // Variable to store the final csv data
    let csv_data = [];

    // Get each row data
    let rows = table.querySelectorAll('tr:not(.hide)');
    for (let i = 0; i < rows.length; i++) {

        // Get each column data
        let cols = rows[i].querySelectorAll('td,th');

        // Stores each csv row data
        let csvrow = [];
        for (let j = 0; j < cols.length; j++) {

            // Get the text data of each cell
            // of a row and push it to csvrow
            if (cols[j].tagName === 'TD') {
                if (cols[j].classList.contains('number')) {
                    if (cols[j].innerHTML != "") {
                        csvrow.push(parseFloat(cols[j].innerHTML.replace(/,/g, '')));
                    }
                    else {
                        csvrow.push(cols[j].innerHTML);
                    }
                }
                else {
                    csvrow.push(cols[j].innerHTML);
                }
            }
            else {
                csvrow.push(cols[j].innerText);
            }
        }

        // Combine each column value with comma
        csv_data.push(csvrow.join(","));
    }

    // Combine each row data with new line character
    csv_data = csv_data.join('\n');

    // Call this function to download csv file  
    downloadCSVFile(csv_data);

}

function downloadCSVFile(csv_data) {

    // Create CSV file object and feed
    // our csv_data into it
    CSVFile = new Blob([csv_data], {
        type: "text/csv"
    });

    // Create to temporary link to initiate
    // download process
    let temp_link = document.createElement('a');

    // Download csv file
    temp_link.download = "GfG.csv";
    let url = window.URL.createObjectURL(CSVFile);
    temp_link.href = url;

    // This link should not be displayed
    temp_link.style.display = "none";
    document.body.appendChild(temp_link);

    // Automatically click the link to
    // trigger download
    temp_link.click();
    document.body.removeChild(temp_link);
}