import { escapeHtml } from "../shared/escape.mjs";

export { escapeHtml };

/** Tagged template that escapes every interpolated value unless it is `raw()` markup. */
export function html(strings, ...values) {
  let out = strings[0];
  values.forEach((value, index) => {
    out += render(value) + strings[index + 1];
  });
  return new Raw(out);
}

class Raw {
  constructor(value) {
    this.value = value;
  }
  toString() {
    return this.value;
  }
}

/** Mark trusted, already-rendered markup so `html` inserts it verbatim. */
export const raw = (value) => new Raw(String(value));

function render(value) {
  if (value === null || value === undefined || value === false) return "";
  if (value instanceof Raw) return value.value;
  if (Array.isArray(value)) return value.map(render).join("");
  return escapeHtml(value);
}
