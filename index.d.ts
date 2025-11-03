/// <reference types="puppeteer" />

// Puppeteer type references for better autocomplete
// Note: These types are available when puppeteer is installed as a dev dependency

interface IExpectation {
  toBe: (expected: any) => IExpectation;
  toBeIn: (expected: any[]) => IExpectation;
  toBeTruthy: () => IExpectation;
  toBeFalsy: () => IExpectation;
  toBeDefined: () => IExpectation;
  toBeNull: () => IExpectation;
  toBeGreaterThan: (expected: number) => IExpectation;
  toBeLessThan: (expected: number) => IExpectation;
  toBeInstanceOf: (className: Function) => IExpectation;
  toBeArray: () => IExpectation;
  toBeObject: () => IExpectation;
  toBeString: () => IExpectation;
  toBeNumber: () => IExpectation;
  toBeBoolean: () => IExpectation;
  toHave: (property: string) => IExpectation;
  toMatch: (regex: RegExp) => IExpectation;
  toBeEmpty: () => IExpectation;
  not: Omit<IExpectation, 'not'>;
}

// add state property to the test function
interface TestFunction {
  state: Record<string, any>;
  (
    title: string,
    fn: (expect: (name: string, value: any) => IExpectation) => Promise<void>,
  ): void;
}

// Electron/Puppeteer testing support
interface QueryElement {
  readonly innerText: Promise<string>;
  readonly innerHTML: Promise<string>;
  readonly id: Promise<string>;
  readonly className: Promise<string>;
  readonly classList: Promise<string[]>;
  getAttribute(name: string): Promise<string | null>;
  click(): Promise<void>;
  contextMenu(): Promise<void>;
  type(text: string, options?: { delay?: number }): Promise<void>;
  readonly element: import('puppeteer').ElementHandle; // Puppeteer ElementHandle with full autocomplete
  readonly puppeteer: import('puppeteer').Page; // Puppeteer Page instance with full autocomplete
}

// Puppeteer launch options for better autocomplete
interface PuppeteerLaunchOptions {
  /** Path to a browser executable to use instead of the bundled Chromium */
  executablePath?: string;
  /** Whether to run browser in headless mode (default: true) */
  headless?: boolean | 'new';
  /** Slows down Puppeteer operations by the specified amount of milliseconds */
  slowMo?: number;
  /** Additional arguments to pass to the browser instance */
  args?: string[];
  /** Whether to ignore HTTPS errors (default: false) */
  ignoreHTTPSErrors?: boolean;
  /** Sets a consistent viewport for each page. Defaults to an 800x600 viewport. null disables the default viewport */
  defaultViewport?: { width: number; height: number } | null;
  /** Maximum time in milliseconds to wait for the browser to start */
  timeout?: number;
  /** Whether to pipe the browser process stdout and stderr (default: false) */
  dumpio?: boolean;
  /** Path to a user data directory */
  userDataDir?: string;
  /** Specify environment variables that will be visible to the browser (default: process.env) */
  env?: Record<string, string | undefined>;
  /** Whether to auto-open a DevTools panel for each tab (default: false) */
  devtools?: boolean;
  /** Close the browser process on SIGINT/SIGTERM signals (default: true) */
  handleSIGINT?: boolean;
  handleSIGTERM?: boolean;
  handleSIGHUP?: boolean;
  /** Additional browser-specific options */
  [key: string]: any;
}

interface SetupOptions {
  /** Path to the Electron app executable (optional - auto-detects if electron package is installed) */
  appPath?: string;
  /** URL to navigate to for web app testing (if provided, launches a regular browser instead of Electron) */
  url?: string;
  /** Additional Puppeteer launch options */
  puppeteerOptions?: PuppeteerLaunchOptions;
}

interface Setup {
  browser: import('puppeteer').Browser; // Puppeteer Browser with full autocomplete
  page: import('puppeteer').Page; // Puppeteer Page with full autocomplete
}

declare const test: TestFunction;
declare const expect: (
  name: string,
  value: any,
  verbose?: boolean,
) => IExpectation;
declare const query: (selector: string) => Promise<QueryElement>;
declare const queryAll: (selector: string) => Promise<QueryElement[]>;
declare const click: (selector: string) => Promise<void>;
declare const type: (
  selector: string,
  text: string,
  options?: { delay?: number },
) => Promise<void>;
declare const clear: (selector: string) => Promise<void>;
declare const setup: (options?: SetupOptions) => Promise<Setup>;
declare const waitFor: (
  selector: string,
  options?: { timeout?: number; visible?: boolean; hidden?: boolean },
) => Promise<import('puppeteer').ElementHandle>; // Returns Puppeteer ElementHandle with full autocomplete
declare const keyPress: (
  keys: string,
  page?: import('puppeteer').Page,
) => Promise<void>;
declare const abort: (message?: string) => void;
