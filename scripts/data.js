var nseData = { data: {} };
var bseData = { data: {} };
var defaultStockList;

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

  // #region Open Close
  let response = await fetch('./data/nseOpenClose.json');
  let nseDataJson = await response.json();
  let valid = IsUpdateData(dataValidityTable.rows[1].cells[1], nseDataJson.dateTimeStamp);
  nseData = MergeData(nseData, nseDataJson);
  //nseData = nseDataJson;

  response = await fetch('./data/bseOpenClose.json');
  let bseDataJson = await response.json();
  valid = IsUpdateData(dataValidityTable.rows[2].cells[1], bseDataJson.dateTimeStamp);
  bseData = MergeData(bseData, bseDataJson);
  //bseData = bseDataJson;

  // #endregion Open Close

  // #region Delivery Data
  response = await fetch('./data/nseDelivery.json');
  nseDataJson = await response.json();
  valid = IsUpdateData(dataValidityTable.rows[1].cells[2], nseDataJson.dateTimeStamp);
  nseData = MergeData(nseData, nseDataJson);

  response = await fetch('./data/bseDelivery.json');
  bseDataJson = await response.json();
  valid = IsUpdateData(dataValidityTable.rows[2].cells[2], bseDataJson.dateTimeStamp);
  bseData = MergeData(bseData, bseDataJson);

  // #endregion Delivery Data


  // #region Bulk Deals

  response = await fetch('./data/nseBulkDeal.json');
  nseDataJson = await response.json();
  valid = IsUpdateData(dataValidityTable.rows[1].cells[3], nseDataJson.dateTimeStamp);
  nseData = MergeData(nseData, nseDataJson);

  response = await fetch('./data/bseBulkDeal.json');
  bseDataJson = await response.json();
  valid = IsUpdateData(dataValidityTable.rows[2].cells[3], bseDataJson.dateTimeStamp);
  bseData = MergeData(bseData, bseDataJson);
  // #endregion Bulk Deals

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