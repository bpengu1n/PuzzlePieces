/* localStorage with guards: private mode and blocked site data must not
 * break the app. No dependencies.
 *
 * Usage:
 *   var store = LocalStore('myapp:');   // every key gets this prefix
 *   store.set('seen', true);
 *   store.get('seen', false);           // -> true, or the default if unset/blocked
 */
(function (root) {
  'use strict';

  function LocalStore(prefix) {
    var K = prefix || '';
    function get(k, dflt) {
      try {
        var v = localStorage.getItem(K + k);
        return v == null ? dflt : JSON.parse(v);
      } catch (e) { return dflt; }
    }
    function set(k, v) {
      try { localStorage.setItem(K + k, JSON.stringify(v)); return true; }
      catch (e) { return false; }
    }
    return { get: get, set: set };
  }

  root.LocalStore = LocalStore;
  if (typeof module !== 'undefined' && module.exports) module.exports = LocalStore;
})(typeof window !== 'undefined' ? window : this);
