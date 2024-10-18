
import fs from 'fs';
import {getDocument} from "pdfjs-dist/legacy/build/pdf.mjs";

const args = process.argv.slice(2);
if (args.length != 2) {
  console.log("bad args", args);
  process.exit(-1);
}
const pdfPath = args[0]; // Path to your PDF file
const searchText = args[1]; // Text to search for

// Read the PDF file into a typed array
const data = new Uint8Array(fs.readFileSync(pdfPath));

// Load the PDF document
getDocument({ data: data }).promise.then(async (pdf) => {
  let numMatches = 0;

  // Loop through all the pages
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    console.log(pageNum)
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    // Extract text items from the content
    const strings = content.items.map((item) => item.str);

    // Join the strings to form the page text
    const pageText = strings.join(' ');

    // Perform the search
    if (pageText.includes(searchText)) {
      numMatches++;
      console.log(`Found on page ${pageNum}`);
    }
  }

  if (numMatches === 0) {
    console.log('Text not found in the document.');
  } else {
    console.log($`Total occurrences: ${numMatches}`);
  }
}).catch((err) => {
  console.error('Error: ' + err);
});