// Short helpers for writing form fields in scripts/flagship/data/*.mjs.
// o: { req, ph (placeholder), half, help, rows, def (default), opts (options for select/chips), max (maxLength) }
const field = (type) => (key, label, o = {}) => ({
  key,
  label,
  type,
  ...(o.req ? { required: true } : {}),
  ...(o.ph ? { placeholder: o.ph } : {}),
  ...(o.half ? { half: true } : {}),
  ...(o.help ? { help: o.help } : {}),
  ...(o.rows ? { rows: o.rows } : {}),
  ...(o.def !== undefined ? { default: o.def } : {}),
  ...(o.opts ? { options: o.opts } : {}),
  ...(o.profile ? { profile: o.profile } : {}),
  ...(o.max !== undefined ? { maxLength: o.max } : {}),
});

export const t = field("text");
export const ta = field("textarea");
export const num = field("number");
export const money = field("money");
export const date = field("date");
export const sel = (key, label, opts, o = {}) => field("select")(key, label, { ...o, opts });
export const chips = (key, label, opts, o = {}) => field("chips")(key, label, { ...o, opts });

export const LANGS = ["English", "Hindi", "Hinglish"];
export const lang = (o = {}) => sel("language", "Language of the result", LANGS, { half: true, def: "English", ...o });
