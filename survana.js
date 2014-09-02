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
        console.assert(cond, obj);
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

    //Element Helpers

    //returns the value of an element based on its declared field type
    function field_value(element, field_type) {
        //prefer to use field_type as the type of the field represented by 'element'
        switch (field_type) {
            default:
                break; //todo: implement custom components
        }

        switch (element.tagName.toLowerCase()) {
            case 'input':
                switch (element.getAttribute('type')) {
                    case 'radio':
                    case 'checkbox':
                        if (element.checked) {
                            return element.value;
                        }
                        return undefined;
                    default:
                        return element.value;
                }
                break;
            case 'button':
            case 'select':
                return element.value;
            default:
                return undefined;
        }
    }

    /**
     * Group HTMLForm elements by name attribute
     * @param form {HTMLFormElement} The HTML form to scan for elements
     * @returns {Object} key = name of element, value = array of elements with same name
     * @constructor
     */
    function group_elements(form) {
        var result = {},
            el,
            name;

        if (!form.elements) {
            return result;
        }

        for (var i = 0; i < form.elements.length; ++i) {
            el = form.elements[i];
            name = el.getAttribute('name');

            if (!name) {
                continue;
            }

            //skip input element with type 'hidden'
            if (el.getAttribute('type') === 'hidden') {
                continue;
            }

            if (result[name] === undefined) {
                result[name] = [el];
            } else {
                result[name].push(el);
            }
        }

        return result;
    }

    function values_from_group(group, field_type) {
        var result = [],
            value;

        if (!group) {
            return result;
        }

        for (var i = 0; i < group.length; ++i) {
            value = field_value(group[i], field_type);
            if (value !== undefined) {
                result.push(value);
            }
        }

        return result;
    }

    //API
    var Survana = {

        //Properties
        ScriptPath: detect_script_path('survana.js'),
        Version: "1.0.0",

        //Methods
        LoadScript: load_script,
        FieldValue: field_value,
        GroupElements: group_elements,
        ValuesFromGroup: values_from_group,

        //Dev methods
        Assert: assert,
        Error: error,
        Log: log,
        Warn: warn,

        //Switches

        //Schema
        Schema: {}

    };

    window.Survana = window.Survana || {};

    for (var p in Survana) {
        if (!Survana.hasOwnProperty(p)) {
            continue;
        }

        if (window.Survana[p] === undefined || window.Survana[p] === null) {
            window.Survana[p] = Survana[p];
        }
    }
})(window, document);
