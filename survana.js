/* survana.js

 Defines an API for all Survana-enabled client-side modules.
    - Auto-detects the path to survana.js
    - Provides method for loading scripts dynamically
    - Defines debug methods (Assert, Error, Log, Warn)
 */

"use strict";

(function (window, document) {

    /** Loads a js file using <script> tags appended to <body>
     * @param path      {String}    Path to the Javascript file
     * @param success   {Function}  The success callback, the first argument is the onload event object
     * @param error     {Function}  The error callback, the first rgument is the onerror event object
     */
    function load_script(path, success, error) {
        var script = document.createElement('script');
        script.setAttribute('src', path);
        script.setAttribute('type', 'text/javascript');

        script.onload = success;
        script.onerror = error;

        //append <script> to this document's <body>
        document.body.appendChild(script);
    }

    /** Searches for the path to a script specified by 'scriptName'
     * @param scriptName {String} The name of the script to search for.
     * @returns {String|null} Path to the 'scriptName', or null if not found
     */
    function detect_script_path(scriptName) {
        //detect script path
        var scripts = document.getElementsByTagName('script'),
            s,
            src;

        for (s in scripts) {
            if (!scripts.hasOwnProperty(s)) {
                continue;
            }

            src = scripts[s].src;
            if (!src) {
                continue;
            }

            //
            if (src.indexOf(scriptName) >= 0) {
                return src.substr(0, src.length - scriptName.length);
            }
        }

        return null;
    }

    function assert(cond, obj) {
        console.assert(cond,obj);
    }

    function log(obj) {
        console.log(obj);
    }

    function warn(obj) {
        console.warn(obj);
    }

    function error(obj) {
        console.error(obj);
    }

    //API
    window.Survana = {

        //Properties
        ScriptPath: detect_script_path('survana.js'),
        Version: "1.0.0",

        //Methods
        LoadScript: load_script,

        //Dev methods
        Assert: assert,
        Error: error,
        Log: log,
        Warn: warn,

        //Switches

        //Schema
        Schema: {}
    };
})(window, document);
