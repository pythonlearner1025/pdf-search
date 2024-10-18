import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import fs from 'fs';

process.on('message', async function({ pdfPath, startPage, endPage, searchText }) {
  const matches = [];
  
  // Read the PDF file
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  
  // Load the PDF document
  const pdf = await getDocument({ data: data }).promise;

  for (let i = startPage; i <= endPage; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    
    // Extract text items from the content
    const strings = content.items.map((item) => item.str);

    // Join the strings to form the page text
    const pageText = strings.join(' '); 

    if (pageText.includes(searchText)) {
      matches.push(i);
    }
  }

  process.send({
    child: process.pid,
    result: matches 
  });

  process.disconnect();
});
