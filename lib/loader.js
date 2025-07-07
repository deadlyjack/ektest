export default class AsciiLoader {
	maxLength = 0;

	constructor(message = "Loading", type = "spinner") {
		this.message = message;
		this.type = type;
		this.interval = null;
		this.frame = 0;
		// Calculate initial max length including spinner, space, message, and "..."
		const fullDisplayLength = 1 + 1 + message.length + 3; // spinner + space + message + "..."
		this.maxLength = Math.max(fullDisplayLength, 15); // Ensure at least 15 characters total

		this.animations = {
			spinner: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],
			dots: ["⠁", "⠂", "⠄", "⡀", "⢀", "⠠", "⠐", "⠈"],
			arrow: ["←", "↖", "↑", "↗", "→", "↘", "↓", "↙"],
			bounce: ["⠁", "⠂", "⠄", "⠂"],
		};
	}

	start() {
		const frames = this.animations[this.type];
		this.interval = setInterval(() => {
			process.stdout.write(`\r${frames[this.frame]} ${this.message}...`);
			this.frame = (this.frame + 1) % frames.length;
		}, 100);
	}

	stop(completedMessage = "Done!") {
		if (this.interval) {
			this.clear();
			process.stdout.write(`\r✓ ${completedMessage}   \n`);
		}
	}

	update(message) {
		// Calculate the full display length including spinner, message, and "..."
		const fullDisplayLength = 1 + 1 + this.message.length + 3; // spinner + space + message + "..."
		if (fullDisplayLength > this.maxLength) {
			this.maxLength = fullDisplayLength;
		}
		process.stdout.write(`\r${" ".repeat(this.maxLength)}\r`); // Clear the line
		this.message = message;
		if (this.interval) {
			const frames = this.animations[this.type];
			process.stdout.write(`\r${frames[this.frame]} ${this.message}...`);
		}
	}

	clear() {
		if (this.interval) {
			clearInterval(this.interval);
			this.interval = null;
			this.frame = 0;
			// Calculate the full display length including spinner, message, and "..."
			const fullDisplayLength = 1 + 1 + this.message.length + 3; // spinner + space + message + "..."
			const clearLength = Math.max(this.maxLength, fullDisplayLength);
			process.stdout.write(`\r${" ".repeat(clearLength)}\r`); // Clear the line
		}
	}
}
