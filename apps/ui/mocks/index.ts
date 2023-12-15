import { rest } from "msw";

const initMocks = async () => {
  if (typeof window === "undefined") {
    // NOTE fix localhost not resolving to 127.0.0.1
    const dns = await import("node:dns");
    dns.setDefaultResultOrder("ipv4first");
    const { server } = await import("./server");
    server.listen({ onUnhandledRequest: "bypass" });
  } else {
    const { worker } = await import("./browser");
    worker.start();

    window.msw = { worker, rest };
  }
  return Promise.resolve();
};

export { initMocks };
