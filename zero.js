async function GetDetails(stockCode) {
    const url = "https://stocks.zerodha.com/stocks/" + stockCode;

    let headers = new Headers();
    //headers.append('Content-Type', 'application/json');
    //headers.append('Access-Control-Allow-Origin', 'https://girishjo.github.io/mm/');
    //headers.append('Access-Control-Allow-Credentials', 'true');

    headers.append('Accept', '*/*');

    var requestOptions = {
        mode: 'no-cors',
        method: 'GET',
        redirect: 'follow',
        headers: headers
    };

    const response = await fetch(url, requestOptions);
    let html = await response.text();

    const searchstring1 = '<script id="__NEXT_DATA__" type="application/json">';
    const index1 = html.search(searchstring1);

    if (index1 >= 0) {
        html = html.substring(index1);

        const searchstring2 = '</script>';
        const index2 = html.search(searchstring2);
        html = html.substring(0, index2 + 9);

        const jsonData = html.substring(51, index2);
        const data = JSON.parse(jsonData);
        const quotes = data.props.pageProps.securityQuote;
        const results = new Array(1);
        const info = new Array(3);
        info[0] = quotes.o.toFixed(2);
        info[1] = quotes.price.toFixed(2);
        info[2] = quotes.dyChange.toFixed(2) + " %";
        results[0] = info;
        return results;
    }
}