import { PDFLib } from "../utils/pdf";


async function test() {
  const text = await PDFLib.PdfToText("docs/lorem.pdf")
  console.log(text);
}
test()