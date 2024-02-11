import { config } from "../config"
import unorm from "unorm"
export function splitByMax(target: string, maxSize: number, separator: string): string[] {
	const result = [];
	let currentString = '';

	const parts = target.split(separator);
	for (let i = 0; i < parts.length; i++) {
		const part = parts[i];
		if (currentString.length + part.length <= maxSize) {
			currentString += (currentString.length > 0 ? separator : '') + part;
		} else {
			result.push(currentString);
			currentString = part;
		}
	}
	if (currentString.length > 0) {
		result.push(currentString);
	}
	return result
}
export function startsWithIncensitive(str: string, searchStr: string): boolean {
	const normalizedSearch = unorm.nfd(searchStr.toLowerCase());
	return unorm.nfd(str.toLowerCase()).startsWith(normalizedSearch)
}
export function replaceLast(string: string, target: string, replaceBy: string) {
	const lastIndex = string.lastIndexOf(target);
	if (lastIndex === -1) {
		// Target string not found, return the original string
		return string;
	}
	const before = string.substring(0, lastIndex);
	const after = string.substring(lastIndex + target.length);
	return before + replaceBy + after;
}

export function optimizeStr(content: string) {
	let output = content
	const lineReplacers: [RegExp, string][] = [
		[/[\x01\x1F]/g, '*'],
		[/\r/g, ' '],
		[/\s{4,}/g, '\t'],
		// [/\t+/g, '\t'],
		[/^[ \t]+$/g, ''],
	]
	const replacers: [RegExp, string][] = [
		[/\f/g, '\n'],
		[/\s+\n/g, '\n'],
		[/\t+\n/g, '\n'],
		[/^\n[ \t]+$/g, '\n'],
		[/\n+/g, '\n'],
	]
	for (const replacer of lineReplacers) {
		output = output.split("\n").map(str => str.replace(replacer[0], replacer[1])).join("\n")
	}
	for (const replacer of replacers) {
		output = output.replace(replacer[0], replacer[1])
	}
	return output
}

export function UrlToUploadPath(path: string) {
	if (path?.startsWith(config.server.publicUrl))
		return path.replace(config.server.publicUrl, config.uploadPath)
	return path
}
export function pathHead(path: string): [string, string, string[]] {
	const parts = path.split(".")
	const head = parts[0]
	const restPath = parts.slice(1).join(".")
	return [head, restPath, parts]
}
export function pathTail(path: string): [string, string, string[]] {
	const parts = path.split(".")
	const tail = parts.pop() as string
	const restPath = parts.join(".")
	return [restPath, tail, parts]
}
export function pathConcat(left: string, right: string) {
	if (left && right)
		return `${left}.${right}`
	return left ? left : right
}
export function capitalizeFirstLetter(string: string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}
export function lowerCaseFirstLetter(string: string) {
	return string.charAt(0).toLowerCase() + string.slice(1);
}

export function fixFrenchDiacritics(text: string) {
	// Replace `e with é
	text = text.replace(/´e/gi, 'é');
	text = text.replace(/`e/gi, 'è');
	text = text.replace(/\^e/gi, 'ê');
	text = text.replace(/"e/gi, 'ë');
	text = text.replace(/\^a/gi, 'â');
	text = text.replace(/`a/gi, 'à');
	text = text.replace(/a`/gi, 'à');
	text = text.replace(/\^i/gi, 'î');
	text = text.replace(/"i/gi, 'ï');
	text = text.replace(/\^o/gi, 'ô');
	text = text.replace(/\^u/gi, 'û');
	text = text.replace(/,c/gi, 'ç');
	// Return the corrected text
	return text;
}
const countOccurrences = (str: string): Record<string, number> => {
	const charCount: Record<string, number> = {};
	try {
		for (const char of str) {
			if (/[a-zA-Z0-9]/.test(char)) {
				charCount[char] = (charCount[char] ?? 0) + 1
			}
		}
	} catch (error) {
		console.error(str);
		throw error
	}
	return charCount;
};

function calculateSimilarity(occ1: Record<string, number>, occ2: Record<string, number>, order: number = 1) {

	let totalDifference = 0;

	// Calculate the absolute difference in character occurrences
	const keys = [...new Set([...Object.keys(occ1), ...Object.keys(occ2)])]
	for (const char of keys) {
		totalDifference += Math.abs((occ1[char] ?? 0) - (occ2[char] ?? 0)) ** order;
	}

	// Calculate the average difference
	const averageDifference = (totalDifference ** (1 / order)) / (keys.length);

	// Normalize the similarity value to be between 0 and 1
	const similarity = 1 / (1 + averageDifference);

	return similarity;
}
const averageOccurrences = (occs: Record<string, number>[]): Record<string, number> => {
	const averageOcc: Record<string, number> = {};
	let keys: string[] = []
	occs.map(occ => keys.push(...Object.keys(occ)))
	keys = [...new Set(...keys)]
	for (const occ of occs) {
		for (const key in occ) {
			averageOcc[key] = (averageOcc[key] ?? 0) + occ[key]
		}
	}
	for (const key in averageOcc) {
		averageOcc[key] = averageOcc[key] / occs.length
	}
	return averageOcc
};
export function compareStrings(str1: string, str2: string, order: number = 1): number {
	const occ1 = countOccurrences(str1)
	const occ2 = countOccurrences(str2)
	return calculateSimilarity(occ1, occ2, order)
};
export function matchStringsToOccurences(lines: string[],
	occs: Record<string, number>[],

	{
		minSimilarity, minLength
	}: {
		minSimilarity: number;
		minLength: number;
	}, order: number = 1): number[] {
	const indexes: number[] = [];
	const linesOccs: Record<string, number>[] = [];

	for (const line of lines) {
		linesOccs.push(countOccurrences(line))
	}
	for (let i = 0; i < lines.length; i++) {
		if (lines[i].length < minLength) continue;
		if (indexes.includes(i)) continue;
		for (const occ of occs) {
			const similarity = calculateSimilarity(linesOccs[i], occ, order);
			if (similarity >= minSimilarity) {
				indexes.push(i);
				break;
			}
		}
	}
	return indexes;
}

export function detectPatternStrings(lines: string[], {
	minSimilarity, minOcc, minLength
}: {
	minSimilarity: number;
	minOcc: number;
	minLength: number;
}, order: number = 1): number[] {
	const indexes: number[] = [];
	const linesOccs: Record<string, number>[] = [];

	for (const line of lines) {
		linesOccs.push(countOccurrences(line))
	}
	for (let i = 0; i < lines.length; i++) {
		if (lines[i].length < minLength) continue;
		if (indexes.includes(i)) continue;
		const similarIndexes = [];
		for (let j = i + 1; j < lines.length; j++) {
			const similarity = calculateSimilarity(linesOccs[i], linesOccs[j], order);
			if (similarity >= minSimilarity) {
				if (indexes.includes(j)) {
					indexes.push(i);
					break;
				}
				similarIndexes.push(j);
			}
		}
		if (similarIndexes.length >= minOcc) {
			indexes.push(i, ...similarIndexes);
		}
	}
	return indexes;
}
export function detectPatternsGroups(lines: string[], {
	minSimilarity, minOcc, minLength
}: {
	minSimilarity: number;
	minOcc: number;
	minLength: number;
}, order: number = 1): [number[], Record<string, number>][] {
	const groups: [number[], Record<string, number>][] = [];
	const linesOccs: Record<string, number>[] = [];
	if (lines.some(line => !line)) {
		console.warn(lines);
	}

	for (const line of lines) {
		linesOccs.push(line ? countOccurrences(line) : {});
	}

	for (let i = 0; i < lines.length; i++) {
		if (!lines[i]) continue
		if (lines[i].length < minLength) continue;
		if (groups.some(group => group[0].includes(i))) continue;

		const similarIndexes: number[] = [i];

		for (let j = i + 1; j < lines.length; j++) {
			if (groups.some(group => group[0].includes(j))) continue;

			const similarity = calculateSimilarity(linesOccs[i], linesOccs[j], order);

			if (similarity >= minSimilarity) {
				similarIndexes.push(j);
			}
		}

		if (similarIndexes.length >= minOcc) {
			const occs = similarIndexes.map(idx => linesOccs[idx])
			const averageOcc = averageOccurrences(occs)

			groups.push([similarIndexes, averageOcc]);
		}
	}

	return groups;
}
