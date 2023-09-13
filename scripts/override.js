window.addEventListener('load', async () => {
    if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
        var script = document.createElement('script');
        // script.onload = function () {
        // };
        script.src = '../local/local.js';

        document.body.appendChild(script);
    }
});