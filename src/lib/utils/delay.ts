export const delay = (ms?: number) => {
  const targetMs = ms !== undefined ? ms : Math.random() * 400 + 400; // 400ms~800ms
  return new Promise((resolve) => setTimeout(resolve, targetMs));
};
