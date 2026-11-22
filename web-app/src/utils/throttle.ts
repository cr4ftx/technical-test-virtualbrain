export function throttle<Args extends unknown[]>(
  func: (...args: Args) => void,
  delay = 100
): (...args: Args) => void {
  let lastCall = 0;
  return (...args: Args) => {
    const now = Date.now();
    if (now - lastCall < delay) return;
    lastCall = now;
    func(...args);
  };
}
