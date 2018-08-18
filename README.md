# Stutter Scroll

### Use a set of webpages as digital signage ###

Reading scrolling text is difficult - Stutter Scroll pauses as it scrolls through a set of webpages.
Pauses occur at instances of a specified css class - these tags should each have a unique #id selector
assigned. Stutter Scroll scrolls to each #id in turn.

#### Example ####

```HTML
...
<div class="stutter_scroll_stop_here" id="unique_id_a>"></div>
...
<div class="stutter_scroll_stop_here" id="unique_id_b>"></div>
...
<div class="stutter_scroll_stop_here" id="unique_id_c>"></div>
...
```


### Development release 1.0-beta ###

*Provided defaults are currently for development.*

This is a work in progress for release on a project in early September. 

Release version will have a working set of defaults to demo Stutter Scroll.

### Likely future stuff ###

* What if the CSS class is not found?
  * Scroll by a fraction of the page height until the end?
* Page load is currently visible as everything happens in a single tab.
  * Move the next page load to another tab and alternate between two tabs,
  * In anticipation, already using a background script.


