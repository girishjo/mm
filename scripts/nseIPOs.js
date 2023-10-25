var newNseIpos = [];

async function GetNseIPOs() {
    let response = await fetch('https://www.nseindia.com/api/new-listing-today-ipo?index=NewListing');
    let dataJson = await response.json();
    newNseIpos.push(...dataJson.data);
}