# Immediate work to get this tested

## Question Types

- add a new question type to help identify the user's overall goal -- so not just questions to get context, but really try to determine their overall goal - reveal the question type as a small chip in the UI when showing the questions

## Input & User Guidance

- Should add a box to the input which is the "goal" and a separate one for the context -
- For additional rounds, provide a text box that allows user to guide the questions and any changes to expected output
- Allow user to highlight text and add commentary - incorporate that into questions and next output - call it `feedback`
- Allow user to request questions in a specific direction? Maybe offer a "suggestions for next questions" as part of the structured response... then show a drop down menu where the user can choose, submit, and get new questions in a certain way

## UX Improvement

- When results come back for 2nd round of questions, need to select that tab and scroll to top to answer them

## UI Improvement

## Infrastructure & Session Logic

- Consider how to handle network requests as the user starts more than 1 session -- question answering did not force the UI to update when going somewhere else -- starting a new session included a redirect even though I left the original page

## Prompt & Response Strategy

- Should probably revise the prompt to avoid "I can do next" type responses - want that to be controlled by the app and not the LLM's default offering.

## Branding & SEO

- Clean up the page title + ensure that there is some OG content for share links

## Did not work

- Add a table of contents to the markdown renderer - place on left edge like Less Wrong -- looked too bad, need to rework this if wanted in
