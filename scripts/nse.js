// async function GetNSEDeliveryDetails(date = "17082023") {
//     url = "https://archives.nseindia.com/archives/equities/mto/MTO_" + date + ".DAT";

//     var requestOptions = {
//         mode: 'no-cors',
//         method: 'GET',
//         redirect: 'follow',
//         credentials: 'include'
//     };

//     fetch(url, requestOptions)
//         .then(response => response.text())
//         .then(result => {
//             console.log(result)
//         })
//         .catch(error => console.log('error', error));
// }

const response = await fetch('./data/nsedata.json');
var nseData = await response.json();
