# Automated accessibility / browser testing

This directory contains the automated accessibility and browser tests. In the current form, instead of a live backend, cypress mocked server responses are used.

## Updateting fixture data

Most of the expected server data can be updated with the update-fixtures.sh script. This will update data for parameters, application_round, reservation_unit. The application related fixtures /fixtures/application must be updated by hand.

## Testing locally with dev server

`yarn test:browser` will launch the cypress ui.
