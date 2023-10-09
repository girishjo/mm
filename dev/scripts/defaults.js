var defaultWatchlists, settings;
var todayDate, todayDateHour;

window.addEventListener('load', async () => {
    settings = await GetData('./data/settings.json');

    todayDate = GetLastWorkingDay(new Date());
    todayDateHour = todayDate;
    todayDate = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());

    defaultWatchlists = await GetData('../data/defaultWatchlists.json');
    if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
        LoadLocalDefaults()
            .then(() => LoadData());
    }
    else {
        LoadData();
    }
});