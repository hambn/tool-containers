/**
 * The element id a URL fragment names: `#file-a%20b` → `file-a b`. Returns
 * null for an empty fragment or one that is not valid percent-encoding
 * (`#%`), which `decodeURIComponent` would throw on.
 * @param {string} hash `location.hash` or an anchor's `hash`, with its `#`
 * @returns {string | null}
 */
export function fragmentId(hash) {
  if (!hash || hash === "#") return null;
  try {
    return decodeURIComponent(hash.slice(1));
  } catch {
    return null;
  }
}
