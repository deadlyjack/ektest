/** @type {Array<[type: 'log'|'error', message: string, title: boolean]>} */
const logs = [];
/** @type {Record<string, Array<Promise<void>>} */
const tests = {};
const fails = {};

let count = 0;
let failed = 0;
let skipped = 0;

export default {
	/**
	 * Adds a log entry to the logs array.
	 * @param {('log'|'error')} type - The type of the log entry.
	 * @param {string} message - The log message.
	 * @param {boolean} title - Whether the log entry is a title.
	 * @returns {number} - The index of the newly added log entry.
	 */
	addLog(message, type = "log", title = false) {
		const index = logs.length;
		logs.push([type, message, title]);

		if (title) {
			logs.push(["log", Array(message.length).join("-"), true]);
		}

		return index; // Return the index of the newly added log
	},
	/**
	 * Adds a log entry with a 'log' type.
	 * @param {string} message - The log message.
	 * @param {boolean} title - Whether the log entry is a title.
	 * @returns {number} - The index of the newly added log entry.
	 */
	setLog(index, message, type = "log") {
		if (index >= 0 && index < logs.length) {
			const log = logs[index];
			log[0] = type;
			log[1] = message;

			if (log[2] === true) {
				logs[index + 1] = ["log", Array(message.length).join("-"), true];
			}
		} else {
			throw new Error(`Index ${index} is out of bounds for logs array.`);
		}
	},
	getLogs() {
		return logs;
	},
	clearLogs() {
		logs.length = 0;
	},
	get count() {
		return count;
	},
	set count(value) {
		count = value;
	},
	get failed() {
		return failed;
	},
	set failed(value) {
		failed = value;
	},
	get tests() {
		return tests;
	},
	get fails() {
		return fails;
	},
	get skipped() {
		return skipped;
	},
	set skipped(value) {
		skipped = value;
	},
};
