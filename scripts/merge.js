function MergeData(data1, data2) {
    if (!data1 || !data1.dateTimeStamp) {
        CheckHistoryLength(data2);
        return data2;
    }

    if (!data2 || !data2.dateTimeStamp) {
        CheckHistoryLength(data1);
        return data1;
    }

    const date1 = new Date(data1.dateTimeStamp).setHours(0, 0, 0, 0);
    const date2 = new Date(data2.dateTimeStamp).setHours(0, 0, 0, 0);

    let oldData, newData;
    let result = { dateTimeStamp: "", data: {} };

    if (date1 == date2) {
        result = MergeRecursive(data1, data2);
        CheckHistoryLength(result);
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
        let res = {}
        if (newData.data[stockCode]) {
            res = newData.data[stockCode];
        }
        if (oldData.data[stockCode]) {
            HandleStockData(oldData, stockCode, res);
        }
        result.data[stockCode] = res;
    }

    CheckHistoryLength(result);
    return result;
}

function CheckHistoryLength(result) {
    for (const stockCode of Object.keys(result.data)) {
        let res = result.data[stockCode];
        if (res.History) {
            res.History.sort((a, b) => new Date(b.HistoryDate) - new Date(a.HistoryDate));
            while (res.History.length > 10) {
                res.History.pop();
            }
        }
    }
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

function MergeRecursive(target, source) {
    if (typeof target == "object" && typeof source == "object") {
        for (const key in source) {
            if (source[key] === null && (target[key] === undefined || target[key] === null)) {
                target[key] = null;
            } else if (source[key] instanceof Array) {
                if (!target[key]) target[key] = [];
                //concatenate arrays
                //target[key] = target[key].concat(source[key]);

                for (let i = 0; i < source[key].length; i++) {
                    const history = source[key][i];
                    let newHist = target[key].find(his => his.HistoryDate == history.HistoryDate);
                    if (newHist) {
                        newHist = this.MergeRecursive(newHist, history);
                    }
                    else {
                        target[key].push(history);
                    }
                }
            } else if (typeof source[key] == "object") {
                if (!target[key]) target[key] = {};
                this.MergeRecursive(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
    }
    return target;
}