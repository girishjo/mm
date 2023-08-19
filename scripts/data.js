var nseData;
var bseData;

window.onload = async () => {
  let response = await fetch('./data/nsedata.json');
  nseData = await response.json();

  response = await fetch('./data/bsedata.json');
  bseData = await response.json();

  loadDataFromLocal();
};
