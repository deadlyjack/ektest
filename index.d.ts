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
  click(): Promise<void>;
  contextMenu(): Promise<void>;
  type(text: string, options?: { delay?: number }): Promise<void>;
  readonly element: any; // Puppeteer ElementHandle
  readonly puppeteer: any; // Puppeteer Page instance
}

interface SetupOptions {
  appPath?: string; // Optional - for Electron apps, auto-detects if electron package is installed
  url?: string; // Optional - URL to navigate to for web app testing
  puppeteerOptions?: any;
}

interface Setup {
  browser: any;
  page: any;
}

declare const test: TestFunction;
declare const expect: (
  name: string,
  value: any,
  verbose?: boolean,
) => IExpectation;
declare const query: (selector: string) => Promise<QueryElement>;
declare const setup: (options: SetupOptions) => Promise<Setup>;
declare const waitFor: (
  selector: string,
  options?: { timeout?: number; visible?: boolean; hidden?: boolean },
) => Promise<any>;
declare const keyPress: (keys: string, page?: any) => Promise<void>;
