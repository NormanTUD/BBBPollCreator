var log = console.log;
var error = console.error;
var info = console.info;
var warn = console.warn;

var valid_poll_types = ["pollTrueFalse", "pollLetterAlternatives", "pollYesNoAbstentionBtn", "userResponseBtn"];

function sleep(ms) {
    log(`Sleeping ${ms} milliseconds`);
    return new Promise(resolve => setTimeout(resolve, ms));
}


function setNativeValue(element, value) {
    try {
        // Ensure we're working with a valid element
        if (!element || typeof element !== 'object' || typeof value !== 'string') {
            console.error("Invalid element or value");
            return;
        }

        // Attempt to update React's internal state
        let previousValue = element.value;
        element.value = value;
        
        // React may track this "_valueTracker" property for changes
        if (element._valueTracker) {
            element._valueTracker.setValue(previousValue);
        }

        // Trigger 'input' and 'change' events to notify React of the new value
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));

    } catch (error) {
        console.error("Failed to set value on element:", error);
    }
}

function start_poll() {
    var elements = document.querySelectorAll("div");
    var startPoll = null;

    // Iteriere durch die div-Elemente und suche nach dem Text "Umfrage starten"
    elements.forEach(function(element) {
        if (element.textContent.trim() === "Umfrage starten") {
            startPoll = element;
        }
    });

    if(startPoll) {
        log(startPoll);
        startPoll.click();
    } else {
        error("Umfrage starten could not be found");
    }
}

function get_poll_type_element(poll_type) {
    if(!valid_poll_types.includes(poll_type)) {
        error(`Invalid poll type. Valid poll-types include ${valid_poll_types.join(", ")}`);
        return;
    }
    
    var divElements = document.querySelectorAll("button");
    var targetElement = null;

    divElements.forEach(function(element) {
        if (element.getAttribute("data-test") === poll_type) {
            targetElement = element;
        }
    });

    if (!targetElement) {
        error("Kein Element mit data-test='" + poll_type + "' gefunden.");
    }
    
    return targetElement;
}

function start_poll_button() {
    var startPollButton = document.querySelectorAll('button[data-test="startPoll"]');
            
    startPollButton[0].click();   
}

async function fill_poll (question, poll_type, poll_options) {
    if(!question || question.length <= 0) {
       error("Question was emppty.");
       return;
    }
    
    if(!valid_poll_types.includes(poll_type)) {
        error(`Invalid poll type. Valid poll-types include ${valid_poll_types.join(", ")}`);
        return;
    }
    
    var option_keys = Object.keys(poll_options);

    
    var poll_type_element = get_poll_type_element(poll_type);
    
    if(!poll_type_element) {
        error(`poll_type_element could not be found.`);
        return;
    }
    
    var textarea = document.querySelector('textarea[data-test="pollQuestionArea"]');
    
    setNativeValue(textarea, question);
    
    poll_type_element.click();
    
    if (poll_type == "pollTrueFalse") {
        if(option_keys.length == 0) {
            error(`Cannot continue with empty poll_options.`);
            return;
        }

        info(`poll type pollTrueFalse was chosen. Possible options: {'allow_multiple_answers_per_person': bool (optional), options: ['first_option_name', 'second_option_name', 'third_option_name', ...], anonymous: boolean (optional)}`);
        
        
        var allow_multiple_answers_per_person = false;
        if(option_keys.includes("allow_multiple_answers_per_person")) {
            allow_multiple_answers_per_person = poll_options["allow_multiple_answers_per_person"];
            
            if(typeof(allow_multiple_answers_per_person) != "boolean") {
                error(`Cannot continue. The option allow_multiple_answers_per_person must, if set, be boolean.`);
                return;
            }
        }
        
        if(!option_keys.includes("options")) {
            error(`Cannot continue: poll_options needs property options for pollTrueFalse.`);
            return;
        }
        
        var options = poll_options["options"];
        
        if(!Array.isArray(options)) {
            error("options is not an array!");
            return;
        }
                
        var anonymous = false;
        if(option_keys.includes("anonymous")) {
            anonymous = poll_options["anonymous"];
            
            if(typeof(anonymous) != "boolean") {
                error(`Cannot continue. The option anonymous must, if set, be boolean.`);
                return;
            }
        }
        
        await sleep(1000);
        
        log("Setting multipleResponseCheckboxLabel");
        var multipleResponseCheckbox = document.querySelector(`input[type="checkbox"][aria-labelledby="multipleResponseCheckboxLabel"]`);
        
        if(allow_multiple_answers_per_person) {
            log("Setting multipleResponseCheckbox to true");
            warn("Setting multipleResponseCheckbox is not currently supported.")
            //multipleResponseCheckbox.click();
        }
        

        /*
        var anon_checkbox = document.querySelector(`input[type="checkbox"][data-test="anonymousPollBtn"]`);

        if(anonymous) {
            anon_checkbox.checked = true;
        } else {
            anon_checkbox.checked = false;
        }
        
        anon_checkbox.dispatchEvent(new Event("change"));
        */
      
        while (options.length < document.getElementsByClassName("icon-bbb-delete").length) {
            log("Removing items");
            var delete_buttons = document.getElementsByClassName("icon-bbb-delete");
            
            delete_buttons[delete_buttons.length - 1].click();
        }
        
        while (options.length > document.getElementsByClassName("icon-bbb-delete").length) {
            log("Adding items");
            var add_buttons = document.getElementsByClassName("icon-bbb-add");
            
            var add_button = document.querySelector("button[data-test='addPollItem']");
            
            if(add_button) {
                add_button.click();
                await sleep(100);
            } else {
                error(`Cannot find addPollItem`);
                return;
            }
        } 
        
        await sleep(1000);
        
        var items = document.querySelectorAll('input[data-test="pollOptionItem"]');

        if (items.length !== options.length) {
            console.error("Die Anzahl der Optionen stimmt nicht mit den verfügbaren Eingabefeldern überein.");
        } else {
            for (let i = 0; i < items.length; i++) {
                try {
                    setNativeValue(items[i], options[i]);
                } catch (error) {
                    console.error(`Failed to set value for item ${i}:`, error);
                }
            }
        }
        
        await sleep(2000);
        
        start_poll_button();
    } else if (poll_type == "pollLetterAlternatives") {
        if(!option_keys.includes("options")) {
            error(`Cannot continue: poll_options needs property options for pollLetterAlternatives.`);
            return;
        }
        
        var options = poll_options["options"];
        
        while (options.length < document.getElementsByClassName("icon-bbb-delete").length) {
            log("Removing items");
            var delete_buttons = document.getElementsByClassName("icon-bbb-delete");
            
            delete_buttons[delete_buttons.length - 1].click();
        }
        
        while (options.length > document.getElementsByClassName("icon-bbb-delete").length) {
            log("Adding items");
            var add_buttons = document.getElementsByClassName("icon-bbb-add");
            
            var add_button = document.querySelector("button[data-test='addPollItem']");
            
            if(add_button) {
                add_button.click();
                await sleep(100);
            } else {
                error(`Cannot find addPollItem`);
                return;
            }
        } 

        await sleep(1000);
        
        var items = document.querySelectorAll('input[data-test="pollOptionItem"]');

        if (items.length !== options.length) {
            console.error("Die Anzahl der Optionen stimmt nicht mit den verfügbaren Eingabefeldern überein.");
        } else {
            for (let i = 0; i < items.length; i++) {
                try {
                    setNativeValue(items[i], options[i]);
                } catch (error) {
                    console.error(`Failed to set value for item ${i}:`, error);
                }
            }
        }
        
        await sleep(2000);
        
        start_poll_button();
    } else if (poll_type == "pollYesNoAbstentionBtn") {
        if(!option_keys.includes("options")) {
            error(`Cannot continue: poll_options needs property options for pollLetterAlternatives.`);
            return;
        }
        
        var options = poll_options["options"];
        
        while (options.length < document.getElementsByClassName("icon-bbb-delete").length) {
            log("Removing items");
            var delete_buttons = document.getElementsByClassName("icon-bbb-delete");
            
            delete_buttons[delete_buttons.length - 1].click();
        }
        
        while (options.length > document.getElementsByClassName("icon-bbb-delete").length) {
            log("Adding items");
            var add_buttons = document.getElementsByClassName("icon-bbb-add");
            
            var add_button = document.querySelector("button[data-test='addPollItem']");
            
            if(add_button) {
                add_button.click();
                await sleep(100);
            } else {
                error(`Cannot find addPollItem`);
                return;
            }
        } 

        await sleep(1000);
        
        var items = document.querySelectorAll('input[data-test="pollOptionItem"]');

        if (items.length !== options.length) {
            console.error("Die Anzahl der Optionen stimmt nicht mit den verfügbaren Eingabefeldern überein.");
        } else {
            for (let i = 0; i < items.length; i++) {
                try {
                    setNativeValue(items[i], options[i]);
                } catch (error) {
                    console.error(`Failed to set value for item ${i}:`, error);
                }
            }
        }
        
        await sleep(2000);
        
        start_poll_button();
    } else if (poll_type == "userResponseBtn") {
        var textarea = document.querySelector('textarea[data-test="pollQuestionArea"]');
        
        setNativeValue(textarea, question);

        start_poll_button();
    } else {
        error(`Unhandled poll type ${poll_type}. Valid poll types are: ${valid_poll_types.join(", ")}`);
    }
}

async function create_poll (question, poll_type, poll_options = {}) {
    var textarea = document.querySelector('textarea[data-test="pollQuestionArea"]');
        
    if(!textarea) {
        start_poll();
    }

    await fill_poll(question, poll_type, poll_options);
}

//create_poll("das ist ein test", "pollTrueFalse", {"anonymous": true, "options": ["hallo", "welt", "das", "ist", "ein", "test!"], "allow_multiple_answers_per_person": true});

//create_poll("userResponseBtn test", "userResponseBtn")

//create_poll("pollLetterAlternative test", "pollLetterAlternatives", {"options": ["X", "YZ", "ZZZZ", "JAKSDHNFSKJDF"]});

create_poll("pollYesNoAbstentionBtn test", "pollYesNoAbstentionBtn", {"options": ["X", "YZ", "ZZZZ", "JAKSDHNFSKJDF"]});
