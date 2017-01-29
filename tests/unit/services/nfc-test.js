import { moduleFor, test } from 'ember-qunit';
import Ember from 'ember';

const { assign, get, run } = Ember;

moduleFor('service:nfc', 'Unit | Service | nfc', {
});

const NFC_MOCK = {
  addTagDiscoveredListener() {},
  removeTagDiscoveredListener() {},
  addNdefListener() {},
  removeNdefListener() {},
  addNdefFormatableListener() {},
  removeNdefFormatableListener() {},
  addMimeTypeListener() {},
  removeMimeTypeListener() {},
  enabled() {}
};

test('does not throw if nfc object is not available', function(assert) {
  let service = this.subject();
  assert.ok(service);
});

test('properties available and enabled: status are retrieved after first access', function(assert) {
  assert.expect(3);

  // mock nfc object
  let nfc = assign({}, NFC_MOCK, {
    enabled() {
      assert.ok(false, 'enabled is not called before one of the properties are accessed');
    }
  });

  let service = this.subject({ nfc });

  nfc.enabled = function(success) {
    assert.ok(true, 'enabled is called');
    success();
  };
  run(() => {
    assert.strictEqual(service.get('availabe'), null, '`available` is null on first access');
  });
  run(() => {
    assert.strictEqual(service.get('availabe'), true, '`available` gets updated as soon as information is availabe');
  });
});

test('properties available and enabled: no nfc support', function(assert) {
  assert.expect(3);

  // mock nfc object
  let nfc = assign({}, NFC_MOCK, {
    enabled(success, error) {
      error('NO_NFC');
    }
  });

  let service = this.subject({ nfc });

  run(() => {
    assert.strictEqual(service.get('availabe'), null, '`available` is null on first access');
  });
  run(() => {
    assert.strictEqual(service.get('availabe'), false, '`available` is false if device returns NO_NFC');
    assert.strictEqual(service.get('enabled'), false, '`enabled` is false if device returns NO_NFC');
  });
});

test('properties available and enabled: NO_NFC_OR_NFC_DISABLED (Windows)', function(assert) {
  assert.expect(3);

  // mock nfc object
  let nfc = assign({}, NFC_MOCK, {
    enabled(success, error) {
      error('NO_NFC_OR_NFC_DISABLED');
    }
  });

  let service = this.subject({ nfc });
  run(() => {
    assert.strictEqual(service.get('availabe'), null, '`available` is null on first access');
  });
  run(() => {
    assert.strictEqual(service.get('availabe'), null, '`available` is null if device returns NO_NFC_OR_NFC_DISABLED');
    assert.strictEqual(service.get('enabled'), false, '`enabled` is false if device returns NO_NFC_OR_NFC_DISABLED');
  });
});

test('properties available and enabled: nfc disabled', function(assert) {
  assert.expect(3);

  // mock nfc object
  let nfc = assign({}, NFC_MOCK, {
    enabled(success, error) {
      error('NFC_DISABLED');
    }
  });

  let service = this.subject({ nfc });
  run(() => {
    assert.strictEqual(service.get('availabe'), null, '`available` is null on first access');
  });
  run(() => {
    assert.strictEqual(service.get('availabe'), true, '`available` is true if device returns NFC_DISABLED');
    assert.strictEqual(service.get('enabled'), false, '`enabledservice` is false if device returns NFC_DISABLED');
  });
});

test('event tagDiscovered, ndefTagDiscovered and formatableNdefTagDiscovered listeners are setup on init and removed on destroy', function(assert) {
  assert.expect(7);
  let nfc = assign({}, NFC_MOCK, {
    addTagDiscoveredListener() {
      assert.ok(true, 'Registers listener for tagDiscovered on init');
    },
    removeTagDiscoveredListener() {
      assert.ok(false, 'Does not remove listener for tagDiscovered before destroy');
    },
    addNdefListener() {
      assert.ok(true, 'Registers listener for ndefTagDiscovered on init');
    },
    removeNdefListener() {
      assert.ok(false, 'Does not remove listener for ndefTagDiscovered before destroy');
    },
    addNdefFormatableListener() {
      assert.ok(true, 'Registers listener for formatableNdefTagDiscovered on init');
    },
    removeNdefFormatableListener() {
      assert.ok(false, 'Does not remove listener for formatableNdefTagDiscovered before destroy');
    }
  });

  let service = this.subject({ nfc });
  assert.equal(get(service, 'listeners.length'), 3, 'Listeners property contains registered listeners');

  nfc.removeTagDiscoveredListener = function() {
    assert.ok(true, 'Removes listener for tagDiscovered on destroy');
  };
  nfc.removeNdefListener = function() {
    assert.ok(true, 'Removes listener for ndefTagDiscovered on destroy');
  };
  nfc.removeNdefFormatableListener = function() {
    assert.ok(true, 'Removes listener for formatableNdefTagDiscovered on destroy');
  };
});

test('event ndefTagWithMimeTypeDiscovered listeners are registered and removed if mimeTypes array changes', function(assert) {
  assert.expect(9);

  let nfc = assign({}, NFC_MOCK, {
    addMimeTypeListener() {
      assert.ok(false, 'addMimeTypeListener should not be called until mime types are added');
    },
    removeMimeTypeListener() {
      assert.ok(false, 'removeMimeTypeListener should not be called before mime types are removed or object is destroyed');
    }
  });
  let service = this.subject({ nfc });

  nfc.addMimeTypeListener = function() {
    assert.ok(true, 'addMimeTypeListener is called when another mime type is added to mimeTypes array');
  };
  run(() => {
    get(service, 'mimeTypes').pushObject('text/plain');
  });
  assert.ok(
    get(service, 'listeners').some((listener) => {
      return listener.mimeType === 'text/plain';
    }), 'Listener is added to `listeners` array.'
  );
  run(() => {
    get(service, 'mimeTypes').pushObject('application/json');
  });
  assert.ok(
    get(service, 'listeners').some((listener) => {
      return listener.mimeType === 'application/json';
    }), 'Listener is added to `listeners` array.'
  );

  nfc.removeMimeTypeListener = function(mimeType) {
    assert.ok(true, 'removeMimeTypeListener is called when mime type is removed from `mimeTypes` array');
    assert.equal(mimeType, 'application/json', 'removeMimeTypeListener is called with correct mime type as first argument');
  };
  run(() => {
    get(service, 'mimeTypes').removeAt(1);
  });
  assert.notOk(
    get(service, 'listeners').some((listener) => {
      return listener.mimeType === 'application/json';
    }), 'Listener is removed from `listeners` array.'
  );

  nfc.removeMimeTypeListener = function(mimeType) {
    assert.ok(true, 'removeMimeTypeListener is called on destroy for remaining listener');
    assert.equal(mimeType, 'text/plain', 'removeMimeTypeListener is called with correct mime type as first argument');
  };
});
