var nseData;
var bseData;

window.onload = async () => {
  let response = await fetch('./data/nsedata.json');
  nseData = await response.json();

  response = await fetch('./data/datense.json');
  var nseDate = await response.json();
  document.getElementById('nsedate').innerText += nseDate.DateTime;

  response = await fetch('./data/bsedata.json');
  bseData = await response.json();

  response = await fetch('./data/datebse.json');
  var bseDate = await response.json();
  document.getElementById('bsedate').innerText += bseDate.DateTime;

  loadDataFromLocal();
};
