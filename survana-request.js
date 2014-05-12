/* survana-request.js
Implements common request functionality (jsonp, etc)
*/

"use strict";

if (!window.Survana) {
    window.Survana = {};
}

(function (Survana) {

    function post_json(url, data, success, error) {

        var req = new XMLHttpRequest(),
            post_data = JSON.stringify(data);

        function on_request_load() {
            console.log("on_request_load", req.readyState, arguments);
        }

        function on_request_loadend() {
            console.log("on_request_loadend", req.readyState, arguments)
        }

        function on_request_change() {
            console.log("on_request_change", req.readyState, arguments);
        }

        req.onload = on_request_load;
        req.onloadend = on_request_loadend;
        req.onreadystatechange = on_request_change;
        req.onerror = error;
        req.onabort = error;

        req.setRequestHeader("Content-Length", post_data.length);

        req.open("POST", url, true);
        req.send();
    }

    //API
    Survana.Request = {
        'PostJSON': post_json
    };
}(window.Survana));