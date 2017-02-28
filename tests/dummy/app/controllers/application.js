import Ember from 'ember';
/* global window */

const { Controller, get, inject } = Ember;

export default Controller.extend({
  init() {
    let nfc = get(this, 'nfc');
    nfc.on('tagDiscovered', function(event) {
      console.log('tagDiscovered');
      console.log(event);
      window.alert('tag discovered');
    });
    nfc.on('ndefTagDiscovered', function(event) {
      console.log('ndefTagDiscovered');
      console.log(event);
      window.alert('ndef tag discovered');
    });
    nfc.on('formatableNdefTagDiscovered', function(event) {
      console.log('formatable ndef tag discovered');
      console.log(event);
      window.alert('formatable ndef tag discovered');
    });
  },
  nfc: inject.service('nfc')
});
