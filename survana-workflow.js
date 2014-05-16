/* survana-workflow.js

Survana.Workflow contains functions that are responsible for the control flow during the taking of a survey.

Dependencies:   survana-storage.js
                survana-queue.js

@author Victor Petrov <victor_petrov@harvard.edu>
@license BSD
@date 05/01/2014
*/

"use strict";

if (!window.Survana) {
    window.Survana = {};
}

(function (Survana) {

    //when running the studies, make sure that all dependencies are available
    if (!Survana.DesignerMode) {
        if (!Survana.Storage || !Survana.Storage.IsAvailable) {
            console.error('Survana Storage is not available.');
            return;
        }

        if (!Survana.Queue) {
            console.error('Survana Queue is not available.');
            return;
        }
    }

    var context = {
        workflow: {},
        current: 0,
        start: 0,
        completed: false,
        'store-url': null
    };

    /** Handles errors reported by Survana.Storage
     * @todo Log the error on the server, display notification to user
     * @param {Error} e
     */
    function on_storage_error(e) {
        console.error(e);
    }

    /** Called when the form is loaded.
     * Loads current 'context' from Storage
     */
    function on_form_loaded() {
        Survana.Storage.Get(context, function (result) {
            context = result;
            context.current |= 0; //convert 'current' to a number
        }, on_storage_error);
    }

    /** Callback for DOMContentLoaded Event.
     * Calls on_form_loaded().
     */
    function on_dom_content_loaded () {
        //remove this handler
        document.removeEventListener("DOMContentLoaded", on_dom_content_loaded, false);

        //call the onLoad function
        on_form_loaded();
    }

    /** Increments the current form index, saves it into the Storage and loads the next URL.
     */
    function goto_next_form() {
        context.current++;
        if (context.current >= context.workflow.length) {
            return finish_survey(); //todo: verify that when going Back and clicking Next this doesn't break the flow
        }
        //Store the incremented value of 'current'
        Survana.Storage.Set('current', context.current, function () {
            //load the next form
            window.location.href = context.workflow[context.current];
        }, on_storage_error);
    }

    /** Scrolls the window to the first element with class '.s-error'.
     */
    function scroll_to_first_error() {
        var error_el = document.forms[0].querySelector('.s-error');
        if (error_el) {
            var y = error_el.offsetTop - 100;
            window.scrollBy(0, y);
        }
    }

    /** Handles errors from Survana.Queue
     * @param e {Error} The Error object
     */
    function on_queue_send_error(e) {
        console.error("Failed to send queue:", e);
        //proceed to the next form anyway, since the queue is stored in persistent storage
        goto_next_form();
    }

    /** Callback function for going to the next form. This function performs response validation and will load the next
     * form or scroll the page to the first error.
     * @param btn {HTMLButtonElement} The source button
     */
    function next_page(btn) {

        //disable the button
        if (btn) {
            btn.setAttribute('disabled', 'disabled');
        }

        var response = Survana.Validation.Validate(document.forms[0]);

        //if validation succeeds, save the response and go to the next form
        if (response) {
            //don't do anything in designer mode if validation suceeded
            if (Survana.DesignerMode) {
                return;
            }

            //Store the response
            Survana.Queue.Add(response, function (queue) {

                console.log('response queue', queue);
                Survana.Queue.Send(context['store-url'], goto_next_form, on_queue_send_error);
            }, on_storage_error);
        } else {
            //scroll the window to the first error message
            scroll_to_first_error();

            //enable the button
            if (btn) {
                btn.removeAttribute('disabled');
            }
        }
    }

    /** Terminates the survey by disabling the source button and removing all workflow from storage.
     * @param btn {HTMLButtonElement} The source button
     */
    function finish_survey(btn) {
        if (Survana.DesignerMode) {
            return;
        }

        if (btn) {
            btn.setAttribute('disabled', 'disabled');
            btn.style.visibility = 'hidden';
        }

        //remove the entire workflow from storage
        Survana.Storage.Remove(context, function () {
            //but mark this study as completed
            Survana.Storage.Set('completed', true, null, on_storage_error);
        }, on_storage_error);
    }

    //Workflow API
    Survana.Workflow = {
        NextPage: next_page,
        FinishSurvey: finish_survey
    };

    //register an onReady handler, i.e. $(document).ready(). Caveat: does not support older versions of IE
    if (!Survana.DesignerMode) {
        document.addEventListener("DOMContentLoaded", on_dom_content_loaded);
    }
}(window.Survana));
