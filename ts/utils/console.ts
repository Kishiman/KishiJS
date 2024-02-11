

export class KConsole {

	static log(message: any) {
		// Create an Error object to capture the stack trace
		const error = new Error();
		// Extract file name and line number from the stack trace
		const trace = error.stack?.split('\n')[2];
		if (trace) {
			const [fileName, lineNumber] = trace?.trim().replace(/^at /, '').split(':');
			// Log the message with file name and line number
			console.log(`[${fileName}:${lineNumber}] ${message}`);
		}
	}
}
