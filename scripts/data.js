var nseData = { data: {} };
var bseData = { data: {} };
var defaultStockList, settings;

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

window.addEventListener('load', async () => {
  settings = await GetData('settings.json');
  defaultStockList = await GetData('defaultStockList.json');

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
});

async function GetData(fileName) {
  let response = await fetch('./data/' + fileName);
  let dataJson = await response.json();
  return dataJson;
}

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
    let flag = true;
    
    loop1:
    for (let j = 0; j < dataFiles[0].length; j++) {
      for (let i = 0; i < dataFiles.length; i++) {
        let dataJson = GetData(dataFiles[i][j]);
        if (new Date(dataJson.dateTimeStamp) > new Date(dataValidityTable.rows[i + 1].cells[j + 1].innerText)) {
          document.getElementById('updatedDataAvailable').style.display = 'block';
          flag = false;
          break loop1;
        }
      }
    }
    flag && setTimeout(CheckForLatestData, 5 * 60 * 1000);
  }
})();