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
        @param groups {Object} All known values in the form, grouped by their question ID
     */
    Survana.Validation.Constraints = {
        'equal': function (values, target, groups) {
            console.log('equal', arguments);
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

    //returns the value of an element based on its declared field type
    function get_value_by_type(element, field_type) {
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
     * Validate <form> elements, based on a validation configuration pre-built when publishing the form
     * and custom validation messages. Returns all validated responses.
     * @param form The HTMLFormElement being validated
     * @param schemata The form schemata
     * @param config (optional) Validation configuration
     * @param messages (optional) Custom error messages
     * @return {Object|Boolean} Returns all validated responses as an Object, or false if validation failed
     */
    Survana.Validation.Validate = function (form, schemata, config, messages) {

        if (!form) {
            throw new Error('Invalid validation form supplied to Survana.Validate');
        }

        if (!config && validation_config[form.id]) {
            config = validation_config[form.id].config;
        }

        if (!config) {
            throw new Error('Invalid validation configuration supplied to Survana.Validate');
        } else {
            //cache this configuration object
            Survana.Validation.SetConfiguration(form.id, config, messages);
        }

        function group_elements_by_name(elements) {
            var result = {},
                el,
                name;

            for (var i = 0; i < elements.length; ++i) {
                el = elements[i];
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

        function get_values_from_group(group, field_type) {
            var result = [],
                value;

            if (!group) {
                return result;
            }

            for (var i = 0; i < group.length; ++i) {
                //skip elements marked as 'do not validate'
                if (group[i].classList.contains(Survana.Validation.NO_VALIDATION)) {
                    continue;
                }

                value = get_value_by_type(group[i], field_type);
                if (value !== undefined) {
                    result.push(value);
                }
            }

            return result;
        }

        /**
         * Validates all the constraints of a single field. Calls invalid() if validation fails.
         * @param name {String} Field name (aka schema id)
         * @param type {String} Field type (aka schema type)
         * @param validation_config {Object} Field validation (aka schema validation)
         * @param elements {Object} All form elements grouped by name
         * @returns {false|Array} False if validation fails, Group values otherwise
         */
        function validate_field(field, elements) {
           var result = false,
               //find the controls responsible for this field
               group = elements[name],
               constraint_name,
               constraint_value;

            if (!group) {
                return false;
            }

            //aggregate the values in the group
            values = get_values_from_group(group, field.type);

            //check all user-specified constraints
            for (constraint_name in field.validation) {
                if (!config.hasOwnProperty(constraint)) {
                    continue;
                }

                if (!Survana.Validation.Constraints[constraint_name]) {
                    Survana.Error("Unknown validation constraint:", constraint_name);
                }

                constraint_value = validation_config[constraint_name];

                //verify constraint
                if (!Survana.Validation.Constraints[constraint_name](values, constraint_value, elements)) {
                    console.log('Constraint', constraint_name, '=', constraint_value, 'failed validation; values=', values, 'elements=', elements);
                    invalid(name, constraint_name, constraint_value);
                    return false;
                }
            }

            return true;
        }

        var field_name, field_type, field_config, elements, values, is_valid;

        elements = group_elements_by_name(form.elements);

        var is_form_valid = true,
            result = {};

        //loop through all known fields
        for (field_name in schemata) {
            if (!schemata.hasOwnProperty(field_name)) {
                continue;
            }

            var field = schemata[field_name];

            console.log('field=', field);

            field_config = config[field_name];
            field_type = schemata[field_name].type;

            if (field_config) {

                validate_field(field_name, field_type, field_config, elements);

                //mark this field as valid
                if (is_valid) {
                    valid(field_name, field_config);
                    result[field_name] = values;
                }

                is_form_valid = is_form_valid && is_valid;
            } else {
                result[field_name] = values;
            }
        }

        console.log('validation result=', is_form_valid, result);

        if (is_form_valid) {
            return result;
        }

        return false;
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
