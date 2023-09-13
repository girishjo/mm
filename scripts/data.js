var nseData = { data: {} };
var bseData = { data: {} };

const dataFiles = [
  ['nseOpenClose.json', 'nseDelivery.json', 'nseBulkDeal.json'],
  ['bseOpenClose.json', 'bseDelivery.json', 'bseBulkDeal.json'],
];

async function LoadData() {
  for (let j = 0; j < dataFiles[0].length; j++) {
    for (let i = 0; i < dataFiles.length; i++) {
      let dataJson = await GetData(dataFiles[i][j]);
      IsUpdateData(dataValidityTable.rows[i + 1].cells[j + 1], dataJson.dateTimeStamp);
      i == 0 && (nseData = MergeData(nseData, dataJson));
      i == 1 && (bseData = MergeData(bseData, dataJson));
    }
  }
  nseData = nseData.data;
  bseData = bseData.data;

  loadDataFromLocal();
  setTimeout(CheckForLatestData, settings.constants.refreshDataTimeOut);
}

function IsUpdateData(placeHolder, dateTimeStamp) {
  placeHolder.innerText = dateTimeStamp;
  if (new Date(dateTimeStamp).getDate() != new Date(todayDate).getDate()) {
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
        let dataJson = await GetData(dataFiles[i][j]);
        if (new Date(dataJson.dateTimeStamp) > new Date(dataValidityTable.rows[i + 1].cells[j + 1].innerText)) {
          document.getElementById('updatedDataAvailable').style.display = 'block';
          flag = false;
          break loop1;
        }
      }
    }
    flag && setTimeout(CheckForLatestData, settings.constants.refreshDataTimeOut);
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
//         let dataJson = await GetData(dataFiles[i][j]);
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
//     flags.flat().indexOf(true) != -1 && setTimeout(CheckForLatestData, settings.constants.refreshDataTimeOut);
//   }
// };