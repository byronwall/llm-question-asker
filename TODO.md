# Immediate work to get this tested

## Dev related

## Job Tracking

- Really need to show a timer everywhere that we show a spinner?

## Branding & SEO

- Need to pick a better name for the site

## Question Types

- There seems to be a bias toward getting 4-5 responses only. In some cases, it seems like there are more options that wanted to be returned by they are not? Review and ensure all responses are returned.
- Consider a numeric input response for certain kinds of questions

## Input & User Guidance

- Allow user to highlight text and add commentary - incorporate that into questions and next output - call it `feedback`

## UX Improvement

- Ensure that question responses are saved as they are entered - do not lose them if the page is refreshed; save the free inputs on blur or enter or debounced changes
- Need to consistently scroll to the "correct spot" when new data loads -- it's going to cause a layout shift regardless, may as well end up in the right place

## UI Improvement

- Tables are quite poor on mobile - might switch over to a simple card based displayed (even in Markdown)
- There is a horizontal overflow on the analysis and recs section since the 2 buttons too wide together -- put in a flex wrap to handle this

## Infrastructure & Session Logic

- Consider how to handle network requests as the user starts more than 1 session -- question answering did not force the UI to update when going somewhere else -- starting a new session included a redirect even though I left the original page

## Prompt & Response Strategy

- Revise the prompt to avoid offering "I can do next" type responses or askign questions at the end of the response - want that to be controlled by the app and not the LLM's default offering.

## Did not work

- Add a table of contents to the markdown renderer - place on left edge like Less Wrong -- looked too bad, need to rework this if wanted in
