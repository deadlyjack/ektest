import colors from "./colors.js";
import config from "./config.js";
import progress from "./progress.js";

class TestError extends Error {
	constructor(message) {
		super(message);
		this.name = "TestError";
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

	#error(expected) {
		throw new TestError(
			this.negate
				? `Expected ${this.name} not to ${expected}, but it is.`
				: `Expected ${this.name} to ${expected}.`,
		);
	}

	get not() {
		return new Expect(this.name, this.value, true);
	}

	toBe(expected) {
		if (this.value !== expected && !this.negate) {
			this.#error(`be ${expected}`);
		}
		this.#log(`be ${Expect.expectation(expected)}`);
		return this; // Return this for chaining
	}

	toBeIn(expected) {
		if (!Array.isArray(expected)) {
			throw new TestError(
				"Expected value to be an array for 'toBeIn' assertion.",
			);
		}
		if (!expected.includes(this.value) && !this.negate) {
			this.#error(`be in ${JSON.stringify(expected)}`);
		}
		this.#log(`be in ${Expect.expectation(expected)}`);
		return this; // Return this for chaining
	}

	toBeTruthy() {
		if (!this.value && !this.negate) {
			this.#error("be truthy");
		}
		this.#log(`be ${colors.CYAN("truthy")}`);
		return this; // Return this for chaining
	}

	toBeFalsy() {
		if (this.value && !this.negate) {
			this.#error("be falsy");
		}
		this.#log(`be ${colors.CYAN("falsy")}`);
		return this; // Return this for chaining
	}

	toBeDefined() {
		if (this.value === undefined && !this.negate) {
			this.#error("be defined");
		}
		this.#log(`be ${colors.CYAN("defined")}`);
		return this; // Return this for chaining
	}

	toBeNull() {
		if (this.value !== null && !this.negate) {
			this.#error("be null");
		}
		this.#log(`be ${colors.CYAN("null")}`);
		return this; // Return this for chaining
	}

	toBeGreaterThan(expected) {
		if (this.value <= expected && !this.negate) {
			this.#error(`be greater than ${expected}`);
		}
		this.#log(`be greater than ${Expect.expectation(expected)}`);
		return this; // Return this for chaining
	}

	toBeLessThan(expected) {
		if (this.value >= expected && !this.negate) {
			this.#error(`be less than ${expected}`);
		}
		this.#log(`be less than ${Expect.expectation(expected)}`);
		return this; // Return this for chaining
	}

	toBeInstanceOf(expectedClass) {
		if (!(this.value instanceof expectedClass) && !this.negate) {
			this.#error(`be an instance of ${expectedClass.name}`);
		}
		this.#log(`be an instance of ${Expect.expectation(expectedClass.name)}`);
		return this; // Return this for chaining
	}

	toBeArray() {
		if (!Array.isArray(this.value) && !this.negate) {
			this.#error("be an [array]");
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
			this.#error("be an {object}");
		}
		this.#log(`be an ${colors.CYAN("{object}")}`);
		return this; // Return this for chaining
	}

	toBeString() {
		if (typeof this.value !== "string" && !this.negate) {
			this.#error('be a "string"');
		}
		this.#log(`be a ${colors.CYAN("string")}`);
		return this; // Return this for chaining
	}

	toBeNumber() {
		if (
			(typeof this.value !== "number" || Number.isNaN(this.value)) &&
			!this.negate
		) {
			this.#error('be a number');
		}
		this.#log(`be a ${colors.CYAN("number")}`);
		return this; // Return this for chaining
	}

	toBeBoolean() {
		if (typeof this.value !== "boolean" && !this.negate) {
			this.#error("be a boolean");
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
				this.#error(errorMessage(that));
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
				this.#error(errorMessage(i));
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
			this.#error(`match ${regex}`);
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
			this.#error("be empty");
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
