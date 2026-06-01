// var snap7 = require('node-snap7');
// var client = new snap7.S7Client();
// const RETRYABLE_ERRORS = [
//     2, 3, 5, 6, 7, 10065,
//     65536, 131072, 196608,
//     11534336, 9437184
// ]
// console.log(`error number 3: `, client.ErrorText(3));

// RETRYABLE_ERRORS.forEach(i => {
//     console.log(`error number ${i}: `, client.ErrorText(i));
// });

const fs = require('fs');
const snap7 = require('node-snap7');

const client = new snap7.S7Client();

const MAX_ERROR = 11534336;
const CSV_FILE = 'snap7_errors.csv';

const seen = new Map();

const stream = fs.createWriteStream(CSV_FILE);
stream.write('ErrorCode,ErrorText\n');

console.time('scan');

for (let i = 1; i <= MAX_ERROR; i++) {

    const errText = client.ErrorText(i);

    if (
        !errText ||
        errText.includes('Other Socket error')
    ) {
        continue;
    }

    // keep first occurrence only
    if (!seen.has(errText)) {

        seen.set(errText, i);

        const escapedText = errText.replace(/"/g, '""');

        stream.write(
            `${i},"${escapedText}"\n`
        );

        console.log(`${i}: ${errText}`);
    }

    // progress every 100000
    if (i % 100000 === 0) {
        console.log(`Processed ${i.toLocaleString()}`);
    }
}

stream.end();

console.timeEnd('scan');

console.log(`Unique errors found: ${seen.size}`);
console.log(`CSV written to: ${CSV_FILE}`);