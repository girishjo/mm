var defaultWatchlists, settings;
var todayDate, todayDateHour;

window.addEventListener('load', async () => {
    UpdateLoader(true, "Downloading default settings", 0.5);
    settings = await GetData('./data/settings.json');
    UpdateSettings(settings, true);

    UpdateLoader(true, "Loading user's settings", 0.5);
    settings = LoadUserSettings(settings);

    todayDate = GetLastWorkingDay(new Date());
    todayDateHour = todayDate;
    todayDate = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());

    UpdateLoader(true, "Downloading default Watchlists", 0.5);
    defaultWatchlists = await GetData('../data/defaultWatchlists.json');
    //UpdateView();
    LoadData();
});

// function UpdateView() {
//     // if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
//     //     LoadLocalDefaults().then(() =>
//     //         LoadData()
//     //     );
//     // }
//     // else {
//     //     LoadData();
//     // }
//     LoadData();
// }

function LoadUserSettings(defaultSettings) {
    let userSettings = defaultSettings;
    if (localStorage.length > 0) {
        let customSettings = localStorage.getItem("userSettings");
        if (customSettings) {
            userSettings = { ...JSON.parse(customSettings) };
        }
    }
    UpdateSettings(userSettings || defaultSettings, false);
    return userSettings;
}

function UpdateSettings(settings, IsDefault) {
    const settingsTable = document.getElementById("settingsTable");
    const defaultColumn = 2, userSettingsColumn = 3;
    const columnIndex = IsDefault ? defaultColumn : userSettingsColumn;

    settingsTable.rows[2].cells[columnIndex].children[0].value = settings.constants.historyDays;

    settingsTable.rows[3].cells[columnIndex].children[0].value = settings.constants.refreshDataTimeOut;

    if (!settings.configs.t2t) {
        ToggleT2TTexts(columnIndex, true);

        if (!settingsTable.rows[4].cells[defaultColumn].children[0].checked) {
            settingsTable.rows[4].cells[userSettingsColumn].children[0].disabled = true;
            ToggleT2TTexts(userSettingsColumn, true);
        }
    }
    else {
        settingsTable.rows[4].cells[columnIndex].children[0].checked = settings.configs.t2t;

        settingsTable.rows[5].cells[columnIndex].children[0].value = settings.configs.t2tTexts[0];
        settingsTable.rows[5].cells[columnIndex].children[2].value = settings.configs.t2tTexts[1];
        settingsTable.rows[5].cells[columnIndex].children[4].value = settings.configs.t2tTexts[2];
    }

    updateRowNumber(settingsTable);
}

function ToggleT2TTexts(columnIndex, disabled) {
    settingsTable.rows[5].cells[columnIndex].children[0].disabled = disabled;
    settingsTable.rows[5].cells[columnIndex].children[2].disabled = disabled;
    settingsTable.rows[5].cells[columnIndex].children[4].disabled = disabled;
}

function SaveSettings() {
    const defaultColumn = 2, userSettingsColumn = 3;
    settings.constants.historyDays = Number(settingsTable.rows[2].cells[userSettingsColumn].children[0].value);
    settings.constants.refreshDataTimeOut = Number(settingsTable.rows[3].cells[userSettingsColumn].children[0].value);
    settings.configs.t2t = settingsTable.rows[4].cells[userSettingsColumn].children[0].checked;
    settings.configs.t2tTexts[0] = settingsTable.rows[5].cells[userSettingsColumn].children[0].value || settingsTable.rows[5].cells[defaultColumn].children[0].value;
    settings.configs.t2tTexts[1] = settingsTable.rows[5].cells[userSettingsColumn].children[2].value || settingsTable.rows[5].cells[defaultColumn].children[2].value;
    settings.configs.t2tTexts[2] = settingsTable.rows[5].cells[userSettingsColumn].children[4].value || settingsTable.rows[5].cells[defaultColumn].children[4].value;

    window.localStorage.setItem("userSettings", JSON.stringify(settings));
    alert('Settings saved');
    window.location.reload();
}

// function LoadLocalDefaults() {
//     return new Promise((res) => {
//         var script = document.createElement('script');
//         script.src = '../scripts/local.js';
//         script.async = false;
//         script.onload = function () {
//             res();
//         };
//         document.body.appendChild(script);
//     })
// }