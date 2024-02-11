import fs from 'fs'

process
  .on('unhandledRejection', (reason, p) => {
    console.error(reason, 'Unhandled Rejection at Promise', p);
    console.error(new Error().stack);

  })
  .on('uncaughtException', err => {
    console.error(err, 'Uncaught Exception thrown');
    process.exit(1);
  });

let lines: string[] = []
// read contents of the file
const data = fs.readFileSync('docs/pup.csv', 'utf-8')

// split the contents by new line
lines = data.split(/\r?\n/)

console.log(lines.length);
lines = [...new Set(lines)]
console.log(lines.length);
for (const line of lines) {
  fs.appendFileSync("docs/pup_.csv", line + "\n")
}




