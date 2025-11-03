import fs from "node:fs";
import path from "node:path";
import colors from "./colors.js";
import config from "./config.js";
import progress from "./progress.js";

class TestError extends Error {
	constructor(message, actual, expected) {
		super(message);
		this.name = "TestError";
		this.actual = actual;
		this.expected = expected;

		// Capture stack trace
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, TestError);
		}

		// Parse stack to get the test file location
		this.location = this.#parseStack();

		// Enhance the message with location and code snippet
		this.message = this.#formatErrorMessage(message);
	}

	#parseStack() {
		if (!this.stack) return null;

		const lines = this.stack.split('\n');
		// Find the first line that's not in expect.js
		for (const line of lines) {
			// Match typical stack trace patterns
			const match = line.match(/at.*\((.+):(\d+):(\d+)\)/) ||
				line.match(/at\s+(.+):(\d+):(\d+)/);

			if (match) {
				const filePath = match[1];
				// Skip internal files
				if (!filePath.includes('expect.js') &&
					!filePath.includes('node:internal') &&
					!filePath.includes('node_modules')) {
					return {
						file: filePath,
						line: Number.parseInt(match[2]),
						column: Number.parseInt(match[3])
					};
				}
			}
		}
		return null;
	}

	#formatErrorMessage(message) {
		if (!this.location) return message;

		const { file, line, column } = this.location;
		const relativePath = path.relative(process.cwd(), file);

		// Try to read the code snippet
		let codeSnippet = '';
		try {
			const fileContent = fs.readFileSync(file, 'utf-8');
			const lines = fileContent.split('\n');

			// Check if code is minified (line is very long)
			const maxLineLength = 200; // Consider minified if line > 200 chars
			const isMinified = lines[line - 1] && lines[line - 1].length > maxLineLength;

			if (isMinified) {
				// For minified code, show a snippet around the error position
				const errorLine = lines[line - 1];
				const maxSnippetLength = 150; // Show max 150 chars
				const halfSnippet = Math.floor(maxSnippetLength / 2);

				let snippetStart = Math.max(0, column - halfSnippet);
				let snippetEnd = Math.min(errorLine.length, column + halfSnippet);

				// Adjust if we're at the start or end
				if (snippetStart === 0) {
					snippetEnd = Math.min(errorLine.length, maxSnippetLength);
				}
				if (snippetEnd === errorLine.length) {
					snippetStart = Math.max(0, errorLine.length - maxSnippetLength);
				}

				const snippet = errorLine.substring(snippetStart, snippetEnd);
				const prefix = snippetStart > 0 ? '...' : '';
				const suffix = snippetEnd < errorLine.length ? '...' : '';
				const adjustedColumn = column - snippetStart + prefix.length;

				codeSnippet = `\n\n${colors.DIM('  Code:')}\n`;
				codeSnippet += `${colors.RED(`     1 | ${prefix}${snippet}${suffix}`)}\n`;
				codeSnippet += `${' '.repeat(adjustedColumn + 8)}${colors.RED('^')}\n`;
			} else {
				// Regular code with normal line lengths
				const contextLines = 2; // Show 2 lines before and after
				const startLine = Math.max(0, line - contextLines - 1);
				const endLine = Math.min(lines.length, line + contextLines);

				codeSnippet = `\n\n${colors.DIM('  Code:')}\n`;

				for (let i = startLine; i < endLine; i++) {
					const lineNum = i + 1;
					const isErrorLine = lineNum === line;
					const lineNumStr = String(lineNum).padStart(4, ' ');

					if (isErrorLine) {
						codeSnippet += `${colors.RED(`  ${lineNumStr} | ${lines[i]}`)}\n`;
						// Add pointer to the exact column
						const pointer = `${' '.repeat(column + 8)}${colors.RED('^')}`;
						codeSnippet += `${pointer}\n`;
					} else {
						codeSnippet += `${colors.DIM(`  ${lineNumStr} | ${lines[i]}`)}\n`;
					}
				}
			}
		} catch {
			// If we can't read the file, just skip the code snippet
		}

		return `${message}\n\n  ${colors.DIM('at')} ${colors.CYAN(relativePath)}${colors.DIM(':')}${colors.YELLOW(line)}${colors.DIM(':')}${column}${codeSnippet}`;
	}
}

class Expect {
	constructor(name, value, negate = false, verbose = config.verbose) {
		this.name = name;
		this.value = value;
		this.negate = negate;
		this.verbose = verbose;
	}

	static expectation(expected) {
		if (expected === undefined) {
			return colors.CYAN("undefined");
		}

		if (expected instanceof RegExp) {
			return colors.CYAN(expected.toString());
		}
		if (Array.isArray(expected) || typeof expected === "object") {
			return colors.CYAN(JSON.stringify(expected));
		}

		return expected === "" ? colors.CYAN("<empty>") : colors.MAGENTA(expected);
	}

	#log(expected) {
		if (this.verbose === config.VERBOSE_TYPE_DETAILED) {
			const message = this.negate
				? `  ${colors.RED("✓")} ${this.name} ${colors.RED("not")} to ${expected}`
				: `  ${colors.GREEN("✓")} ${this.name} to ${expected}`;
			progress.addLog(message);
		}
	}

	#error(expected, showActual = true) {
		let message;
		if (this.negate) {
			message = `Expected ${this.name} not to ${expected}, but it is.`;
		} else {
			message = `Expected ${this.name} to ${expected}.`;
			// Add actual value information for better debugging
			if (showActual) {
				const actualValue = Expect.expectation(this.value);
				message += `\n    Actual: ${actualValue}`;
			}
		}
		throw new TestError(message);
	}

	get not() {
		return new Expect(this.name, this.value, true);
	}

	toBe(expected) {
		if (this.value !== expected && !this.negate) {
			throw new TestError(
				"Comparison failed: expected values to be strictly equal (===)\n\n" +
				`  Expected: ${Expect.expectation(expected)}\n` +
				`  Received: ${Expect.expectation(this.value)}`,
				this.value,
				expected
			);
		}
		this.#log(`be ${Expect.expectation(expected)}`);
		return this; // Return this for chaining
	}

	toEqual(expected) {
		const isEqual = JSON.stringify(this.value) === JSON.stringify(expected);
		if (!isEqual && !this.negate) {
			throw new TestError(
				"Deep equality check failed: objects or arrays are not equal\n\n" +
				`  Expected: ${Expect.expectation(expected)}\n` +
				`  Received: ${Expect.expectation(this.value)}`,
				this.value,
				expected
			);
		}
		this.#log(`equal ${Expect.expectation(expected)}`);
		return this; // Return this for chaining
	}

	toContain(expected) {
		if (!Array.isArray(this.value) && typeof this.value !== 'string') {
			throw new TestError(
				"Invalid type: 'toContain' requires an array or string\n\n" +
				`  Received type: ${typeof this.value}\n` +
				`  Received value: ${Expect.expectation(this.value)}`
			);
		}

		const contains = Array.isArray(this.value)
			? this.value.includes(expected)
			: this.value.includes(expected);

		if (!contains && !this.negate) {
			const type = Array.isArray(this.value) ? 'array' : 'string';
			throw new TestError(
				`Element not found: expected ${type} to contain the specified value\n\n` +
				`  Expected to contain: ${Expect.expectation(expected)}\n` +
				`  Received ${type}: ${Expect.expectation(this.value)}`,
				this.value,
				expected
			);
		}
		this.#log(`contain ${Expect.expectation(expected)}`);
		return this; // Return this for chaining
	}

	toBeIn(expected) {
		if (!Array.isArray(expected)) {
			throw new TestError(
				"Invalid argument: 'toBeIn' requires an array",
			);
		}
		if (!expected.includes(this.value) && !this.negate) {
			throw new TestError(
				"Value not found: expected value to be in the provided array\n\n" +
				`  Expected value: ${Expect.expectation(this.value)}\n` +
				`  To be in array: ${JSON.stringify(expected)}`,
				this.value,
				expected
			);
		}
		this.#log(`be in ${Expect.expectation(expected)}`);
		return this; // Return this for chaining
	}

	toBeTruthy() {
		if (!this.value && !this.negate) {
			throw new TestError(
				"Truthiness check failed: expected value to be truthy\n\n" +
				`  Received: ${Expect.expectation(this.value)}\n\n` +
				"  Truthy values: true, non-zero numbers, non-empty strings, objects, arrays\n" +
				"  Falsy values: false, 0, '', null, undefined, NaN",
				this.value,
				"truthy value"
			);
		}
		this.#log(`be ${colors.CYAN("truthy")}`);
		return this; // Return this for chaining
	}

	toBeFalsy() {
		if (this.value && !this.negate) {
			throw new TestError(
				"Falsiness check failed: expected value to be falsy\n\n" +
				`  Received: ${Expect.expectation(this.value)}\n\n` +
				"  Falsy values: false, 0, '', null, undefined, NaN\n" +
				"  Truthy values: true, non-zero numbers, non-empty strings, objects, arrays",
				this.value,
				"falsy value"
			);
		}
		this.#log(`be ${colors.CYAN("falsy")}`);
		return this; // Return this for chaining
	}

	toBeDefined() {
		if (this.value === undefined && !this.negate) {
			throw new TestError(
				"Definition check failed: expected value to be defined\n\n" +
				`  Received: ${Expect.expectation(this.value)}`,
				this.value,
				"defined value"
			);
		}
		this.#log(`be ${colors.CYAN("defined")}`);
		return this; // Return this for chaining
	}

	toBeNull() {
		if (this.value !== null && !this.negate) {
			throw new TestError(
				"Null check failed: expected value to be null\n\n" +
				`  Expected: ${colors.CYAN("null")}\n` +
				`  Received: ${Expect.expectation(this.value)}`,
				this.value,
				null
			);
		}
		this.#log(`be ${colors.CYAN("null")}`);
		return this; // Return this for chaining
	}

	toBeGreaterThan(expected) {
		if (this.value <= expected && !this.negate) {
			throw new TestError(
				"Comparison failed: expected value to be greater than the threshold\n\n" +
				`  Expected: > ${Expect.expectation(expected)}\n` +
				`  Received: ${Expect.expectation(this.value)}`,
				this.value,
				expected
			);
		}
		this.#log(`be greater than ${Expect.expectation(expected)}`);
		return this; // Return this for chaining
	}

	toBeLessThan(expected) {
		if (this.value >= expected && !this.negate) {
			throw new TestError(
				"Comparison failed: expected value to be less than the threshold\n\n" +
				`  Expected: < ${Expect.expectation(expected)}\n` +
				`  Received: ${Expect.expectation(this.value)}`,
				this.value,
				expected
			);
		}
		this.#log(`be less than ${Expect.expectation(expected)}`);
		return this; // Return this for chaining
	}

	toBeInstanceOf(expectedClass) {
		if (!(this.value instanceof expectedClass) && !this.negate) {
			throw new TestError(
				"Instance check failed: value is not an instance of the expected class\n\n" +
				`  Expected instance of: ${expectedClass.name}\n` +
				`  Received type: ${this.value?.constructor?.name || typeof this.value}\n` +
				`  Received value: ${Expect.expectation(this.value)}`,
				this.value,
				expectedClass.name
			);
		}
		this.#log(`be an instance of ${Expect.expectation(expectedClass.name)}`);
		return this; // Return this for chaining
	}

	toBeArray() {
		if (!Array.isArray(this.value) && !this.negate) {
			throw new TestError(
				"Type check failed: expected value to be an array\n\n" +
				'  Expected type: Array\n' +
				`  Received type: ${typeof this.value}\n` +
				`  Received value: ${Expect.expectation(this.value)}`,
				this.value,
				"Array"
			);
		}
		this.#log(`be an ${colors.CYAN("[array]")}`);
		return this; // Return this for chaining
	}

	toBeObject() {
		if (
			(typeof this.value !== "object" ||
				this.value === null ||
				Array.isArray(this.value)) &&
			!this.negate
		) {
			throw new TestError(
				"Type check failed: expected value to be an object\n\n" +
				'  Expected type: Object\n' +
				`  Received type: ${Array.isArray(this.value) ? 'Array' : typeof this.value}\n` +
				`  Received value: ${Expect.expectation(this.value)}`,
				this.value,
				"Object"
			);
		}
		this.#log(`be an ${colors.CYAN("{object}")}`);
		return this; // Return this for chaining
	}

	toBeString() {
		if (typeof this.value !== "string" && !this.negate) {
			throw new TestError(
				"Type check failed: expected value to be a string\n\n" +
				'  Expected type: string\n' +
				`  Received type: ${typeof this.value}\n` +
				`  Received value: ${Expect.expectation(this.value)}`,
				this.value,
				"string"
			);
		}
		this.#log(`be a ${colors.CYAN("string")}`);
		return this; // Return this for chaining
	}

	toBeNumber() {
		if (
			(typeof this.value !== "number" || Number.isNaN(this.value)) &&
			!this.negate
		) {
			throw new TestError(
				"Type check failed: expected value to be a number\n\n" +
				'  Expected type: number\n' +
				`  Received type: ${typeof this.value}\n` +
				`  Received value: ${Expect.expectation(this.value)}`,
				this.value,
				"number"
			);
		}
		this.#log(`be a ${colors.CYAN("number")}`);
		return this; // Return this for chaining
	}

	toBeBoolean() {
		if (typeof this.value !== "boolean" && !this.negate) {
			throw new TestError(
				"Type check failed: expected value to be a boolean\n\n" +
				'  Expected type: boolean\n' +
				`  Received type: ${typeof this.value}\n` +
				`  Received value: ${Expect.expectation(this.value)}`,
				this.value,
				"boolean"
			);
		}
		this.#log(`be a ${colors.CYAN("boolean")}`);
		return this; // Return this for chaining
	}

	toHave(that) {
		if (
			!this.value ||
			(this.value === undefined &&
				this.value === null &&
				!Array.isArray(this.value) &&
				typeof this.value !== "object")
		) {
			throw new TestError(
				`Expected ${this.name} to be an array or object for 'toHave' assertion, but got ${typeof this.value}.`,
			);
		}

		let errorMessage = () => "";
		let logMessage = () => "";

		if (Array.isArray(this.value)) {
			errorMessage = (expected) => `have element ${expected}`;
			logMessage = (expected) => `have element ${Expect.expectation(expected)}`;
		} else {
			errorMessage = (expected) => `have property ${expected}`;
			logMessage = (expected) =>
				`have property ${Expect.expectation(expected)}`;
		}

		if (!Array.isArray(that)) {
			let hasThat = false;

			if (Array.isArray(this.value)) {
				hasThat = this.value.includes(that);
			} else {
				hasThat = that in this.value;
			}

			if (!hasThat && !this.negate) {
				throw new TestError(
					`Expected ${this.name} to ${errorMessage(that)}.\n    Actual: ${Expect.expectation(this.value)}`
				);
			}

			this.#log(logMessage(that));
			return;
		}

		for (const i of that) {
			let hasIt = false;

			if (Array.isArray(this.value)) {
				hasIt = this.value.includes(i);
			} else {
				hasIt = i in this.value;
			}

			if (!hasIt && !this.negate) {
				throw new TestError(
					`Expected ${this.name} to ${errorMessage(i)}.\n    Actual: ${Expect.expectation(this.value)}`
				);
			}
		}

		this.#log(logMessage(that));
		return this; // Return this for chaining
	}

	toMatch(regex) {
		if (!(regex instanceof RegExp)) {
			throw new TestError("Expected a RegExp for 'toMatch' assertion.");
		}
		if (!regex.test(this.value) && !this.negate) {
			throw new TestError(
				`Expected ${this.name} to match ${regex}.\n    Actual: ${Expect.expectation(this.value)}`
			);
		}
		this.#log(`match ${Expect.expectation(regex)}`);
		return this; // Return this for chaining
	}

	toBeEmpty() {
		if (
			((Array.isArray(this.value) && this.value.length > 0) ||
				(typeof this.value === "object" &&
					Object.keys(this.value).length > 0) ||
				this.value !== "") &&
			!this.negate
		) {
			throw new TestError(
				`Expected ${this.name} to be empty.\n    Actual: ${Expect.expectation(this.value)}`
			);
		}
		this.#log(`be ${colors.CYAN("empty")}`);
		return this; // Return this for chaining
	}
}

/**
 * Create an expectation object.
 * @param  {[name: string, value: any, verbose: boolean]} args
 */
export default function expect(...args) {
	const [name, value, verbose] = args;
	if (args.length < 2) {
		throw new TestError(
			"Expect function requires at least two arguments: name and value.",
		);
	}
	return new Expect(name, value, false, verbose);
}
