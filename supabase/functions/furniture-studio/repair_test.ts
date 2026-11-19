import { readSpec, repairJson } from "./repair.ts";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

Deno.test("a complete spec is read as is", () => {
  const spec = readSpec('{"name":"Sofa","parts":[{"item":1}]}');
  assert(spec?.name === "Sofa", "name kept");
});

Deno.test("a spec cut off mid-array keeps what was written", () => {
  const cut = '{"name":"Sofa","parts":[{"item":1,"component":"Frame"},{"item":2,"comp';
  const spec = readSpec(cut);
  assert(spec !== null, "repaired");
  const parts = spec!.parts as Array<Record<string, unknown>>;
  assert(parts[0].component === "Frame", "first part kept whole");
  assert(parts.length === 2 && parts[1].item === 2, "the cut-off part keeps what it had");
});

Deno.test("a spec cut off inside a string is repaired", () => {
  const spec = readSpec('{"name":"Sofa","parts":[{"item":1}],"notes":["foam 35 kg/m3, \\"HR\\" gr');
  assert(spec?.name === "Sofa", "repaired around the open string");
});

Deno.test("trailing commas are removed", () => {
  assert(repairJson('{"parts":[1,2,],}') === '{"parts":[1,2]}', repairJson('{"parts":[1,2,],}'));
});

Deno.test("text without parts is not a spec", () => {
  assert(readSpec('{"name":"x"}') === null, "rejected");
  assert(readSpec("sorry, I cannot") === null, "rejected prose");
});
