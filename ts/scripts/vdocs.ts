import JSZip from "jszip"
import fs from "fs";
import { Blob } from 'node:buffer';
import blobToBuffer from 'blob-to-buffer';

async function docxToXML(buffer: Buffer) {
  const uint8Array = new Uint8Array(buffer);
  const blob = new Blob([uint8Array], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });

  let docxContent = blob.arrayBuffer()

  // Extract the contents of the DOCX file using JSZip
  let zip = new JSZip();
  const xml = await zip.loadAsync(docxContent as any).then(async (zip) => await zip.file("word/document.xml")?.async("string"))
  return xml
}
async function xmlToDocx(xml: string): Promise<Buffer> {
  // Create a new instance of JSZip
  let zip = new JSZip();

  // Add the XML content to the ZIP file
  zip.file("word/document.xml", xml);

  // Generate the ZIP file as an ArrayBuffer
  const zipContent = await zip.generateAsync({ type: "uint8array" });

  // Convert the ArrayBuffer to a Buffer
  const buffer = Buffer.from(zipContent.buffer);

  // Return the Buffer
  return buffer;
}
async function replaceDocxParams(firstName: string, lastName: string) {
  return new Promise(async (resolve, reject) => {
    try {

      // Load the DOCX file as a string using an HTTP request
      const buffer = fs.readFileSync("assets/docx/example.docx")
      let data = await docxToXML(buffer)
      if (!data) throw ""
      console.log(data);
      // Modify the XML files using JavaScript string manipulation
      data = data?.replace("${firstName}", firstName);
      data = data?.replace("${lastName}", lastName);
      const outBlob = await xmlToDocx(data)
      console.log(data);

      fs.writeFileSync("assets/docx/example_out.docx", outBlob)
      resolve(data)
    } catch (error) {
      reject(error)
    }
  })
}
replaceDocxParams("Fares", "MANAI")




