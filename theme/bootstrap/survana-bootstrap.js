if (typeof Survana === undefined) {
    throw Error("Survana-Bootstrap requires Survana");
}

/* isArray() polyfill */
if (!Array.isArray) {
    Array.isArray = function (arg) {
        return Object.prototype.toString.call(arg) === '[object Array]';
    };
}

var engine_id = "bootstrap",
    engine_name = "Bootstrap 3"
    engine_version = "1.0.0",
    ncolumns = 12,
//default controls take up all columns (an entire row)
    control_width = {
        'l': ncolumns,
        'm': ncolumns,
        's': ncolumns,
        'xs': ncolumns
    },
//default width for the first column
//xs doesn't make sense, because the matrix will be resized to vertical on xs screens
    matrix_width = {
        'l': 4,
        'm': 4,
        's': 4
    },
    default_matrix_type = 'radio';

var BootstrapEngine = function (doc) {

    //make the 'doc' param optional, with the default value being the current document
    if (doc === undefined && !doc && document !== undefined && document) {
        doc = document;
    }

    var types = {
        html: html,
        button: button,
        radiobutton: radio_button,
        checkboxbutton: checkbox_button,
        input: input,
        text: text,
        number: number,
        radio: radio,
        checkbox: checkbox,
        option: option,
        optgroup: optgroup,
        select: select,
        instructions: instructions,
        separator: separator,
        group: group,
        matrix: matrix
    };

    var group_types = {
        button: group_button,
        radio: radio,
        checkbox: checkbox,
        select: select,
        option: option
    };

    var button_count = 0,
        radio_count = 0,
        checkbox_count = 0,
        input_count = 0,
        question_count = 0,
        select_count = 0;

    function _html(elem, field, value) {
        elem.innerHTML = value || field.html || "";
    }

    function _value(elem, value) {
        if (value !== undefined && value !== null) {
            elem.setAttribute('value', value);
        }
    }

    function _placeholder(elem, field) {
        if (field.placeholder !== undefined && field.placeholder) {
            elem.setAttribute('placeholder', field.placeholder);
        }
    }

    function _size(elem, field, s) {
        var c = elem.getAttribute('class') || "";

        if (s === undefined || !s) {
            s = getSizes(field).control;
        }

        if (s.l) {
            c += ' col-lg-' + s.l;
        }

        if (s.m) {
            c += ' col-md-' + s.m;
        }

        if (s.s) {
            c += ' col-sm-' + s.s;
        }

        if (s.xs) {
            c += ' col-xs-' + s.xs;
        }

        elem.setAttribute('class', c);
    }

    function _align(elem, field) {

        var c = elem.getAttribute('class') || "";

        if (field.align) {
            elem.setAttribute('class', c + ' text-' + field.align);
        }
    }

    function _alignEl(elem, field) {
        var c = elem.getAttribute('class') || "";

        switch (field.align) {
            case 'left':
                elem.setAttribute('class', c + ' pull-left');
                break;
            case 'center':
                elem.setAttribute('class', c + ' center-block');
                break;
            case 'right':
                elem.setAttribute('class', c + ' pull-right');
                break;
        }
    }

    //the field refers to the control element to which a label should be attached.
    function _label(field, sizes) {

        //field.label must exist
        if (field.label === undefined) {
            return
        }

        var elem = doc.createElement("label");

        if (sizes === undefined) {
            sizes = getSizes(field);
        }

        elem.setAttribute('for', field.id);
        elem.setAttribute('class', 'control-label');

        _align(elem, field.label);
        _size(elem, field, sizes.label);
        _html(elem, field.label);

        return elem;
    }

    function _striped(elem, field) {
        var c = elem.getAttribute('class') || "";

        if (field.striped) {
            c += ' ' + 'striped';

            elem.setAttribute('class', c);
        }
    }

    function _hover(elem, field) {
        var c = elem.getAttribute('class') || "";

        if (field.hover) {
            c += ' ' + 'hover';
            elem.setAttribute('class', c);
        }
    }

    function _noanswer(elem, field) {
        var c = elem.getAttribute('class') || "";

        if (field.noanswer) {
            c += ' ' + 'no-answer text-muted';
            elem.setAttribute('class', c);
        }
    }

    function _validation(elem, field) {
        if (!field.validation) {
            console.log('No validation for', field);
            return;
        }

        //store important validation IDs as element attributes
        if (field.form_id) {
            elem.setAttribute('data-form', field.form_id);
        }

        if (field.question_id) {
            elem.setAttribute('data-question', field.question_id);
        }

        console.log("ELEMT TYPE", elem.type);
        //onblur handler
        switch (field.type) {
            case 'select':
            case 'radio':
            case 'checkbox':
            case 'button': elem.setAttribute('onchange', 'return Survana.Validation.OnEvent(this);'); break;

            default:    elem.setAttribute('onblur', 'return Survana.Validation.OnEvent(this);'); break;
        }
    }

    function _container(elem, field) {
        if (field.container) {
            elem.setAttribute('data-container', field.container);
        }
    }

    function group(field) {

        var container,
            elem,
            f,
            i,
            c = "group",
            child_id = 0;

        //create a specialized container
        switch (field.group) {
            case "option":
                container = doc.createElement('optgroup');
                if (field.html) {
                    container.setAttribute('label', field.html);
                }
                break;
            default:
                container = doc.createElement('div');
        }


        //this prevents empty groups, except for optgroups - one might want empty optgroups with labels
        if (field.fields === undefined || !field.fields) {
            if (field.group === "option") {
                return container;
            }

            return null;
        }

        console.log('group field', field);


        for (i in field.fields) {
            if (!field.fields.hasOwnProperty(i)) {
                continue;
            }

            f = field.fields[i];

            if (!f.validation) {
                f.validation = field.validation;
            }


            //a 'radio'-group has 'radio' fields, a 'checkbox'-group has 'checkbox'-fields, etc
            if (f.type === undefined) {
                f.type = field.group;
            }

            //auto-generate an ID if necessary
            if (f.id === undefined) {
                f.id = field.id + ":" + child_id;
                child_id += 1;
            }

            //auto-generate a 'name' property
            if (f.name === undefined) {
                f.name = field.name || field.id;
            }

            //propagate the 'multi' property, if it doesn't interfere with the child
            if ((f.multi === undefined || f.multi === null) && (field.multi !== undefined)) {
                f.multi = field.multi;
            }

            //create the child element
            elem = by_type(f, f.type, group_types);

            //append child to list
            if (elem) {
                container.appendChild(elem);
            }
        }

        switch (field.group) {
            case 'button':
                c += ' btn-group btn-group-justified';
                container.setAttribute('data-toggle', 'buttons');
                break;
        }

        container.setAttribute('class', c);

        return container;
    }

    //Internally, the matrix will always think it takes up 12 columns. Set the size on a container element.
    function matrix(field) {
        console.log('Creating matrix element');

        var container = doc.createElement('div'),
            header = doc.createElement('div'),
            column_row_wrapper = doc.createElement('div'),
            column_row = doc.createElement('div'),
            column_header_wrapper = doc.createElement('div'),
            matrix_columns = field.columns.length - 1,
            total_col_width,
            col_width,
            fcol_width,
            i,
            el,
            inner_el;

        //first column size
        fcol_width = field.columns[0].size;

        if (!fcol_width) {
            fcol_width = matrix_width;
        }

        total_col_width = {
            'l': ncolumns - fcol_width.l,
            'm': ncolumns - fcol_width.m,
            's': ncolumns - fcol_width.s
        };

        //each column's width is a portion of the total width allocated for the columns.
        col_width = {
            'l': Math.ceil(total_col_width.l / matrix_columns),
            'm': Math.ceil(total_col_width.m / matrix_columns),
            's': Math.ceil(total_col_width.s / matrix_columns)
        };

        container.setAttribute('class', 'matrix');
        _hover(container, field);
        _striped(container, field);

        /* MATRIX HEADER */

        //matrix header row
        header.setAttribute('class', 'row matrix-header-row');

        //the first label is the question label config. if one hasn't been provided,
        //insert an empty object automatically
        if (field.columns && (!field.columns.length || field.columns[0].html)) {
            field.columns.unshift({});
        }

        /*  push the columns to the right the same distance as the width of the first column
         the width of the rest of the columns should be the same as for the controls in each cell
         the labels in the header and on each control must match
         */
        column_row_wrapper.setAttribute('class', ' col-lg-push-' + fcol_width.l +
            ' col-md-push-' + fcol_width.m +
            ' col-sm-push-' + fcol_width.s +
            ' col-lg-' + total_col_width.l +
            ' col-md-' + total_col_width.m +
            ' col-sm-' + total_col_width.s);

        //make a row to contain all the column header cells
        column_header_wrapper.setAttribute('class', 'row');

        //start with the second column, since the first column is config for the labels
        for (i = 1; i < field.columns.length; ++i) {
            el = doc.createElement('div');
            //mark each header cell. it should be hidden on 'xs' devices, and the text in the middle
            el.setAttribute('class', ' matrix-header hidden-xs text-center' +
                ' col-lg-' + col_width.l +
                ' col-md-' + col_width.m +
                ' col-sm-' + col_width.s);

            _noanswer(el, field.columns[i]);

            inner_el = doc.createElement('div');
            inner_el.setAttribute('class', 'matrix-header-text');
            _html(inner_el, field.columns[i]);
            _noanswer(inner_el, field.columns[i]);

            //append the header text to header cell
            el.appendChild(inner_el);
            //append the header cell to the header row
            column_header_wrapper.appendChild(el);
        }

        //append the header row to the header row wrapper
        column_row_wrapper.appendChild(column_header_wrapper);
        //append the header row wrapper to the matrix header
        header.appendChild(column_row_wrapper);

        //append the header to the matrix container
        container.appendChild(header);

        /*  MATRIX ROWS
         Each  header label is repeated here and displayed on 'xs' screens
         */

        var row,
            row_label,
            padded_row_label,
            control_row_wrapper,
            control_row,
            control_wrapper,
            control_el,
            j;

        if (field.equalize) {
            //first, if equalize was enabled, pad all labels with non breakable spaces to make all labels
            //have the same width. We need to determine the length of the longest label and reset the paddedHtml prop
            var max_label = 0;
            for (i = 0; i < field.rows.length; ++i) {
                if (field.rows[i].html.length > max_label) {
                    max_label = field.rows[i].html.length;
                }

                //remove any previous padding settings
                field.rows[i].paddedHtml = '';
            }

            //now, loop over all labels again and pad them until max_label
            var field_length, padding, npad;
            for (i = 0; i < field.rows.length; ++i) {
                field_length = field.rows[i].html.length;
                if (field_length < max_label) {
                    //create a string of repeating 'nbsp;'
                    npad = max_label - field_length;
                    //npad -= ~~(npad/3); //subtract 30%
                    padding = Array(npad).join("&nbsp; ") || "";
                    field.rows[i].paddedHtml = field.rows[i].html + padding;
                } else {
                    field.rows[i].paddedHtml = field.rows[i].html;
                }
            }
        }
        
        var labelHtml = "";

        //loop over all user-supplied rows
        for (i = 0; i < field.rows.length; ++i) {
            //generate a row id
            field.rows[i].id = field.rows[i].id || field.id + ":" + (i + 1);
            var row_id = field.rows[i].id;

            //create a new matrix row
            row = doc.createElement('div');
            row.setAttribute('class', 'row matrix-row no-skip');
            row.setAttribute('id', row_id);

            //create a new row label
            row_label = doc.createElement('label');
            var row_label_class = 'matrix-question control-label';
            if (field.equalize) {
                row_label_class += ' equalized';
            }

            row_label.setAttribute('class', row_label_class);
            _size(row_label, null, fcol_width);
            
            

            //render final html for label, and prepend numbers, if necessary
            //reusing fields.rows[i].html instead of labelHtml causes issues
            //when this form is rendered multiple times
            if (field.numbers) {
                labelHtml = (i + 1) + ". " + (field.rows[i].html || "");
            } else {
                labelHtml = field.rows[i].html || "";
            }

            _html(row_label, field.rows[i], labelHtml);

            row.appendChild(row_label);

            //append equalized label
            if (field.equalize) {
                padded_row_label = doc.createElement('label');
                padded_row_label.setAttribute('class', 'matrix-question control-label equalized-padded');
                _size(padded_row_label, null, fcol_width);
                if (field.numbers) {
                    field.rows[i].paddedHtml = (i + 1) + ". " + (field.rows[i].paddedHtml || "");
                }

                _html(padded_row_label, field.rows[i], field.rows[i].paddedHtml);

                row.appendChild(padded_row_label);
            }

            //control row wrapper
            control_row_wrapper = doc.createElement('div');
            //the wrapper should have the same width as the column headers
            _size(control_row_wrapper, null, total_col_width);

            //create a new row
            control_row = doc.createElement('div');
            control_row.setAttribute('class', 'row');

            //make sure each row has validation information
            if (!field.rows[i].validation && field.validation) {
                field.rows[i].validation = field.validation;
            }

            //create a control for each column
            for (j = 1; j < field.columns.length; ++j) {
                control_wrapper = doc.createElement('div');
                //the control should have the same width as a column
                _size(control_wrapper, null, col_width);

                field.columns[j]['-input-label-class'] = 'visible-xs text-left';
                //id= row_id:0,1,2,...
                field.columns[j].id = row_id + ":" + (j - 1);
                field.columns[j].name = row_id;
                field.columns[j].validation = field.rows[i].validation;
                field.columns[j].container = field.id;

                if (field.columns[j].value === undefined || field.columns[j].value === null) {
                    if (field.columns[j].noanswer) {
                        field.columns[j].value = Survana.NO_ANSWER;
                    } else {
                        field.columns[j].value = j;
                    }

                }

                //create the element
                control_el = by_type(field.columns[j], field.matrix || default_matrix_type);

                //append element to the wrapper
                control_wrapper.appendChild(control_el);

                //append the wrapper to the current matrix row
                control_row.appendChild(control_wrapper)
            }

            control_row_wrapper.appendChild(control_row);
            row.appendChild(control_row_wrapper);
            container.appendChild(row);
        }

        return container;
    }

    function html(field) {
        var elem = doc.createElement('span');

        _html(elem, field);

        return elem;
    }

    function button(field) {
        if (field === undefined || !field) {
            return null;
        }

        var elem = doc.createElement('button');

        elem.setAttribute('id', field.id || 'button_' + (++button_count));
        elem.setAttribute('type', 'button');
        elem.setAttribute('class', 'btn btn-default');
        if (field.click) {
            elem.setAttribute('onclick', field.click);
        }

        _html(elem, field);
        _alignEl(elem, field);

        return elem;
    }

    /* <label class="btn btn-default">
     <input type="radio" id="" name="">
     </label>
     */
    function group_button(field) {
        if (field === undefined || !field) {
            return null;
        }

        var elem = doc.createElement('input'),
            id = field.id || 'input_' + (input_count++),
            name = field.name || id;

        elem.setAttribute('id', id);
        elem.setAttribute('name', name);
        console.log('button group field=', field);
        if (field.multi) {
            elem.setAttribute('type', 'checkbox');
        } else {
            elem.setAttribute('type', 'radio');
        }


        //wrap the <input> with a <label>
        var label = doc.createElement('label');
        label.setAttribute('class', 'btn btn-default');
        _html(label, field);
        _value(elem, field.value);
        _validation(elem, field);

        label.appendChild(elem);
        return label;
    }

    //returns an <input> element
    function input(field) {

        //create <input>
        var elem = doc.createElement('input'),
            id = field.id || 'input_' + (input_count++),
            name = field.name || id;

        elem.setAttribute('id', id);
        elem.setAttribute('name', name);
        elem.setAttribute('type', field.type || "text");
        elem.setAttribute('class', 'form-control');

        _value(elem, field.value);
        _placeholder(elem, field);
        _validation(elem, field);

        return elem;
    }

    //syntactic sugar for input()
    function text(field) {
        return input(field);
    }

    function number(field) {
        field.type = 'number';
        return input(field);
    }

    function radio(field) {
        var container = doc.createElement('div'),
            elem = doc.createElement('input'),
            label = doc.createElement('label'),
            label_text = doc.createElement('span'),
            id = field.id || 'radio_' + radio_count++,
            name = field.name || id;

        container.setAttribute('class', 'radio');

        elem.setAttribute('id', id);
        elem.setAttribute('name', name);
        elem.setAttribute('type', 'radio');
        _value(elem, field.value);
        _validation(elem, field);
        _container(elem, field);

        if (field['-input-label-class']) {
            label_text.setAttribute('class', field['-input-label-class']);
        }

        _html(label_text, field);


        //create the label without using _label, because this label is special (no need for default 'label' props)
        label.setAttribute('for', elem.id);
        label.setAttribute('class', 'control-label');

        //append the radio button and text to the label
        label.appendChild(elem);
        label.appendChild(label_text);

        //append the label to the container
        container.appendChild(label);

        return container;
    }

    function group_radio(field) {
        console.log('GROUP RADIO');
    }

    function checkbox(field) {
        var container = doc.createElement('div'),
            elem = doc.createElement('input'),
            label = doc.createElement('label'),
            label_text = doc.createElement('span'),
            id = field.id || 'checkbox_' + checkbox_count++,
            name = field.name || id;

        container.setAttribute('class', 'checkbox');

        elem.setAttribute('id', id);
        elem.setAttribute('name', name);
        elem.setAttribute('type', 'checkbox');

        _value(elem, field.value);
        _validation(elem, field);
        _container(elem, field);

        if (field['-input-label-class']) {
            label_text.setAttribute('class', field['-input-label-class']);
        }

        _html(label_text, field);

        //create the label without using _label, because this label is special (no need for default 'label' props)
        label.setAttribute('for', elem.id);
        label.setAttribute('class', 'control-label');

        //append the radio button and text to the label
        label.appendChild(elem);
        label.appendChild(label_text);

        //append the label to the container
        container.appendChild(label);

        return container;
    }

    /*
     <label class="btn btn-default">
     <input type="radio" name="sex" id="sex:0">Male</input>
     </label>
     */
    function radio_button(field) {
        var elem = doc.createElement('label'),
            child = doc.createElement('input'),
            id = field.id || 'radiobutton_' + radio_count++,
            name = field.name || id;

        elem.setAttribute('class', 'btn btn-default');

        child.setAttribute('type', 'radio');
        child.setAttribute('id', id);
        child.setAttribute('name', name);

        _value(child, field.value);

        elem.innerHTML += field.html;

        if (child) {
            elem.appendChild(child);
        }

        return elem;
    }

    /*
     <label class="btn btn-default">
     <input type="checkbox" name="sex" id="sex:0">Male</input>
     </label>
     */
    function checkbox_button(field) {
        var elem = doc.createElement('label'),
            child = doc.createElement('input'),
            id = field.id || 'checkbox_' + checkbox_count++,
            name = field.name || id;

        elem.setAttribute('class', 'btn btn-default');

        child.setAttribute('type', 'checkbox');
        child.setAttribute('id', id)
        child.setAttribute('name', name);

        _value(child, field.value);

        elem.innerHTML += field.html;

        if (child) {
            elem.appendChild(child);
        }

        return elem;
    }

    function option(field) {
        var elem = doc.createElement('option');

        _html(elem, field);
        _value(elem, field.value);

        return elem;
    }

    function group_option(field) {
        return option(field);
    }

    function optgroup(field) {
        var elem = doc.createElement('optgroup'),
            child;

        if (field.html) {
            elem.setAttribute('label', field.html);
        }

        if (field.fields) {
            for (var f in field.fields) {
                if (field.fields.hasOwnProperty(f)) {
                    child = option(field.fields[f]);

                    if (child) {
                        elem.appendChild(child);
                    }
                }
            }
        }

        return elem;
    }

    function select(field) {
        var elem = doc.createElement('select'),
            id = field.id || 'select_' + select_count++,
            name = field.name || id,
            c;

        elem.setAttribute('id', id);
        elem.setAttribute('name', name);
        elem.setAttribute('class', 'form-control');

        if (field.fields) {
            for (var f in field.fields) {
                if (field.fields.hasOwnProperty(f)) {
                    c = field.fields[f];

                    //set the child type to either "optgroup" or "option"
                    if (c.fields) {
                        c.type = "group";
                        c.group = "option";
                    } else {
                        c.type = "option";
                    }

                    c = by_type(c);

                    if (c) {
                        elem.appendChild(c);
                    }
                }
            }
        }

        _validation(elem, field);

        return elem;
    }

    function instructions(field) {
        var elem = doc.createElement('blockquote');

        _align(elem, field);
        _html(elem, field);

        return elem;
    }

    function separator(field) {
        return doc.createElement('hr');
    }


    /**
     * Calls a handler based on the 'type' property of the 'field' object.
     * @param field {Object}    A user-specified object containing a .type property
     * @param [t]               An optional default type, if field.type doesn't exist
     * @param [col]             An optional collection object with pointers to the type handlers. default: 'types'
     * @returns HTMLElement on Success, null on Failure
     */
    function by_type(field, t, col) {

        var type = field.type || t,
            elem;

        if (type === undefined || !type) {
            //no type information? autodetect the type of this element
            if (field.group) {
                type = "group";
            } else if (field.html) {
                type = "html";
            }
        }

        if (col === undefined || !col) {
            col = types;
        }

        //supported field?
        if (type && (col[type] !== undefined)) {

            //set the field type, in case it wasn't already set
            field.type = type;

            //generate the element
            elem = col[type](field);
        }

        return elem;
    }

    function getSizes(field) {

        var result = {
                control: {},
                label: {}
            },
            cw, //computed control width for a given device size
            lw, //computed label width for a given device size
            max_lw,//maximum allowed control width for a given device size, based on the value of 'cw'
            i;

        for (i in control_width) {
            if (control_width.hasOwnProperty(i)) {

                //reset control width and label width
                cw = null;
                lw = null;

                //the control width is the minimum value from the default or user supplied
                if (field.size !== undefined) {
                    cw = field.size[i];
                }

                //fix invalid widths
                if (cw === undefined || cw === null || cw <= 0 || cw > ncolumns) {
                    cw = control_width[i];
                }

                //set control width for the current screen size
                result.control[i] = cw;

                if (field.label !== undefined) {
                    //set the maximum label width for this field
                    max_lw = ncolumns - cw;

                    //no room for a label? set label width to full size to create row
                    if (max_lw == 0) {
                        lw = ncolumns;
                    } else {
                        //did the user specify a label size?
                        if (field.label.size !== undefined) {
                            lw = field.label.size[i];
                        }

                        //make sure the values are sane. if not, expand to max size
                        if (lw === undefined || lw === null || lw < 0) {
                            lw = max_lw;
                        }

                        //if lw + cw > max_lw, bootstrap will automatically place the label and control on separate rows
                    }

                    //setting label width to 0 will prevent it from showing
                    if (lw) {
                        //set label width for the current screen size
                        result.label[i] = lw;
                    }
                }
            }
        }

        return result;
    }

    //generates an addon element (suffix or prefix).
    //in theory, this can be any control supported by bootstrap.
    function addon(field) {
        var elem, container;

        if (typeof field !== "object") {
            return null;
        }

        container = doc.createElement('span');
        elem = by_type(field);

        switch (field.type) {
            case 'button':
                container.setAttribute('class', 'input-group-btn');
                break;
            default:
                container.setAttribute('class', 'input-group-addon');
        }

        if (elem) {
            container.appendChild(elem);
        }

        return container || elem;
    }

    /**
     * @note generates and returns a container element
     * @note To support array of addons (i.e. multiple prefixes or multiple suffixes), this method must construct
     *       multiple <span class="input-group"> as siblings, one for each affix
     */
    function affix(elem, obj, container) {

        var el;

        if (obj === undefined || !obj) {
            return container;
        }

        if (container === undefined || !container) {
            //create container group
            //TODO: figure out if <select> works with input group
            container = doc.createElement('div');
            container.setAttribute('class', 'input-group');
        }

        el = addon(obj);
        if (el) {
            container.appendChild(el);
        } else {
            console.warn(obj.id, "prefix or suffix declared, but no element was generated for", obj);
        }

        return container;
    }

    function _prefix(elem, field, container) {
        container = affix(elem, field.prefix, container);
        if (container) {
            container.appendChild(elem);
        }

        return container;
    }

    function _suffix(elem, field, container) {
        container = affix(elem, field.suffix, container);
        if (container && !container.contains(elem)) {
            container.insertBefore(elem, container.lastChild);
        }
        return container;
    }

    //returns the control for a question. this can either be an element, or a group of elements (input with suffix)
    function control(field) {
        var container,
            elem;

        //generate the actual control
        elem = by_type(field);
        container = _prefix(elem, field, container);
        container = _suffix(elem, field, container);

        return container || elem;
    }
    
    // <question id="%QID%"><div class="form-group"> ... </div></question>
    function question(field, form) {
        var q, form_group, row, label, cwrap, elem, sizes;

        //auto-assign a field id if necessary
        if (!field.id) {
            field.id = field.question_id = "question" + (++question_count);
        }

        if (form) {
            field.form_id = form.getAttribute('id');
        }

        sizes = getSizes(field);

        //<question>
        q = doc.createElement('question');
        q.setAttribute('id', field.id);

        //form group
        form_group = doc.createElement('div');
        form_group.setAttribute('class', 'form-group');

        //row
        row = doc.createElement('div');
        row.setAttribute('class', 'row');

        //control wrapper
        cwrap = doc.createElement('div');
        _size(cwrap, field, sizes.control);

        //control element
        elem = control(field);
        cwrap.appendChild(elem);

        //label
        label = _label(field);

        if (label) {
            row.appendChild(label);
        }

        row.appendChild(cwrap);

        form_group.appendChild(row);
        q.appendChild(form_group);

        return q;
    }

    function form(field) {
        var elem = doc.createElement('form'),
            form_id = field.id || 'form-' + String((new Date()).valueOf());

        elem.setAttribute('role', 'form');
        elem.setAttribute('id', form_id);
        elem.setAttribute('name', form_id);
        elem.setAttribute('novalidate', 'novalidate');

        return elem;
    }

    return {

        //Properties
        Id: engine_id,
        Name: engine_name,
        Version: engine_version,

        //Methods
        form: form,
        question: question
    };
};

Survana.Theme.Engine[engine_id] = BootstrapEngine;

//set this as the default theme, if no default exists
if (!Survana.Theme.Id) {
    Survana.Theme.SetTheme(engine_id, null, null);
}
