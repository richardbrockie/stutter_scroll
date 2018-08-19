// from here: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Implement_a_settings_page

// duplication of constants is annoying...

let DEFAULT_INITIAL_PAUSE = "2";
let DEFAULT_STUTTER_PAUSE = "1";
let DEFAULT_STUTTER_CLASS = "stutter_scroll_stop_here";

// let DEFAULT_URL_LIST = "https://ontheday.net/\nhttps://google.com/";
let DEFAULT_URL_LIST = 'http://127.0.0.1:8000/2018/bay_climb/tournament/open_men/\nhttp://127.0.0.1:8000/2018/bay_climb/otd_ftw/\nhttp://127.0.0.1:8000/2018/bay_climb/tournament/men_fixed/\nhttp://127.0.0.1:8000/2018/bay_climb/otd_ftw/\nhttp://127.0.0.1:8000/2018/bay_climb/tournament/open_women/\nhttp://127.0.0.1:8000/2018/bay_climb/otd_ftw/\nhttp://127.0.0.1:8000/2018/bay_climb/tournament/women_fixed/\nhttp://127.0.0.1:8000/2018/bay_climb/otd_ftw/';

function saveOptions(e) {
    e.preventDefault();
    browser.storage.sync.set({
        initial_pause: document.querySelector("#initial_pause").value,
        stutter_pause: document.querySelector("#stutter_pause").value,
        stutter_class: document.querySelector("#stutter_class").value,
        url_list: document.querySelector("#url_list").value
    });
}

function restoreOptions() {

    function setCurrentChoice_initial_pause(result) {
        document.querySelector("#initial_pause").value = result.initial_pause || DEFAULT_INITIAL_PAUSE;
    }

    function setCurrentChoice_stutter_pause(result) {
        document.querySelector("#stutter_pause").value = result.stutter_pause || DEFAULT_STUTTER_PAUSE;
    }

    function setCurrentChoice_stutter_class(result) {
        document.querySelector("#stutter_class").value = result.stutter_class || DEFAULT_STUTTER_CLASS;
    }

    function setCurrentChoice_url_list(result) {
        document.querySelector("#url_list").value = result.url_list || DEFAULT_URL_LIST;
    }

    function onError(error) {
        console.log(`Error: ${error}`);
    }

    let getting_initial_pause = browser.storage.sync.get("initial_pause");
    getting_initial_pause.then(setCurrentChoice_initial_pause, onError);

    let getting_stutter_pause = browser.storage.sync.get("stutter_pause");
    getting_stutter_pause.then(setCurrentChoice_stutter_pause, onError);

    let getting_stutter_class = browser.storage.sync.get("stutter_class");
    getting_stutter_class.then(setCurrentChoice_stutter_class, onError);

    let getting_url_list = browser.storage.sync.get("url_list");
    getting_url_list.then(setCurrentChoice_url_list, onError);
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);
