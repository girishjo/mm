var defaultStockList, settings;

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
});