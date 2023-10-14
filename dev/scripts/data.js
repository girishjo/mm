var nseData = { data: {} };
var bseData = { data: {} };

const dataFiles = [
  ['nseOpenClose.json', 'nseDelivery.json', 'nseBulkDeal.json'],
  ['bseOpenClose.json', 'bseDelivery.json', 'bseBulkDeal.json'],
];

async function LoadData() {
  const messages = [
    ['Nse Open Close data', 'Nse Delivery data', 'Nse Bulk Deals data'],
    ['Bse Open Close data', 'Bse Delivery data', 'Bse Bulk Deals data'],
  ];

  for (let j = 0; j < dataFiles[0].length; j++) {
    for (let i = 0; i < dataFiles.length; i++) {
      UpdateLoader(true, 'Downloading ' + messages[i][j]);
      let dataJson = await GetData('../data/' + dataFiles[i][j]);
      IsUpdateData(dataValidityTable.rows[i + 1].cells[j + 1], dataJson.dateTimeStamp);
      i == 0 && (nseData = MergeData(nseData, dataJson));
      i == 1 && (bseData = MergeData(bseData, dataJson));
    }
  }

  if (settings.configs.t2t) {
    UpdateLoader(true, "Checking for T2T stocks", 0.5);
    CheckForT10(nseData);
    CheckForT10(bseData);
  }

  nseData = nseData.data;
  bseData = bseData.data;

  loadDataFromLocal();
  UpdateLoader(false);
  setTimeout(CheckForLatestData, settings.constants.refreshDataTimeOut * 60 * 1000);
}

function CheckForT10(result) {
  for (const stockCode of Object.keys(result.data)) {
    let res = result.data[stockCode];
    if (res.History) {
      var d = new Date(res.History[res.History.length - 1].HistoryDate);
      d.setDate(d.getDate() + 13 + CheckDateRange(res.History[res.History.length - 1].HistoryDate));

      const prevDate = GetLastWorkingDay(d);
      const nextDate = GetNextWorkingDay(d);

      switch (todayDate.toDateString()) {
        case prevDate.toDateString():
          res["T2T"] = 0;
          break;
        case d.toDateString():
          res["T2T"] = 1;
          break;
        case nextDate.toDateString():
          res["T2T"] = 2;
          break;
      }
    }
  }
}

function CheckDateRange(startDateString) {
  let holidayCounter = 0;

  const start = new Date(startDateString);
  const end = todayDate;

  for (let i = 0; i < settings.marketHolidays.length; i++) {
    const date = new Date(settings.marketHolidays[i]);
    if (date > start && date <= end) {
      ++holidayCounter;
    }
  }
  return holidayCounter;
}

function IsUpdateData(placeHolder, dateTimeStamp) {
  placeHolder.innerText = dateTimeStamp;
  if (new Date(dateTimeStamp).getDate() != todayDate.getDate()) {
    placeHolder.style.background = 'lightcoral';
    return false;
  }
  else {
    placeHolder.style.background = 'lightgreen';
    return true;
  }
}

async function CheckForLatestData() {
  if (document.getElementById('updatedDataAvailable').style.display != 'block') {
    let flag = true;

    loop1:
    for (let j = 0; j < dataFiles[0].length; j++) {
      for (let i = 0; i < dataFiles.length; i++) {
        let dataJson = await GetData('../data/' + dataFiles[i][j]);
        if (new Date(dataJson.dateTimeStamp) > new Date(dataValidityTable.rows[i + 1].cells[j + 1].innerText)) {
          document.getElementById('updatedDataAvailable').style.display = 'block';
          flag = false;
          break loop1;
        }
      }
    }
    flag && setTimeout(CheckForLatestData, settings.constants.refreshDataTimeOut * 60 * 1000);
  }
};

// async function CheckForLatestData() {
//   if (document.getElementById('updatedDataAvailable').style.display != 'block') {

//     let flags = new Array(2);
//     flags[0] = new Array(3).fill(true);
//     flags[1] = new Array(3).fill(true);

//     loop1:
//     for (let j = 0; j < dataFiles[0].length; j++) {
//       for (let i = 0; i < dataFiles.length; i++) {
//         let dataJson = await GetData('../data/' +dataFiles[i][j]);
//         if (new Date(dataJson.dateTimeStamp) > new Date(dataValidityTable.rows[i + 1].cells[j + 1].innerText)) {
//           document.getElementById('updatedDataAvailable').style.display = 'block';
//           flags[i][j] = false;
//           break loop1;
//         }
//         else if (new Date(dataJson.dateTimeStamp).getTime() == new Date(dataValidityTable.rows[i + 1].cells[j + 1].innerText).getTime()) {
//           flags[i][j] = false;
//         }
//       }
//     }
//     flags.flat().indexOf(true) != -1 && setTimeout(CheckForLatestData, settings.constants.refreshDataTimeOut* 60 * 1000);
//   }
// };