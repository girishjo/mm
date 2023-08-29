var nseData;
var bseData;
var defaultStockList;

window.onload = async () => {
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

  response = await fetch('./data/bsedata.json');
  bseData = await response.json();

  response = await fetch('./data/defaultStockList.json');
  defaultStockList = await response.json();

  response = await fetch('./data/datebse.json');
  var bseDate = await response.json();
  document.getElementById('bseDeliveryDate').innerText += " " + bseDate.DateTime;
  if (new Date(bseDate.DateTime).getDate() != new Date().getDate()) {
    document.getElementById('bseDeliveryDate').style.background = 'red';
  }

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