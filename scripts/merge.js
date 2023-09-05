
function MergeData(data1, data2) {
    if (!data1 || !data1.dateTimeStamp)
        return data2;

    if (!data2 || !data2.dateTimeStamp)
        return data1;

    const date1 = new Date(data1.dateTimeStamp).setHours(0, 0, 0, 0);
    const date2 = new Date(data2.dateTimeStamp).setHours(0, 0, 0, 0);

    let oldData, newData;
    let result = { dateTimeStamp: "", data: {} };

    if (date1 == date2) {
        result = MergeRecursive(data1, data2);
        return result;
    }
    else if (date1 > date2) {
        oldData = data2;
        newData = data1;
    }
    else {
        oldData = data1;
        newData = data2;
    }

    result.dateTimeStamp = newData.dateTimeStamp ? newData.dateTimeStamp : new Date().toLocaleDateString('en-In', { weekday: "short", year: "numeric", month: "short", day: "2-digit" });

    for (const stockCode of [...new Set([...Object.keys(newData.data), ...Object.keys(oldData.data)])]) {
        const res = {}
        if (newData.data[stockCode]) {
            HandleStockData(newData, stockCode, res);
        }
        if (oldData.data[stockCode]) {
            HandleStockData(oldData, stockCode, res);
        }

        if (res.History) {
            while (res.History.length > 10) {
                res.History.shift();
            }

            res.History.sort((a, b) => new Date(b.HistoryDate) - new Date(a.HistoryDate));
        }

        result.data[stockCode] = res;
    }

    return result;
}

function HandleStockData(data, stockCode, res) {
    if (new Date(data.dateTimeStamp).toDateString() == new Date().toDateString()) {
        res = MergeRecursive(res, data.data[stockCode]);
    }
    else {
        if (!res.History)
            res.History = [];

        if (data.data[stockCode].History) {
            for (let i = 0; i < data.data[stockCode].History.length; i++) {
                const history = data.data[stockCode].History[i];
                let newHist = res.History.find(his => his.HistoryDate == history.HistoryDate);
                if (newHist) {
                    newHist = MergeRecursive(newHist, history);
                }
                else {
                    res.History.push(history);
                }
            }
            delete data.data[stockCode].History;
        }

        if (JSON.stringify(data.data[stockCode]) != "{}") {
            let history = {
                "HistoryDate": new Date(data.dateTimeStamp).toLocaleDateString('en-In', { weekday: "short", year: "numeric", month: "short", day: "2-digit" }),
                ...data.data[stockCode],
            }

            let newHist = res.History.find(his => his.HistoryDate == history.HistoryDate);
            if (newHist) {
                newHist = MergeRecursive(newHist, history);
            }
            else {
                res.History.push(history);
            }
        }
    }
}


function MergeRecursive(obj1, obj2) {
    for (var p in obj2) {
        try {
            // Property in destination object set; update its value.
            if (obj2[p].constructor == Object) {
                obj1[p] = MergeRecursive(obj1[p], obj2[p]);

            } else if (obj2[p].constructor == Array) {
                if (!obj1)
                    obj1 = {};
                if (!obj1[p])
                    obj1[p] = [];

                for (let i = 0; i < obj2[p].length; i++) {
                    const history = obj2[p][i];
                    let newHist = obj1[p].find(his => his.HistoryDate == history.HistoryDate);
                    if (newHist) {
                        newHist = Object.assign(newHist, history);
                    }
                    else {
                        obj1[p].push(history);
                    }
                }
            }
            else {
                obj1[p] = obj2[p];
            }
        } catch (e) {
            // Property in destination object not set; create it and set its value.
            obj1[p] = obj2[p];
        }
    }
    return obj1;
}