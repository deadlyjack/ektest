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
  (title: string, fn: (expect: (name: string, value: any) => IExpectation) => Promise<void>): void;
}

declare const test: TestFunction;
declare const expect: (name: string, value: any, verbose?: boolean) => IExpectation;