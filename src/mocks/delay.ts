export async function mockDelay(ms?: number): Promise<void> {
  const wait = ms ?? 200 + Math.floor(Math.random() * 200);
  await new Promise((resolve) => setTimeout(resolve, wait));
}
