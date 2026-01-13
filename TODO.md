# Immediate work to get this tested

## Dev related

## Job Tracking

- Really need to show a timer everywhere that we show a spinner?

## Branding & SEO

## Question Types

- Consider a numeric input response for certain kinds of questions

## Input & User Guidance

- Allow user to highlight text and add commentary - incorporate that into questions and next output - call it `feedback`

## UX Improvement

- Ensure that question responses are saved as they are entered - do not lose them if the page is refreshed; save the free inputs on blur or enter or debounced changes
- Need to consistently scroll to the "correct spot" when new data loads -- it's going to cause a layout shift regardless, may as well end up in the right place

## UI Improvement

- Tables are quite poor on mobile - might switch over to a simple card based displayed (even in Markdown)
- Need a strongr separation between the analysis + rec and the next steps + inputs below it. A horizontal rule or a border would help. Or some gap that matches the background color.

## Infrastructure & Session Logic

- Consider how to handle network requests as the user starts more than 1 session -- question answering did not force the UI to update when going somewhere else -- starting a new session included a redirect even though I left the original page

## Prompt & Response Strategy

## Export

- Allow exporting an entire session as markdown - include all rounds, questions, answers, output... everything; add a `...` menu item to the header of the session page

## Did not work

- Add a table of contents to the markdown renderer - place on left edge like Less Wrong -- looked too bad, need to rework this if wanted in
