import colors from "./colors.js";
import config from "./config.js";
import progress from "./progress.js";

/**
 * Runs a test with the given title and function.
 * @param {string} title
 * @param {() => void | Promise<void>} fn
 */
export default function test(title, fn) {
	const file = config.file || "default";

	if (!progress.tests[file]) {
		progress.tests[file] = [];
	}

	progress.tests[file].push(async () => {
		progress.count++;
		const index =
			config.verbose !== config.VERBOSE_TYPE_SUMMARY
				? progress.addLog(`${colors.YELLOW("=>")} Testing ${title}`)
				: -1;
		try {
			const executionStartTime = performance.now();
			await fn();

			if (config.verbose !== config.VERBOSE_TYPE_SUMMARY) {
				const endTime = performance.now();
				progress.setLog(
					index,
					`${colors.GREEN("✓")} ${title} ${colors.BLUE(`(${(endTime - executionStartTime).toFixed(2)} ms)`)}`,
				);
			}
		} catch (error) {
			if (!(file in progress.fails)) {
				progress.fails[file] = 0;
			}
			++progress.failed;
			++progress.fails[file];
			progress.setLog(
				index,
				`${colors.RED("✗")} ${colors.RED(title)}\n    ${colors.RED(`✗ ${error.message}`)}`,
				"error",
			);
		}
		if (config.verbose === config.VERBOSE_TYPE_DETAILED) {
			progress.addLog("");
		}
	});
}

test.state = new Proxy(
	{},
	{
		get(target, prop) {
			return target[prop];
		},
		set(target, prop, value) {
			target[prop] = value;
			return true;
		},
	},
);

test.skip = (message) => {
	progress.skipped++;
	progress.addLog(
		`${colors.YELLOW("⏭ Skipped:")} ${colors.MAGENTA(message)}`,
		"log",
	);
};
