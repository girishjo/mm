var defaultWatchlists, settings;
var todayDate, todayDateHour;

window.addEventListener('load', async () => {
    UpdateLoader(true, "Downloading default settings", 0.5);
    settings = await GetData('settings.json')
    UpdateSettings(settings, true);

    UpdateLoader(true, "Loading user's settings", 0.5);
    settings = LoadUserSettings(settings);

    //todayDate = GetLastWorkingDay(new Date('02-Nov-2023 11:00:00 PM'));
    todayDate = GetLastWorkingDay(new Date());
    todayDateHour = todayDate;
    todayDate = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());

    UpdateLoader(true, "Downloading default Watchlists", 0.5);
    defaultWatchlists = await GetData('defaultWatchlists.json');
    //UpdateView();
    LoadData();

    if (document.getElementById('notificationDiv')) {
        setTimeout(() => {
            document.getElementById('notificationDiv').style.display = 'none';
        }, 10000);
    }
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
            const tempSettings = JSON.parse(customSettings)
            userSettings = mergeDeep(userSettings, tempSettings);
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

    document.getElementById('moveAddToWatchlist' + (columnIndex - 1) + settings.configs.moveStockTo).checked = true;

    /*
    if (!settings.configs.mb) {
        if (!settingsTable.rows[7].cells[defaultColumn].children[0].checked) {
            settingsTable.rows[7].cells[userSettingsColumn].children[0].disabled = true;
        }
    }
    else {
        settingsTable.rows[7].cells[columnIndex].children[0].checked = settings.configs.mb;
    }

    if (!settings.configs.sme) {
        if (!settingsTable.rows[7].cells[defaultColumn].children[2].checked) {
            settingsTable.rows[7].cells[userSettingsColumn].children[2].disabled = true;
        }
    }
    else {
        settingsTable.rows[7].cells[columnIndex].children[2].checked = settings.configs.sme;
    }
    */

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

    settings.configs.moveStockTo = document.querySelector('input[name="moveAddToWatchlist2"]:checked').value;

    /*
    let mb = settingsTable.rows[7].cells[userSettingsColumn].children[0].checked;
    let sme = settingsTable.rows[7].cells[userSettingsColumn].children[2].checked;

    if (!mb && !sme) {
        mb = true;
        sme = true;
    }

    settings.configs.mb = mb;
    settings.configs.sme = sme;
    */

    window.localStorage.setItem("userSettings", JSON.stringify(settings));
    ShowMessage('Settings saved');
    setTimeout(() => window.location.reload(), 1000);
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



/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

/**
 * Deep merge two objects.
 * @param target
 * @param ...sources
 */
function mergeDeep(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) Object.assign(target, { [key]: {} });
                mergeDeep(target[key], source[key]);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }

    return mergeDeep(target, ...sources);
}