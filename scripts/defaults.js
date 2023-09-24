var defaultWatchlists, settings;
var todayDate, todayDateHour;

window.addEventListener('load', async () => {
    settings = await GetData('settings.json');

    todayDate = GetNotAHolidayDate(new Date());
    todayDate = GetPreviousWorkingDate(todayDate);
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

function GetNotAHolidayDate(date) {
    for (let i = 0; i < settings.marketHolidays.length; i++) {
        const holiday = new Date(settings.marketHolidays[i]);
        if (holiday.toDateString() == date.toDateString()) {
            date = new Date(date.setDate(date.getDate() - 1));
            date.setHours(23, 59, 59);
            return GetNotAHolidayDate(date);
        }
    }
    return date;
}