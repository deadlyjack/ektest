export default {
	RED(text) {
		return `\x1b[31m${text}\x1b[0m`;
	},
	GREEN(text) {
		return `\x1b[32m${text}\x1b[0m`;
	},
	YELLOW(text) {
		return `\x1b[33m${text}\x1b[0m`;
	},
	BLUE(text) {
		return `\x1b[34m${text}\x1b[0m`;
	},
	MAGENTA(text) {
		return `\x1b[35m${text}\x1b[0m`;
	},
	CYAN(text) {
		return `\x1b[36m${text}\x1b[0m`;
	},
	WHITE(text) {
		return `\x1b[37m${text}\x1b[0m`;
	},
};
