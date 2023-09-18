function LoadLocalDefaults() {
    return new Promise((res) => {
        var script = document.createElement('script');
        script.src = '../local/local.js';
        script.async = false;
        script.onload = function () {
            res();
        };
        document.body.appendChild(script);
    })
}