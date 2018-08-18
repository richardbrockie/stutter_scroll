chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.stutter_class) {

            // https://stackoverflow.com/questions/22754315/for-loop-for-htmlcollection-elements

            let theElements = document.getElementsByClassName(request.stutter_class);
            let id_list = [];

            [].forEach.call(theElements, function (el) {
                if (el.id) {
                    id_list.push(el.id);
                }
            });

            sendResponse({id_list: id_list});
        }

        else if (request.move_to_stutter_id) {
            let the_element = document.getElementById(request.move_to_stutter_id);

            the_element.scrollIntoView({
                behavior: "smooth",
                block: "start",
                inline: "start"
            });

            sendResponse({done: true});
        }
    });