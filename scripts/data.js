var nseData = {};
var bseData = {};
var defaultStockList;

window.onload = async () => {
  /// NSE
  let response = await fetch('./data/nseDelivery.json');
  let nData = await response.json();
  nseData = nData.data;

  document.getElementById('nseDeliveryDate').innerText += " " + nData.deliveryTimeStamp;
  if (new Date(nData.deliveryTimeStamp).getDate() != new Date().getDate()) {
    document.getElementById('nseDeliveryDate').style.background = 'red';
  }

  response = await fetch('./data/nseOpenClose.json');
  nData = await response.json();
  nseData = MergeRecursive(nseData, nData.data);

  document.getElementById('nseOpenCloseDate').innerText += " " + nData.bhavTimeStamp;
  if (new Date(nData.bhavTimeStamp).getDate() != new Date().getDate()) {
    document.getElementById('nseOpenCloseDate').style.background = 'red';
  }

  /// BSE
  response = await fetch('./data/bseDelivery.json');
  let bData = await response.json();
  bseData = bData.data;

  document.getElementById('bseDeliveryDate').innerText += " " + bData.deliveryTimeStamp;
  if (new Date(bData.deliveryTimeStamp).getDate() != new Date().getDate()) {
    document.getElementById('bseDeliveryDate').style.background = 'red';
  }

  response = await fetch('./data/bseOpenClose.json');
  bData = await response.json();
  bseData = MergeRecursive(bseData, bData.data);

  document.getElementById('bseOpenCloseDate').innerText += " " + bData.bhavTimeStamp;
  if (new Date(bData.bhavTimeStamp).getDate() != new Date().getDate()) {
    document.getElementById('bseOpenCloseDate').style.background = 'red';
  }
  /*
  response = await fetch('./data/bsedata.json');
  bseData = await response.json();

  
  response = await fetch('./data/datebse.json');
  var bseDate = await response.json();
  document.getElementById('bseDeliveryDate').innerText += " " + bseDate.DateTime;
  if (new Date(bseDate.DateTime).getDate() != new Date().getDate()) {
    document.getElementById('bseDeliveryDate').style.background = 'red';
  }*/

  response = await fetch('./data/defaultStockList.json');
  defaultStockList = await response.json();

  loadDataFromLocal();
};

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