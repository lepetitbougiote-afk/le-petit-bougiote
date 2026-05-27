export async function simulateAsync<T>(value: T, delay = 120): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), delay);
  });
}
