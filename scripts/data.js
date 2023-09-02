var nseData = {};
var bseData = {};
var defaultStockList;

window.onload = async () => {

  // #region Open Close
  let response = await fetch('./data/nseOpenClose.json');
  let nData = await response.json();
  nseData = nData.data;
  IsUpdateData(dataValidityTable.rows[1].cells[1], nData.bhavTimeStamp);

  response = await fetch('./data/bseOpenClose.json');
  let bData = await response.json();
  bseData = bData.data;
  IsUpdateData(dataValidityTable.rows[2].cells[1], bData.bhavTimeStamp);

  // #endregion Open Close

  // #region Delivery Data
  response = await fetch('./data/nseDelivery.json');
  nData = await response.json();
  nseData = MergeRecursive(nseData, nData.data);
  IsUpdateData(dataValidityTable.rows[1].cells[2], nData.deliveryTimeStamp);

  response = await fetch('./data/bseDelivery.json');
  bData = await response.json();
  bseData = MergeRecursive(bseData, bData.data);
  IsUpdateData(dataValidityTable.rows[2].cells[2], bData.deliveryTimeStamp);

  // #endregion Delivery Data


  // #region Bulk Deals

  response = await fetch('./data/bseBulkDeal.json');
  var bseBulkData = await response.json();
  MergeBulkDealData(bseData, bseBulkData, bData.deliveryTimeStamp);
  IsUpdateData(dataValidityTable.rows[2].cells[3], bseBulkData.bulkTimeStamp);

  response = await fetch('./data/nseBulkDeal.json');
  var nseBulkData = await response.json();
  MergeBulkDealData(nseData, nseBulkData, nData.deliveryTimeStamp);
  IsUpdateData(dataValidityTable.rows[1].cells[3], nseBulkData.bulkTimeStamp);

  // #endregion Bulk Deals

  response = await fetch('./data/defaultStockList.json');
  defaultStockList = await response.json();

  loadDataFromLocal();
};

function IsUpdateData(placeHolder, dateTimeStamp) {
  placeHolder.innerText = dateTimeStamp;
  if (new Date(dateTimeStamp).getDate() != new Date().getDate()) {
    placeHolder.style.background = 'lightcoral';
  }
  else {
    placeHolder.style.background = 'lightgreen';
  }
}

function MergeBulkDealData(mainData, bulkDealData, dateTimeStamp) {
  bulkDealData.data.sort((a, b) => a.SecurityCode.localeCompare(b.SecurityCode) || a.ClientName.localeCompare(b.ClientName) || a.BuyOrSell.localeCompare(b.BuyOrSell));
  for (let i = 0; i < bulkDealData.data.length; i++) {
    const bulkDeal = bulkDealData.data[i];
    const stockData = mainData[bulkDeal.SecurityCode];
    if (stockData) {
      if (new Date(bulkDeal.Date).getDate() == new Date(dateTimeStamp).getDate()) {
        if (!stockData.BulkDeals) {
          stockData.BulkDeals = [];
        }
        //delete bulkDeal.SecurityCode;
        delete bulkDeal.SecurityName;
        stockData.BulkDeals.push(bulkDeal);
      }
    }
  }
}

function MergeRecursive(obj1, obj2) {

  for (var p in obj2) {
    try {
      // Property in destination object set; update its value.
      if (obj2[p].constructor == Object) {
        obj1[p] = MergeRecursive(obj1[p], obj2[p]);

      } else {
        obj1[p] = obj2[p];

      }

    } catch (e) {
      // Property in destination object not set; create it and set its value.
      obj1[p] = obj2[p];

    }
  }
  return obj1;
}