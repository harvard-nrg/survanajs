/* survana-queue.js
A locally-stored response queue to preserve responses across page loads.

Dependencies:   survana-storage.js
                survana-request.js
*/

"use strict";

if (!window.Survana) {
    window.Survana = {};
}

(function (Survana) {

    if (!Survana.Storage || !Survana.Storage.IsAvailable) {
        console.error("Survana.Queue: Survana.Storage is not available.");
    }

    var queue = {};

    /** Handles Survana.Storage errors
     * @param e {Error} The Error object
     */
    function on_storage_error(e) {
        console.error("Survana.Queue:", e);
    }

    /** Add new response to the queue
     * @param response  {Object}    The new response to record
     * @param success   {Function}  The success callback
     * @param error     {Function}  The error callback
     */
    function add(response, success, error) {
        var time = String((new Date()).valueOf()),
            random = String(Math.ceil(Math.random() * 1000)),
            key = 'response-' + time + "-" + random;


        //update queue
        queue[key] = response;

        //save to storage, return the whole queue when done
        Survana.Storage.Set(key, response, function () {
            success && success(queue);
        }, error);
    }

    /** Returns the queue
     * @returns {Object} The Queue
     */
    function get_queue() {
        return queue;
    }

    /** Sends the entire queue as a JSONP request to the specified URL
     * @param url       {String}    The endpoint URL that accepts a JSON object as a GET parameter
     * @param success   {Function}  The success callback
     * @param error     {Function}  The error callback
     */
    function send(url, success, error) {
        Survana.PostJSON(url,
            queue,
            function () {
                console.log('PostJSON success', arguments);
                success && success();
            },
            function () {
                console.log('PostJSON failure', arguments);
                error && error(new Error("PostJSON request failed"));
            }
        );
    }

    if (!Survana.DesignerMode) {

        //update the queue
        Survana.Storage.All('response', function (result) {
            queue = result;
        }, on_storage_error);

        //Queue API
        Survana.Queue = {
            'Add': add,
            'Remove': Survana.Storage.Remove,
            'Get': get_queue,
            'Send': send
        };
    }
}(window.Survana));