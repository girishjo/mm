var nseData;
var bseData;
var defaultStockList;

window.onload = async () => {
  let response = await fetch('./data/nsedata.json');
  const nData = await response.json();
  nseData = nData.data;

  response = await fetch('./data/bsedata.json');
  bseData = await response.json();

  response = await fetch('./data/defaultStockList.json');
  defaultStockList = await response.json();

  document.getElementById('nsedate').innerText += " " + nData.timeStamp;
  if (new Date(nData.timeStamp).getDate() != new Date().getDate()) {
    document.getElementById('nsedate').style.background = 'red';
  }

  response = await fetch('./data/datebse.json');
  var bseDate = await response.json();
  document.getElementById('bsedate').innerText += " " + bseDate.DateTime;
  if (new Date(bseDate.DateTime).getDate() != new Date().getDate()) {
    document.getElementById('bsedate').style.background = 'red';
  }

  loadDataFromLocal();
};
