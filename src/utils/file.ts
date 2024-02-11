import fs from "fs"
import Path from "path";

export type AbstractFile = { name: string, data: Buffer }

export class FileLib {
	static mv(file: AbstractFile, path: string) {
		const dirname = Path.dirname(path)
		if (!fs.existsSync(dirname)) {
			fs.mkdirSync(dirname, { recursive: true });
		}
		fs.writeFileSync(path, file.data)
	}
}