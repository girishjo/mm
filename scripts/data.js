var nseData = { data: {} };
var bseData = { data: {} };
var defaultStockList;

const dataFiles = [
  ['nseOpenClose.json', 'nseDelivery.json', 'nseBulkDeal.json'],
  ['bseOpenClose.json', 'bseDelivery.json', 'bseBulkDeal.json'],
];

var todayDate = new Date();
if (todayDate.getDay() == 0)
  todayDate = new Date(todayDate.setDate(todayDate.getDate() - 2));
else if (todayDate.getDay() == 6)
  todayDate = new Date(todayDate.setDate(todayDate.getDate() - 1));
else if (todayDate.getDay() == 1 && todayDate.getHours() < 9)
  todayDate = new Date(todayDate.setDate(todayDate.getDate() - 3));
else if (todayDate.getHours() < 9) {
  todayDate = new Date(todayDate.setDate(todayDate.getDate() - 1));
}
const todayDateHour = todayDate;
todayDate = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());

window.onload = async () => {

  for (let j = 0; j < dataFiles[0].length; j++) {
    for (let i = 0; i < dataFiles.length; i++) {
      let response = await fetch('./data/' + dataFiles[i][j]);
      let dataJson = await response.json();
      IsUpdateData(dataValidityTable.rows[i + 1].cells[j + 1], dataJson.dateTimeStamp);
      i == 0 && (nseData = MergeData(nseData, dataJson));
      i == 1 && (bseData = MergeData(bseData, dataJson));
    }
  }

  /*
  // #region Open Close
  let response = await fetch('./data/' + dataFiles[0][0]);
  let nseDataJson = await response.json();
  let valid = IsUpdateData(dataValidityTable.rows[1].cells[1], nseDataJson.dateTimeStamp);
  nseData = MergeData(nseData, nseDataJson);
  //nseData = nseDataJson;

  response = await fetch('./data/' + dataFiles[1][0]);
  let bseDataJson = await response.json();
  valid = IsUpdateData(dataValidityTable.rows[2].cells[1], bseDataJson.dateTimeStamp);
  bseData = MergeData(bseData, bseDataJson);
  //bseData = bseDataJson;

  // #endregion Open Close

  // #region Delivery Data
  response = await fetch('./data/' + dataFiles[0][1]);
  nseDataJson = await response.json();
  valid = IsUpdateData(dataValidityTable.rows[1].cells[2], nseDataJson.dateTimeStamp);
  nseData = MergeData(nseData, nseDataJson);

  response = await fetch('./data/' + dataFiles[1][1]);
  bseDataJson = await response.json();
  valid = IsUpdateData(dataValidityTable.rows[2].cells[2], bseDataJson.dateTimeStamp);
  bseData = MergeData(bseData, bseDataJson);

  // #endregion Delivery Data


  // #region Bulk Deals

  response = await fetch('./data/' + dataFiles[0][2]);
  nseDataJson = await response.json();
  valid = IsUpdateData(dataValidityTable.rows[1].cells[3], nseDataJson.dateTimeStamp);
  nseData = MergeData(nseData, nseDataJson);

  response = await fetch('./data/' + dataFiles[1][2]);
  bseDataJson = await response.json();
  valid = IsUpdateData(dataValidityTable.rows[2].cells[3], bseDataJson.dateTimeStamp);
  bseData = MergeData(bseData, bseDataJson);
  // #endregion Bulk Deals
  */

  nseData = nseData.data;
  bseData = bseData.data;

  response = await fetch('./data/defaultStockList.json');
  defaultStockList = await response.json();

  loadDataFromLocal();
};

function IsUpdateData(placeHolder, dateTimeStamp) {
  placeHolder.innerText = dateTimeStamp;
  if (new Date(dateTimeStamp).getDate() != new Date().getDate()) {
    placeHolder.style.background = 'lightcoral';
    return false;
  }
  else {
    placeHolder.style.background = 'lightgreen';
    return true;
  }
}

(async function CheckForLatestData() {
  if (document.getElementById('updatedDataAvailable').style.display != 'block') {
    const oldData = [
      [dataValidityTable.rows[1].cells[1].innerText, dataValidityTable.rows[1].cells[2].innerText, dataValidityTable.rows[1].cells[3].innerText],
      [dataValidityTable.rows[2].cells[1].innerText, dataValidityTable.rows[2].cells[2].innerText, dataValidityTable.rows[2].cells[3].innerText],
    ];

    let flag = true;
    for (let j = 0; j < dataFiles[0].length; j++) {
      for (let i = 0; i < dataFiles.length; i++) {
        let response = await fetch('./data/' + dataFiles[i][j]);
        let dataJson = await response.json();
        if (new Date(dataJson.dateTimeStamp) > new Date(oldData[i][j])) {
          document.getElementById('updatedDataAvailable').style.display = 'block';
          flag = false;
          break;
        }
      }
    }
    flag && setTimeout(CheckForLatestData, 5000);
  }
})();