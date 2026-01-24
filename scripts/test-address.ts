import { Address } from '@ton/core';

const rawAddress = "0:45eb79191d83209ca593945dabc4720c94014f37e80e307ec65e438d160440b3";

try {
    const addr = Address.parse(rawAddress);
    console.log("Parsed Name:", addr.toString());
    console.log("Parsed Raw:", addr.toRawString());
} catch (e) {
    console.error("Parse Failed:", e);
}
