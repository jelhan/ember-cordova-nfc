# ember-cordova-nfc

A service providing access to NFC related events.

Basically ember-cordova-nfc is wrapping [PhoneGap NFC Plugin](https://github.com/chariotsolutions/phonegap-nfc)
to consume it the ember way. It should be used together with [ember-cordova](http://embercordova.com).

## Installation

* `ember install ember-cordova`
* `ember cdv:plugin add phonegap-nfc`

## Properties

* `available`
* `enabled`

## Events

* `tagDiscovered`
* `ndefTagDiscovered`
* `ndefTagWithMimeTypeDiscovered`
* `formatableNdefTagDiscovered`

## Running Tests

* `npm test` (Runs `ember try:each` to test your addon against multiple Ember versions)
* `ember test`
* `ember test --server`

## Building

* `ember build`

For more information on using ember-cli, visit [https://ember-cli.com/](https://ember-cli.com/).
