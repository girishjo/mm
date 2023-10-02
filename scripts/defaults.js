var defaultWatchlists, settings;
var todayDate, todayDateHour;

window.addEventListener('load', async () => {
    settings = await GetData('settings.json');

    todayDate = GetAWorkingDate(new Date());
    todayDateHour = todayDate;
    todayDate = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());

    defaultWatchlists = await GetData('defaultWatchlists.json');
    if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
        LoadLocalDefaults()
            .then(() => LoadData());
    }
    else {
        LoadData();
    }
});

function GetAWorkingDate(inputDate) {
    inputDate = GetPreviousWorkingDate(inputDate)
    if (IsHoliday(inputDate)) {
        inputDate = GetAWorkingDate(new Date(inputDate.setDate(inputDate.getDate() - 1)).setHours(23, 59, 59));
    }
    return inputDate;
}

function IsHoliday(inputDate) {
    for (let i = 0; i < settings.marketHolidays.length; i++) {
        if (new Date(settings.marketHolidays[i]).toDateString() == inputDate.toDateString()) {
            return true;
        }
    }
    return false;
}