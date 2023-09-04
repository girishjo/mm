var nseData = {};
var bseData = {};
var defaultStockList;

window.onload = async () => {

  // #region Open Close
  let response = await fetch('./data/nseOpenClose.json');
  let nseDataJson = await response.json();
  let valid = IsUpdateData(dataValidityTable.rows[1].cells[1], nseDataJson.dateTimeStamp);
  //nseData = Merge(nseData, nseDataJson);
  nseData = nseDataJson;

  response = await fetch('./data/bseOpenClose.json');
  let bseDataJson = await response.json();
  valid = IsUpdateData(dataValidityTable.rows[2].cells[1], bseDataJson.dateTimeStamp);
  //bseData = Merge(bseData, bseDataJson);
  bseData = bseDataJson;

  // #endregion Open Close

  // #region Delivery Data
  response = await fetch('./data/nseDelivery.json');
  nseDataJson = await response.json();
  valid = IsUpdateData(dataValidityTable.rows[1].cells[2], nseDataJson.dateTimeStamp);
  nseData = Merge(nseData, nseDataJson);

  response = await fetch('./data/bseDelivery.json');
  bseDataJson = await response.json();
  valid = IsUpdateData(dataValidityTable.rows[2].cells[2], bseDataJson.dateTimeStamp);
  bseData = Merge(bseData, bseDataJson);

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
        if (oldDate == new Date().toLocaleDateString('en-In', { weekday: "short", year: "numeric", month: "short", day: "2-digit" })) {
          newData.data[stock].BulkDeals.push(bulkDeal);
          //newData.data[stock].BulkDeals.data.sort((a, b) => a.SecurityCode.localeCompare(b.SecurityCode) || a.ClientName.localeCompare(b.ClientName) || a.BuyOrSell.localeCompare(b.BuyOrSell))
        }
        else {
            if(newData.data[stock].History){
            var history = newData.data[stock].History.find(his => his.HistoryDate == oldDate);
            if (history) {
              if (!history.BulkDeals) {
                history.BulkDeals = [];
              }
              history.BulkDeals.push(bulkDeal);
              //history.BulkDeals.data.sort((a, b) => a.SecurityCode.localeCompare(b.SecurityCode) || a.ClientName.localeCompare(b.ClientName) || a.BuyOrSell.localeCompare(b.BuyOrSell))
            }
          }
        }
      }
    }
  }  
  return newData;
}

function MergeRecursive(obj1, obj2) {
  for (var p in obj2) {
      try {
          // Property in destination object set; update its value.
          if (obj2[p].constructor == Object) {
              obj1[p] = MergeRecursive(obj1[p], obj2[p]);

          } else if (obj2[p].constructor == Array) {
              obj1[p] = mergeById(obj1[p], obj2[p]);
              if(p =="History"){
              obj1[p].sort((a, b) => new Date(b.HistoryDate) - new Date(a.HistoryDate));
              }
          }
          else {
              obj1[p] = obj2[p];
          }
      } catch (e) {
          // Property in destination object not set; create it and set its value.
          obj1[p] = obj2[p];
      }
  }
  return obj1;
}

const mergeById = (a1, a2) =>
  a1.map(itm => ({
      ...a2.find((item) => (item.HistoryDate === itm.HistoryDate) && item),
      ...itm
  }));

function Merge(newData, oldData) {
  const oldDate = new Date(oldData.dateTimeStamp).toLocaleDateString('en-In', { weekday: "short", year: "numeric", month: "short", day: "2-digit" });
  const newDate = new Date(newData.dateTimeStamp).toLocaleDateString('en-In', { weekday: "short", year: "numeric", month: "short", day: "2-digit" });

  if (oldDate == newDate) {
      newData = MergeRecursive(newData, oldData);
  }
  else {
      for (const stock of [...Object.keys(newData.data), ...Object.keys(oldData.data)]) {
          if (oldData.data[stock]) {
              if (!newData.data[stock]) {
                  newData.data[stock] = {};
              }

              if (!newData.data[stock].History) {
                  newData.data[stock].History = [];
              }
              while (newData.data[stock].History.length > 10) {
                  newData.data[stock].History.shift();
              }

              var history = newData.data[stock].History.find(his => his.HistoryDate == oldDate);
              if (history) {
                  history = MergeRecursive(history, oldData.data[stock]);
              }
              else {
                  oldData.data[stock].History && newData.data[stock].History.push(...oldData.data[stock].History);
                  delete oldData.data[stock].History;
                  history = {
                      "HistoryDate": oldDate,
                      ...oldData.data[stock]
                  }
                  newData.data[stock].History.push(history);
                  //newData.data[stock].History.sort((a, b) => new Date(b.HistoryDate).localeCompare(new Date(a.HistoryDate)));
              }
          }
      }
  }
  return newData;
}













  // function MergeBulkDealData(mainData, bulkDealData, dateTimeStamp) {
  //   bulkDealData.data.sort((a, b) => a.SecurityCode.localeCompare(b.SecurityCode) || a.ClientName.localeCompare(b.ClientName) || a.BuyOrSell.localeCompare(b.BuyOrSell));
  //   for (let i = 0; i < bulkDealData.data.length; i++) {
  //     const bulkDeal = bulkDealData.data[i];
  //     const stockData = mainData[bulkDeal.SecurityCode];
  //     if (stockData) {
  //       if (new Date(bulkDeal.Date).getDate() == new Date(dateTimeStamp).getDate()) {
  //         if (!stockData.BulkDeals) {
  //           stockData.BulkDeals = [];
  //         }
  //         //delete bulkDeal.SecurityCode;
  //         delete bulkDeal.SecurityName;
  //         stockData.BulkDeals.push(bulkDeal);
  //       }
  //     }
  //   }
  // }
  
  // function MergeRecursive(obj1, obj2) {
  //   for (var p in obj2) {
  //     try {
  //       // Property in destination object set; update its value.
  //       if (obj2[p].constructor == Object) {
  //         obj1[p] = MergeRecursive(obj1[p], obj2[p]);
  
  //       } else if (obj2[p].constructor == Array) {
  //         obj1[p] = mergeById(obj1[p], obj2[p]);
  //       }
  //       else {
  //         obj1[p] = obj2[p];
  //       }
  //     } catch (e) {
  //       // Property in destination object not set; create it and set its value.
  //       obj1[p] = obj2[p];
  //     }
  //   }
  //   return obj1;
  // }
  
  // const mergeById = (a1, a2) =>
  //   a1.map(itm => ({
  //     ...a2.find((item) => (item.HistoryDate === itm.HistoryDate) && item),
  //     ...itm
  //   }));
  
  // function Merge(newData, oldData) {
  //   const oldDate = new Date(oldData.dateTimeStamp).toLocaleDateString('en-In', { weekday: "short", year: "numeric", month: "short", day: "2-digit" });
  //   if (oldDate == new Date().toLocaleDateString('en-In', { weekday: "short", year: "numeric", month: "short", day: "2-digit" })) {
  //     newData = MergeRecursive(newData, oldData);
  //   }
  //   else {
  //     for (var stock in newData.data) {
  //       if (oldData.data[stock]) {
  //         if (!newData.data[stock].History) {
  //           newData.data[stock].History = [];
  //         }
  //         while (newData.data[stock].History.length > 10) {
  //           newData.data[stock].History.shift();
  //         }
  
  //         var history = newData.data[stock].History.find(his => his.HistoryDate == oldDate);
  //         if (history) {
  //           history = MergeRecursive(history, oldData.data[stock]);
  //         }
  //         else {
  //           history = {
  //             "HistoryDate": oldDate,
  //             ...oldData.data[stock]
  //           }
  //           newData.data[stock].History.push(history);
  //         }
  //       }
  //     }
  //   }
  //   return newData;
  // }