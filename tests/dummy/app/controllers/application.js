import Ember from 'ember';
/* global alert */

const { Controller, get, inject } = Ember;

export default Controller.extend({
  init() {
    let nfc = get(this, 'nfc');
    nfc.on('tagDiscovered', function() {
      alert('tag discovered');
    });
    nfc.on('ndefTagRecevided', function() {
      alert('ndef tag discovered');
    });
    nfc.on('formatableNdefTagDiscovered', function() {
      alert('formatable ndef tag discovered');
    });
  },
  nfc: inject.service('nfc')
});
