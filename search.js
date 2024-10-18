import fs from 'fs';
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { fork } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import os from "os"

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const numchild = os.cpus().length;

const args = process.argv.slice(2);
if (args.length != 2) {
  console.log("bad args", args);
  process.exit(-1);
}
const pdfPath = args[0]; // Path to your PDF file
const searchText = args[1]; // Text to search for

// Load the PDF document to get the number of pages
const data = new Uint8Array(fs.readFileSync(pdfPath));
getDocument({ data: data }).promise.then(async (pdf) => {
  const pagePerChild = Math.ceil(pdf.numPages / numchild);
  let foundPages = [];

  const childPromises = [];

  // Loop through all the children
  for (let i = 0; i < numchild; i++) {
    const startPage = i * pagePerChild + 1;
    const endPage = Math.min((i + 1) * pagePerChild, pdf.numPages);

    const child = fork(path.join(__dirname, 'child.js'));
    
    const childPromise = new Promise((resolve) => {
      child.on('message', (message) => {
        foundPages.push(...message.result);
        resolve();
      });
    });

    childPromises.push(childPromise);

    child.send({
      pdfPath,
      startPage,
      endPage,
      searchText
    });
  }

  await Promise.all(childPromises);

  if (foundPages.length === 0) {
    console.log('Text not found in the document.');
  } else {
    console.log(`Text found on pages: ${foundPages.join(', ')}`);
    console.log(`Total occurrences: ${foundPages.length}`);
  }
}).catch((err) => {
  console.error('Error: ' + err);
});
