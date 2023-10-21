async function GetStockData(yahooTicker) {
    const URl = "https://query1.finance.yahoo.com/v8/finance/chart/" + yahooTicker;
    let response = await fetch(URl);
    let result = await response.json();
    return result;
}

async function SearchStock(searchTerm) {
    const URl = "https://query2.finance.yahoo.com/v1/finance/search?q=" + searchTerm + "&lang=en-IN&region=IN";
    let response = await fetch(URl);
    let result = await response.json();
    return result;
}