const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("app.js", "utf8");

function extractFunction(name, context = {}) {
  const marker = `function ${name}(`;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `missing production function: ${name}`);
  const brace = source.indexOf("{", start);
  let depth = 0;
  let end = -1;
  for (let i = brace; i < source.length; i++) {
    if (source[i] === "{") depth++;
    if (source[i] === "}") {
      depth--;
      if (depth === 0) { end = i + 1; break; }
    }
  }
  assert.notEqual(end, -1, `could not parse production function: ${name}`);
  return vm.runInNewContext(`(${source.slice(start, end)})`, context);
}

const validNumber = extractFunction("isValidNumericInput");
const isSoldCar = extractFunction("isSoldCar", { amount: value => Number(value) || 0 });
const carPeriodDate = extractFunction("carPeriodDate", { isSoldCar });

test("numeric input rejects text and accepts decimal/Arabic digits", () => {
  assert.equal(validNumber("1250.50"), true);
  assert.equal(validNumber("١٢٥٠٫٥٠"), true);
  assert.equal(validNumber("1,250.50"), true);
  assert.equal(validNumber("abc"), false);
  assert.equal(validNumber("12x"), false);
  assert.equal(validNumber(""), true);
});

test("sold vehicles are assigned to the actual sale period", () => {
  assert.equal(carPeriodDate({ status: "مباع", date: "2026-12-28", saleDate: "2027-01-03" }), "2027-01-03");
  assert.equal(carPeriodDate({ status: "قيد البيع", date: "2026-12-28", saleDate: "" }), "2026-12-28");
  assert.equal(carPeriodDate({ status: "كاش", date: "2026-12-28" }), "2026-12-28");
});

test("sale-period date falls back to purchase date for legacy sold records", () => {
  assert.equal(carPeriodDate({ status: "متبقي", date: "2026-06-10" }), "2026-06-10");
});
