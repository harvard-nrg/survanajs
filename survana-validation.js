/*************
 * VALIDATION *
 *************/

"use strict";

window.Survana = window.Survana || {};

(function (document, Survana) {
    var validation_config = {};

    Survana.Validation = Survana.Validation || {};

    Survana.Validation.NO_VALIDATION = 's-no-validation';
    Survana.Validation.INVALID = 's-invalid';

    /** Extracts validation configuration from all questions.
     * @param form {Object} The form JSON
     * @returns {Object}
     */
    Survana.Validation.ExtractConfiguration = function (form) {

        if (!form || !form.fields) {
            return null
        }

        var config = {},
            nfields = form.fields.length,
            i,
            q;

        //loop over all fields and extraction 'validation' config objects into
        //a central 'config' object, with each key being the id of the question
        for (i = 0; i < nfields; ++i) {
            q = form.fields[i];

            if (q.validation !== undefined) {
                config[q.id] = q.validation;
                config[q.id].type = q.type;
            }
        }

        return config;
    };

    /**
     * Caches the configuration and messages of a form based on its ID
     * @param form_id {String} ID of the form
     * @param config {Object} Validation configuration
     * @param messages {Object} (optional) Validation messages
     * @constructor
     */
    Survana.Validation.SetConfiguration = function (form_id, config, messages) {
        validation_config[form_id] = {
            config: config,
            messages: messages || Survana.Validation.Messages
        };
    };

    Survana.Validation.Skip = function (question_id) {
        var question = document.getElementById(question_id),
            children,
            cl;

        if (question === undefined || !question) {
            return
        }

        cl = question.classList;

        //mark the question for no validation
        cl.remove(Survana.Validation.INVALID);

        children = question.querySelectorAll('input,select');

        //mark all inputs for no validation
        for (var i = 0; i < children.length; ++i) {
            children[i].classList.add(Survana.Validation.NO_VALIDATION);
        }
    };

    /* constraint: function (values, target, groups) { }
     @param values {Array} List of values to validate
     @param constraint value {*} The constraint value specified in the validation schema
     @param fields {Object} All known values in the form, grouped by their question ID
     */
    Survana.Validation.Constraints = {
        'equal': function (values, target, fields) {
            var target_field,
                target_values,
                i;

            if (values === undefined || values === null) {
                return false;
            }

            target_field = fields[target];
            if (!target_field) {
                Survana.Error('Field "' + target + '" does not exist.');
                return false;
            }

            target_values = Survana.ValuesFromGroup(target_field);
            if (values.length !== target_values.length) {
                return false;
            }

            //stringify all the values from 'target_values'
            for (i = 0; i < target_values.length; ++i) {
                target_values[i] = String(target_values[i]);
            }

            //search for each item from 'values' in 'target_values'
            //alternate implementation: sort both arrays and compare items with 1 loop
            for (i = 0; i < values.length; ++i) {
                //if even 1 item could not be found, the constrained failed
                if (target_values.indexOf(String(values[i])) < 0) {
                    return false;
                }
            }

            return true;
        },
        optional: function (values, is_optional) {
            if (is_optional) {
                return true;
            }

            if (!values || !values.length) {
                return false;
            }

            //check all values: if they're undefined, null or empty strings, then
            //the constraint wasn't satisfied
            for (var i = 0; i < values.length; ++i) {
                if (values[i] === undefined || values[i] === null || values[i] === "") {
                    return false;
                }
            }

            return true;
        },
        max: function (values, max_value) {
            if (values === undefined || !values.length) {
                return false;
            }

            max_value = parseFloat(max_value);
            if (isNaN(max_value) || (max_value === Infinity)) {
                return false;
            }

            var v;

            for (var i = 0; i < values.length; ++i) {
                v = parseFloat(values[i]);
                if (isNaN(v) || (v === Infinity) || (v > max_value)) {
                    return false;
                }
            }

            return true;
        },

        min: function (values, min_value) {
            if (values === undefined || !values.length) {
                return false;
            }

            min_value = parseFloat(min_value);
            if (isNaN(min_value) || (min_value === Infinity)) {
                return false;
            }

            var v;

            for (var i = 0; i < values.length; ++i) {
                //convert each value to float and compare it with min_value
                v = parseFloat(values[i]);
                if (isNaN(v) || (v === Infinity) || (v < min_value)) {
                    return false;
                }
            }

            return true;
        }
    };

    function invalid(field, constraint_name, constraint_value, src_input) {
        var message = (Survana.Validation.Messages[constraint_name] &&
                Survana.Validation.Messages[constraint_name](constraint_value)) ||
                Survana.Validation.Messages.invalid,
            question = document.getElementById(field);

        if (!question) {
            console.error('No such question:', field);
            return;
        }

        question.classList.add(Survana.Validation.INVALID);

        //call the theme's error message handler
        if (Survana.Validation.ShowMessage) {
            Survana.Validation.ShowMessage(question, message, src_input);
        }
    }

    function valid(field) {
        var question = document.getElementById(field);

        if (!question) {
            console.error('No such question:', field);
            return;
        }

        question.classList.remove(Survana.Validation.INVALID);

        if (Survana.Validation.HideMessage) {
            Survana.Validation.HideMessage(question);
        }
    }


    /**
     * Validates all the constraints of a single field. Calls invalid() if validation fails.
     * @param field {Object} The Schema field to validate
     * @param elements {Object} All form elements grouped by name
     * @returns {Boolean} False if validation fails, Group values otherwise
     */
    Survana.Validation.ValidateField = function (field, elements) {
        var result = false,
            //find the controls responsible for this field
            group = elements[field.id],
            constraint_name,
            constraint_value,
            values;

        if (!group) {
            return false;
        }

        //aggregate the values in the group
        values = Survana.ValuesFromGroup(group, field.type);

        //check all user-specified constraints
        for (constraint_name in field.validation) {
            if (!field.validation.hasOwnProperty(constraint_name)) {
                continue;
            }

            if (!Survana.Validation.Constraints[constraint_name]) {
                Survana.Error("Unknown validation constraint:", constraint_name);
                return false;
            }

            constraint_value = field.validation[constraint_name];

            //verify constraint
            if (!Survana.Validation.Constraints[constraint_name](values, constraint_value, elements)) {
                console.log('Constraint', constraint_name, '=', constraint_value, 'failed validation; values=', values, 'elements=', elements);
                invalid(field.id, constraint_name, constraint_value);
                return false;
            }
        }

        //mark the field as valid
        valid(field);

        return true;
    };

    /**
     * Validate <form> elements, based on a validation configuration pre-built when publishing the form
     * and custom validation messages. Returns all validated responses.
     * @param form {HTMLFormElement} The HTMLFormElement being validated
     * @param schemata {Object} (optional) The form schemata
     * @param messages {Object} (optional) Custom error messages
     * @return {Boolean} Returns all validated responses as an Object, or false if validation failed
     */
    Survana.Validation.Validate = function (form, schemata, messages) {
        var field,
            elements,
            values,
            i,
            result;

        if (!form) {
            Survana.Error('No validation form supplied to Survana.Validate');
            return false;
        }

        //if no schema was provided, attempt to fetch it from Survana.Schema
        schemata = schemata || Survana.Schema[form.id];
        if (!schemata) {
            Survana.Error('No Schema found for form ' + form.id);
            return false;
        }

        //group all HTMLElements by their name attribute
        elements = Survana.GroupElements(form);

        //assume the form is valid
        result = true;

        //loop through all known fields
        for (i = 0; i < schemata.fields.length; ++i) {
            field = schemata.fields[i];

            if (!Survana.Validation.ValidateField(field, elements)) {
                result = false;
            }
        }

        return result;
    };

    /** onblur event handler
     * @param el {HTMLElement} The Blur event object
     * @param form_config {Object} (optional) Validation configuration
     */
    Survana.Validation.OnBlur = function (el, form_config) {
        console.log('onblur', el);

        var form_id = el.getAttribute("data-form"),
            field_name = el.getAttribute("name"),
            field_config,
            value,
            constraint,
            is_valid;

        Survana.Assert(field_name, el, "Element must have a name attribute");
        Survana.Assert(form_id, el, "Element must have a data-form attribute");

        if (el.classList.contains(Survana.Validation.NO_VALIDATION)) {
            Survana.Log("No validation for", el);
            return;
        }

        if (!form_config && validation_config[form_id]) {
            form_config = validation_config[form_id].config;
        }

        if (!form_config) {
            Survana.Warn("No validation configuration for form", form_id);
            return;
        }

        field_config = form_config[field_name];

        if (!field_config) {
            Survana.Warn("No validation configuration for field", field_name);
        }

        value = get_value_by_type(el, field_config.type);
        is_valid = true;

        //check all user-specified constraints
        for (constraint in field_config) {
            if (!field_config.hasOwnProperty(constraint) || !Survana.Validation.Constraints[constraint]) {
                continue;
            }

            //verify constraint
            if (!Survana.Validation.Constraints[constraint](value, field_config[constraint], elements)) {
                console.log('Constraint', constraint, '=', field_config[constraint], 'failed validation; values=', value);
                invalid(field_name, field_config, constraint);
                is_valid = false;
                break;
            }
        }

        if (is_valid) {
            valid(field_name);
        }

        return is_valid;
    };


    /**
     * Default validation messages. The keys of this object match the names of validation constraints, except for
     * 'invalid', which is a catch-all function.
     * @type Object
     */
    Survana.Validation.Messages = {
        'invalid': function () {
            return "Please enter a valid value for this field.";
        },
        'equal': function () {
            return "This field must be equal to the previous field.";
        },
        'optional': function () {
            return "This field is required";
        },
        'numeric': function () {
            return "This field requires a numeric value";
        },
        'max': function (max) {
            return ["Please enter a value that's less than ", max, "."].join("");
        },
        'min': function (min) {
            return ["Please enter a value greater than ", min, "."].join("");
        }
    };

    Survana.Validation.OnFormLoad = function () {
        //read any baked-in form information
        var script_elements = document.querySelectorAll('script.schema');

        if (!script_elements.length) {
            return;
        }

        for (var i = 0; i < script_elements.length; ++i) {
            var script = script_elements[i],
                json_string = script.innerHTML,
                info;

            if (!json_string.length) {
                continue;
            }

            try {
                info = JSON.parse(json_string);
            } catch (e) {
                Survana.Error(e);
                continue;
            }

            Survana.Validation.SetConfiguration(info.id, info.config, info.messages);
            Survana.Schema[info.id] = info.schemata;
        }
    };

    function on_dom_content_loaded() {
        document.removeEventListener('DOMContentLoaded', on_dom_content_loaded);
        Survana.Validation.OnFormLoad();
    }

    //register an onReady handler, i.e. $(document).ready(). Caveat: does not support older versions of IE
    document.addEventListener("DOMContentLoaded", on_dom_content_loaded);

}(document, window.Survana));
