var nseData = { data: {} };
var bseData = { data: {} };
var defaultStockList;

var today = new Date();
if (today.getHours() < 9) {
  today = today.setDate(today.getDate() - 1);
}

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
  nseData = MergeBulkDeals(nseData, nseDataJson);

  response = await fetch('./data/bseBulkDeal.json');
  bseDataJson = await response.json();
  valid = IsUpdateData(dataValidityTable.rows[2].cells[3], bseDataJson.dateTimeStamp);
  bseData = MergeBulkDeals(bseData, bseDataJson);
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

function MergeBulkDeals(newData, oldData) {
  for (var stock in newData.data) {
    if (oldData.data[stock]) {
      if (!newData.data[stock].BulkDeals) {
        newData.data[stock].BulkDeals = [];
      }

      for (let i = 0; i < oldData.data[stock].length; i++) {
        const bulkDeal = oldData.data[stock][i];
        const oldDate = new Date(bulkDeal.Date).toLocaleDateString('en-In', { weekday: "short", year: "numeric", month: "short", day: "2-digit" });
        if (oldDate == new Date(today).toLocaleDateString('en-In', { weekday: "short", year: "numeric", month: "short", day: "2-digit" })) {
          newData.data[stock].BulkDeals.push(bulkDeal);
          //newData.data[stock].BulkDeals.data.sort((a, b) => a.SecurityCode.localeCompare(b.SecurityCode) || a.ClientName.localeCompare(b.ClientName) || a.BuyOrSell.localeCompare(b.BuyOrSell))
        }
        else {
          if (newData.data[stock].History) {
            var history = newData.data[stock].History.find(his => his.HistoryDate == oldDate);
            if (!history) {
              history = { "HistoryDate": oldDate };
              newData.data[stock].History.push(history);
            }
            if (!history.BulkDeals) {
              history.BulkDeals = [];
            }
            history.BulkDeals.push(bulkDeal);
            history.BulkDeals.sort((a, b) => a.SecurityCode.localeCompare(b.SecurityCode) || a.ClientName.localeCompare(b.ClientName) || a.BuyOrSell.localeCompare(b.BuyOrSell));
            newData.data[stock].History.sort((a, b) => new Date(b.HistoryDate) - new Date(a.HistoryDate));
          }
        }
      }
    }
  }
  return newData;
}