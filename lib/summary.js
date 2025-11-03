import colors from "./colors.js";
import config from "./config.js";
import progress from "./progress.js";
import { cleanup } from "./web-app.js";

const startTime = performance.now();

/**
 * Summarizes the test results.
 * @param {import('./loader').default} loader - The loader instance to manage the loading state.
 */
export default async function summary(loader) {
	let isFirst = true;
	for (const file in progress.tests) {
		if (!isFirst) {
			if (
				config.verbose !== config.VERBOSE_TYPE_DETAILED &&
				config.verbose !== config.VERBOSE_TYPE_SUMMARY
			) {
				progress.addLog("", "log", true);
			}
		} else {
			isFirst = false;
		}

		loader.update(`Running tests in ${colors.CYAN(file)}`);
		const fileStartTime = performance.now();
		const title = `${colors.CYAN(file)}:`;
		const index = progress.addLog(
			title,
			"log",
			config.verbose !== config.VERBOSE_TYPE_SUMMARY,
		);
		for (const test of progress.tests[file]) {
			// Check if tests were aborted
			if (progress.aborted) {
				break;
			}
			await test();
			const haveFailedTests = progress.fails[file] && progress.fails[file] > 0;
			const totalTime = performance.now() - fileStartTime;
			progress.setLog(
				index,
				`${haveFailedTests ? colors.RED("✗") : colors.GREEN("✓")} ${colors.CYAN(file)} ${colors.MAGENTA(`(${convertTime(totalTime)})`)} ${config.verbose === config.VERBOSE_TYPE_SUMMARY ? "" : ":"}`,
				haveFailedTests ? "error" : "log",
			);
		}

		// Check if tests were aborted (check after inner loop too)
		if (progress.aborted) {
			break;
		}
	}

	loader.clear();

	for (let [type, message, title] of progress.getLogs()) {
		if (!title && config.verbose !== config.VERBOSE_TYPE_SUMMARY) {
			message = `  ${message}`;
		}
		if (type === "log") {
			console.log(message);
		} else if (type === "error") {
			console.error(message);
		}
	}

	if (progress.failed > 0) {
		console.log(
			`\n${colors.WHITE(">")} ${colors.RED(`${progress.failed} out of ${progress.count} tests failed!`)}`,
		);
	} else if (progress.aborted) {
		console.log(
			`\n${colors.WHITE(">")} ${colors.YELLOW(`Tests aborted: ${progress.abortMessage || 'Test execution was stopped'}`)}`,
		);
	} else {
		console.log(
			`\n${colors.WHITE(">")} ${colors.GREEN(`All ${progress.count} tests passed!`)}`,
		);
	}

	if (progress.skipped > 0) {
		console.log(
			`${colors.WHITE(">")} ${colors.MAGENTA(`${progress.skipped} tests were skipped.`)}`,
		);
	}

	const endTime = performance.now();
	const duration = (endTime - startTime).toFixed(2);
	console.log(
		`${colors.WHITE(">")} ${colors.GREEN("Test suite completed in")} ${colors.BLUE(convertTime(duration))}.\n`,
	);

	// Cleanup Electron instances
	await cleanup();

	if (progress.aborted) {
		process.exit(2); // Exit code 2 for aborted tests
	} else if (progress.failed > 0) {
		process.exit(1);
	} else {
		process.exit(0);
	}
}

function convertTime(ms) {
	ms = Number(ms);
	if (ms > 60_000) {
		return `${(ms / 60_000).toFixed(2)} m`;
	}
	if (ms > 1000) {
		return `${(ms / 1000).toFixed(2)} s`;
	}
	return `${ms.toFixed(2)} ms`;
}
