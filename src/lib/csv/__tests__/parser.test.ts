import { strict as assert } from "node:assert";
import { parseCSV, EXAMPLE_CSV } from "../parser";

const result = parseCSV(EXAMPLE_CSV, "company_123", "USD");
assert.equal(result.success, true);
assert.ok(result.rowsImported > 0);
assert.equal(result.preview.length, result.rowsImported);
console.log("CSV parser smoke test passed");
