import { rest } from "msw";

const initMocks = async () => {
  if (typeof window === "undefined") {
    const { server } = await import("./server");
    server.listen();
  } else {
    const { worker } = await import("./browser");
    worker.start();

    window.msw = { worker, rest };
  }
};

initMocks();

export {};
