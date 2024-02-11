import XLSX from "xlsx"
import fs from "fs"
import { parse } from "csv-parse"
import { Parser } from "json2csv"
import fileUpload from "express-fileupload";
export class CSVLib {
  static ParseLine(line: string): string[] {
    const regex = /"([^"]*)"/g; // Regex pattern to match strings within double quotes
    const matches = line.match(regex); // Find all matches
    if (!matches) {
      return [];
    }
    const extractedStrings = matches.map(match => match.replace(/"/g, '')); // Remove double quotes from matches  
    return extractedStrings;
  }
  static ParseLines(lines: string[]): string[][] {
    return lines.map(line=>this.ParseLine(line))
  }
  static XlsxToCsv(inPath: string, outPath: string) {
    // Load the XLSX file
    const workbook = XLSX.readFile(inPath);

    // Get the name of the first sheet
    const sheetName = workbook.SheetNames[0];

    // Get the worksheet
    const worksheet = workbook.Sheets[sheetName];

    // Convert the worksheet to CSV
    const csv = XLSX.utils.sheet_to_csv(worksheet);

    // Write the CSV to a file
    fs.writeFileSync(outPath, csv);
  }
  static XlsxToRecords(source: string | fileUpload.UploadedFile): Record<string, string>[][] {
    let recordsPerSheet: Record<string, string>[][] = []
    // Load the XLSX file
    let workbook: XLSX.WorkBook;
    if (typeof source === "string") {
      workbook = XLSX.readFile(source);
    } else {
      workbook = XLSX.read(source.data);
    }

    for (const sheetName of workbook.SheetNames) {
      // Get the worksheet
      const worksheet = workbook.Sheets[sheetName];
      let records = []
      const sheetRows: string[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      const [_headers, ...rows] = sheetRows
      const headers = _headers.map(str => str.trim())
      for (const row of rows) {
        let record: any = {}
        for (const idx in headers) {
          record[headers[idx]] = String(row[idx] || "")
        }
        if (Object.values(record).filter(item => item).length == 0)
          continue
        records.push(record)
      }
      recordsPerSheet.push(records)
    }
    return recordsPerSheet
  }
  static CsvStringToRecords(csvStr: string): Promise<Record<string, string>[]> {
    return new Promise((resolve, reject) => {
      try {
        parse(csvStr, { delimiter: ',', columns: true }, (err, records) => {
          if (err)
            return reject(err)
          resolve(records)
        });
      } catch (error) { reject(error) }
    })
  }
  static CsvToRecords(source: string | fileUpload.UploadedFile, encoding?: BufferEncoding): Promise<Record<string, string>[]> {
    return new Promise((resolve, reject) => {
      try {
        let csvData: string | Buffer;
        if (typeof source === "string") {
          csvData = fs.readFileSync(source, encoding);
        } else {
          csvData = source.data.toString(encoding);
        }
        // Parse the CSV data
        parse(csvData, { delimiter: ',', columns: true }, (err, records) => {
          if (err)
            return reject(err)
          resolve(records)
        });
      } catch (error) { reject(error) }
    })
  }
  static RecordsToCSVString(records: any[]) {
    // Convert the records to CSV data
    const parser = new Parser();
    return parser.parse(records);

  }
  static RecordsToCSV(records: any[], outPath: string, encoding?: BufferEncoding) {
    // Convert the records to CSV data
    const parser = new Parser();
    const csvData = parser.parse(records);

    // Write the CSV data to a file
    fs.writeFileSync(outPath, csvData, { encoding });

  }
}