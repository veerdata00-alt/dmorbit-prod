let lastError: Error | undefined;

export function consumeLastCapturedError() {
  const err = lastError;
  lastError = undefined;
  return err;
}

export function captureError(error: Error) {
  lastError = error;
}
