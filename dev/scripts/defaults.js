var defaultWatchlists, settings;

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
    settings = await GetData('./data/' + 'settings.json');
    defaultWatchlists = await GetData('../data/' + 'defaultWatchlists.json');
    if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
        LoadLocalDefaults()
            .then(() => LoadData());
    }
    else {
        LoadData();
    }
});