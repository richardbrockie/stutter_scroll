const SCRIPT_NAME = "StutterScroll";
const PAGE_LOAD_TIMEOUT_SECONDS = 15;

// const DEBUG_LOG_TO_CONSOLE = true;
const DEBUG_LOG_TO_CONSOLE = false;

// global parameters with working defaults...
let active = false;

let initial_pause = 2;
let stutter_pause = 1;

let stutter_class = 'stutter_scroll_stop_here';

// let url_list = 'https://ontheday.net/\nhttps://google.com/';
let url_list = 'http://127.0.0.1:8000/2018/bay_climb/tournament/open_men/\nhttp://127.0.0.1:8000/2018/bay_climb/otd_ftw/\nhttp://127.0.0.1:8000/2018/bay_climb/tournament/men_fixed/\nhttp://127.0.0.1:8000/2018/bay_climb/otd_ftw/\nhttp://127.0.0.1:8000/2018/bay_climb/tournament/open_women/\nhttp://127.0.0.1:8000/2018/bay_climb/otd_ftw/\nhttp://127.0.0.1:8000/2018/bay_climb/tournament/women_fixed/\nhttp://127.0.0.1:8000/2018/bay_climb/otd_ftw/';

let split_urls = 'tbd';
let url_index = 0;

let stutter_index = 0;
let stutter_id_list = [];

let initial_tab_id = null;

let activeTimeout = null;

const WAIT_TIME_INCREMENT = 250;
let requiredWaitTime = null;
let elapsedWaitTime = null;


function debug_log(message = '') {
    if (DEBUG_LOG_TO_CONSOLE) {
        // from here: https://stackoverflow.com/questions/10211145/getting-current-date-and-time-in-javascript

        // let timestamp = new Date().toLocaleString();
        let timestamp = new Date().toLocaleTimeString();

        let output_list = [timestamp, SCRIPT_NAME, message];
        console.log(output_list.join(': '));
    }
}


function testForValidTab(url) {
    // allows starting from a new tab...
    const NEW_TAB_STRING = "about:newtab";
    const APPLICABLE_PROTOCOLS = ["http:", "https:"];

    if (url === NEW_TAB_STRING ) {
        return true;
    }
    else {
        let anchor = document.createElement('a');
        anchor.href = url;
        return APPLICABLE_PROTOCOLS.includes(anchor.protocol);
    }
}


function setDormantState() {
    debug_log('stopping');

    active = false;

    if (activeTimeout) {
        clearTimeout(activeTimeout);
    }

    browser.browserAction.setIcon({path: "icons/stutter_scroll.svg"});
    browser.browserAction.setTitle({title: "Start Stutter Scroll"});
}


function toggleStutter() {

    debug_log('++++++++++ toggleStutter ++++++++++');

    if (active) {
        setDormantState();
    }
    else {
        // only proceed if we are on a regular tab...
        let gettingTab = browser.tabs.query({active: true});
        gettingTab.then((tab_list) => {
            let starting_tab = tab_list[0];

            function gettingStarted(this_tab) {
                initial_tab = this_tab;
                initial_tab_id = initial_tab.id;

                active = true;

                debug_log('starting');

                startStutter();

                browser.browserAction.setIcon({path: "icons/stutter_scroll_disable.svg"});
                browser.browserAction.setTitle({title: "Stop Stutter Scroll"});
            }

            // open a new tab if required
            if (testForValidTab(starting_tab.url)) {
                gettingStarted(starting_tab);
            }
            else {
                let creatingTab = browser.tabs.create({active: true});
                creatingTab.then((created_tab) => {
                    gettingStarted(created_tab);
                })
            }

        });
    }
}


function startStutter() {
    debug_log('startStutter: ' + active);

    if (active) {
        // get parameter
        let gettingItem = browser.storage.sync.get('stutter_class');
        gettingItem.then((res) => {
            stutter_class = res.stutter_class || stutter_class;

            debug_log('stutter_class: ' + stutter_class);
            determinePages();
        });
    }
}


function determinePages() {

    // this routine recovers the page list and triggers the loading of the first page...

    debug_log('determinePages: ' + active);

    if (active) {
        // get parameter
        let gettingItem = browser.storage.sync.get('url_list');
        gettingItem.then((res) => {
            url_list = res.url_list || url_list;

            split_urls = url_list.split('\n');

            debug_log('url_list: ' + url_list);
            debug_log(split_urls);

            // explicitly sets up loading the first page in the url_list...
            url_index = 0;

            loadPage();
        });
    }
}


function loadPage() {
    // todo: this routine is over-indented... fix at some point.

    debug_log('loadPage: ' + active);

    let gettingTab = browser.tabs.query({active: true});
    gettingTab.then((tab) => {
        let current_tab = tab[0];

        if (current_tab.id !== initial_tab_id) {
            setDormantState();
            return;
        }

        if (active) {

            // if we have reached the end of the list, go back and restart...
            if (url_index >= split_urls.length) {
                determinePages();
                return;
            }

            // select the page to load...
            let page_url = split_urls[url_index];

            debug_log('page_url: ' + page_url);

            // increment the url_index for next time...
            url_index++;

            // cases where we move on are:
            //  - zero length url
            //  - we are already on the requested page
            //
            // todo: need to validate the urls somewhere...

            // if (page_url.length === 0 || page_url === current_tab.url) {
            //     loadPage();
            //     return;
            // }

            if (page_url.length === 0 ) {
                setDormantState();
                return;
            }

            let updatedTab = browser.tabs.update({url: page_url});
            updatedTab
                .then((tab) => {
                    // cribbed from here [Erik Rose]: https://bugzilla.mozilla.org/show_bug.cgi?id=1397667
                    //
                    // This appears necessary as the script blocks page loading until later.
                    // Therefore, any page inspection will be on the already loaded page.
                    //
                    // Solution: add a Promise that contains a listener for onUpdated event.
                    //
                    // todo: thank Erik Rose for the code!

                    if (DEBUG_LOG_TO_CONSOLE) {
                        console.log(tab);
                    }

                    function isComplete(tab) {
                        return tab.status === 'complete' && tab.url === page_url;
                    }

                    // if (!isComplete(tab)) {
                    //     return new Promise((resolve, reject) => {
                    //         const waitForPageLoadTimeout = setTimeout(
                    //             function giveUp() {
                    //                 browser.tabs.onUpdated.removeListener(onUpdated);
                    //                 reject(new Error('Tab never reached the "complete" state, just ' + tab.status + ' on ' + tab.url));
                    //                 setDormantState();
                    //             },
                    //             PAGE_LOAD_TIMEOUT_SECONDS * 1000
                    //         );
                    //
                    //         function onUpdated(tabId, changeInfo, updatedTab) {
                    //             // Must use updatedTab below; using just `tab` seems to remain
                    //             // stuck to about:blank.
                    //             if (tabId === updatedTab.id && isComplete(updatedTab)) {
                    //                 clearTimeout(waitForPageLoadTimeout);
                    //                 browser.tabs.onUpdated.removeListener(onUpdated);
                    //                 resolve(updatedTab);
                    //             }
                    //         }
                    //         browser.tabs.onUpdated.addListener(onUpdated);
                    //     });
                    // }

                    // sets listener for the page load...
                    return new Promise((resolve, reject) => {
                        const waitForPageLoadTimeout = setTimeout(
                            function giveUp() {
                                browser.tabs.onUpdated.removeListener(onUpdated);
                                reject(new Error('Tab never reached the "complete" state, just ' + tab.status + ' on ' + tab.url));
                                setDormantState();
                            },
                            PAGE_LOAD_TIMEOUT_SECONDS * 1000
                        );

                        function onUpdated(tabId, changeInfo, updatedTab) {
                            // Must use updatedTab below; using just `tab` seems to remain
                            // stuck to about:blank.
                            if (tabId === updatedTab.id && isComplete(updatedTab)) {
                                clearTimeout(waitForPageLoadTimeout);
                                browser.tabs.onUpdated.removeListener(onUpdated);
                                resolve(updatedTab);
                            }
                        }
                        browser.tabs.onUpdated.addListener(onUpdated);
                    });

                })
                .then((tab) => {

                    if (DEBUG_LOG_TO_CONSOLE) {
                        console.log(tab);
                    }

                    // get parameter
                    let gettingItem = browser.storage.sync.get('initial_pause');
                    gettingItem.then((res) => {
                        initial_pause = res.initial_pause || initial_pause;

                        chrome.tabs.sendMessage(current_tab.id, {stutter_class: stutter_class}, function (response) {
                            stutter_id_list = response.id_list;

                            if (DEBUG_LOG_TO_CONSOLE) {
                                console.log(stutter_id_list);
                            }

                            // explicitly indicate that we are at the start of the page...
                            stutter_index = 0;

                            // debug_log('Calling stutterPage - timeout: ' + initial_pause);
                            // activeTimeout = setTimeout(stutterPage, initial_pause * 1000);
                            //
                            debug_log('Calling waitForSpecifiedTime - timeout (s): ' + initial_pause);
                            requiredWaitTime = initial_pause * 1000;
                            activeTimeout = setTimeout(waitForSpecifiedTime, WAIT_TIME_INCREMENT);
                        });

                });
            });
        }
    });
}


function waitForSpecifiedTime() {
    debug_log('waitForSpecifiedTime: ' + active + ', wait time (ms): ' + requiredWaitTime);

    let gettingTab = browser.tabs.query({active: true});
    gettingTab.then((tab) => {
        let current_tab = tab[0];

        if (current_tab.id !== initial_tab_id) {
            setDormantState();
            return;
        }

        if (active) {
            elapsedWaitTime += WAIT_TIME_INCREMENT;
            if (elapsedWaitTime >= requiredWaitTime) {
                debug_log('Wait complete - scroll the page... (ms) ' + elapsedWaitTime);
                stutterPage();
            }
            else {
                // continue waiting...
                debug_log('Continue waiting... (ms) ' + elapsedWaitTime);
                activeTimeout = setTimeout(waitForSpecifiedTime, WAIT_TIME_INCREMENT);
            }
        }
    });
}

function stutterPage() {
    debug_log('stutterPage: ' + active);

    let gettingTab = browser.tabs.query({active: true});
    gettingTab.then((tab) => {
        let current_tab = tab[0];

        if (current_tab.id !== initial_tab_id) {
            setDormantState();
            return;
        }

        if (active) {
            // if we are at the end of the stuttering on this page, move to the next page...
            if (stutter_index >= stutter_id_list.length) {
                loadPage();
                return;
            }

            debug_log('stutter_index: ' + stutter_index + ' in ' + stutter_id_list.length);
            debug_log(stutter_id_list[stutter_index]);

            // send message to the scroll to the current stutter id...
            chrome.tabs.sendMessage(current_tab.id, {move_to_stutter_id: stutter_id_list[stutter_index]}, function (response) {});
                stutter_index++;

                // get parameter
                let gettingItem = browser.storage.sync.get('stutter_pause');
                gettingItem.then((res) => {

                    stutter_pause = res.stutter_pause || stutter_pause;

                    // debug_log('Calling stutterPage - timeout: ' + stutter_pause);
                    // activeTimeout = setTimeout(stutterPage, stutter_pause * 1000);
                    //
                    debug_log('Calling waitForSpecifiedTime - timeout (s): ' + stutter_pause);
                    elapsedWaitTime = 0;
                    requiredWaitTime = stutter_pause * 1000;
                    activeTimeout = setTimeout(waitForSpecifiedTime, WAIT_TIME_INCREMENT);
            });
        }

    });
}


debug_log('stutter_scroll.js: adding listener...');
browser.browserAction.onClicked.addListener(toggleStutter);
