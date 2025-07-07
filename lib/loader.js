export default class AsciiLoader {
	constructor(message = "Loading", type = "spinner") {
		this.message = message;
		this.type = type;
		this.interval = null;
		this.frame = 0;

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
		process.stdout.write(`\r${" ".repeat(this.message.length + 100)}\r`); // Clear the line
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
			process.stdout.write(`\r${" ".repeat(this.message.length + 100)}\r`); // Clear the line
		}
	}
}
