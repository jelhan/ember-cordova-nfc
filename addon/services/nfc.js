import Ember from 'ember';

const {
  A: emberArray,
  Evented,
  Service,
  computed,
  get,
  isEmpty,
  isPresent,
  observer,
  run,
  set
} = Ember;

/*
 * Listener for ndef tags matching defined mime types are not added before
 * mimeTypes are defined.
 */
const NFC_EVENTS = [
  {
    methodName: 'TagDiscoveredListener',
    name: 'tagDiscovered'
  },
  {
    methodName: 'NdefListener',
    name: 'ndefTagDiscovered'
  },
  {
    methodName: 'NdefFormatableListener',
    name: 'formatableNdefTagDiscovered'
  }
];

export default Service.extend(Evented, {
  /**
   * Returns `true` if NFC is enabled and `false` if NFC is disabled or
   * not supported by device. Returns `null` if we don't have information (yet).
   *
   * @prop enabledservice.get('availabe')
   * @type Boolean|null
   * @public
   */
  availabe: computed('nfcStatus', function () {
    if (!get(this, 'nfcPluginAvailable')) {
      return false;
    }

    switch (get(this, 'nfcStatus')) {
      case 'NFC_DISABLED':
      case 'NFC_ENABLED':
        return true;

      case 'NO_NFC':
        return false;

      case null:
        this.updateNFCStatus();
        return null;
    }

    return null;
  }),

  /**
   * Returns `true` if NFC is enabled and `false` if NFC is disabled or
   * not supported by device. Returns `null` if we don't have information yet.
   *
   * @prop enabled
   * @type Boolean|null
   * @public
   */
  enabled: computed('nfcStatus', function () {
    if (get(this, 'availabe') === false) {
      return false;
    }

    switch (get(this, 'nfcStatus')) {
      case 'NFC_ENABLED':
        return true;

      case 'NFC_DISABLED':
      case 'NO_NFC_OR_NFC_DISABLED':
        return false;

      case null:
        this.updateNFCStatus();
        return null;
    }

    return null;
  }),

  init() {
    this._super();

    set(this, 'listeners', []);

    if (isEmpty(get(this, 'nfc')) && isPresent(window.nfc)) {
      set(this, 'nfc', window.nfc);
    }

    if (get(this, 'nfcPluginAvailable')) {
      this.setupListeners();
    }

    // consume observed properties
    get(this, 'mimeTypes');
  },

  /**
   * Stores a reference to all registered listeners.
   * @prop listeners
   * @default []
   * @private
   */
  listeners: undefined,

  /**
   * Array of mime types which are listened for by `ndefTagWithMimeTypeDiscovered`
   *
   * @prop mimeTypes
   * @type Array
   */
  mimeTypes: emberArray(),

  /**
   * @prop nfc
   * @private
   */
  nfc: undefined,

  updateMimeTypeListener: observer('mimeTypes', 'mimeTypes.[]', function() {
    let methodName = 'MimeTypeListener';
    let name = 'ndefTagWithMimeTypeDiscovered';
    let listeners = get(this, 'listeners');
    let mimeTypeListeners = listeners.filter((listener) => {
      return listener.methodName === methodName;
    });
    let mimeTypes = get(this, 'mimeTypes');

    // remove old listeners
    mimeTypeListeners.forEach((listener) => {
      if (mimeTypes.indexOf(listener.mimeType) === -1) {
        get(this, 'nfc').removeMimeTypeListener(listener.mimeType, listener.method, () => {
          // success
        }, () => {
          // error
        });
        listeners.splice(listeners.indexOf(listener), 1);
      }
    });

    // add new listeners
    mimeTypes.forEach((mimeType) => {
      let listenerExists = mimeTypeListeners.some((listener) => {
        return listener.mimeType === mimeType;
      });
      if (!listenerExists) {
        // mime types should allways be lower case on android
        mimeType = mimeType.toLowerCase();
        let listener = {
          methodName,
          method: () => {
            this.trigger(name, ...arguments);
          },
          mimeType
        };
        get(this, 'nfc')[`add${methodName}`](mimeType, listener.method, () => {
          // success
        }, () => {
          // error
        });
        listeners.push(listener);
      }
    });
  }),

  /**
   * @prop nfcPluginAvailable
   * @private
   */
  nfcPluginAvailable: computed(function() {
    return isPresent(get(this, 'nfc'));
  }),

  /**
   * @prop nfcStatus
   * @private
   */
  nfcStatus: null,

  /**
   * @method setupListeners
   * @private
   */
  setupListeners() {
    NFC_EVENTS.forEach(({ name, methodName }) => {
      let listener = {
        method: () => {
          this.trigger(name, ...arguments);
        },
        methodName,
        name
      };

      if (typeof get(this, 'nfc')[`add${methodName}`] !== 'function') {
        return;
      }

      get(this, 'nfc')[`add${methodName}`](listener.method, () => {
        // success
      }, () => {
        // error
      });
      this.listeners.push(listener);
    });
  },

  /**
   * @method teardownListeners
   * @private
   */
  teardownListeners() {
    let nfc = get(this, 'nfc');
    this.listeners.forEach(({ method, name, methodName, mimeType }) => {
      switch (methodName) {
        case 'MimeTypeListener':
          nfc[`removeMimeTypeListener`](mimeType, method, () => {
            // success
          }, () => {
            // error
          });
        break;

        default:
          nfc[`remove${methodName}`](method, () => {
            // success
          }, () => {
            // error
          });
      }
    });
    this.listeners = [];
  },

  /**
   * updates `enabled` and `available` status via `nfc.enabled()`
   * @method _updateNFCStatus
   * @private
   */
  updateNFCStatus() {
    run.once(() => {
      get(this, 'nfc').enabled(() => {
        set(this, 'nfcStatus', 'NFC_ENABLED');
      }, (reason) => {
        set(this, 'nfcStatus', reason);
      });
    });
  },

  willDestroy() {
    this.teardownListeners();
  },
});
