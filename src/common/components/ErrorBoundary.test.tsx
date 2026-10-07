import { ErrorBoundary } from "./ErrorBoundary";

describe("ErrorBoundary", () => {
  it("should derive state from error correctly", () => {
    const error = new Error("Test crash");
    const state = ErrorBoundary.getDerivedStateFromError(error);

    expect(state.hasError).toBe(true);
    expect(state.error).toBe(error);
  });

  it("should call setState with initial error state when resetError is called", () => {
    const boundary = new ErrorBoundary({ children: null });
    const setStateSpy = jest.spyOn(boundary, "setState");

    boundary.resetError();

    expect(setStateSpy).toHaveBeenCalledWith({
      hasError: false,
      error: null,
    });
  });

  it("should call onError prop when componentDidCatch is invoked", () => {
    const onErrorMock = jest.fn();
    const boundary = new ErrorBoundary({
      children: null,
      onError: onErrorMock,
    });

    const error = new Error("Crash");
    const errorInfo = { componentStack: "stack trace" };

    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    boundary.componentDidCatch(error, errorInfo);

    expect(onErrorMock).toHaveBeenCalledWith(error, errorInfo);

    consoleSpy.mockRestore();
  });
});
