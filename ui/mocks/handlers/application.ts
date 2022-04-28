import { rest } from "msw";

const applications = rest.get(
  "http://localhost:8000/v1/application",
  (req, res, ctx) => {
    return res(
      ctx.json([
        {
          id: 1,
        },
      ])
    );
  }
);

export const applicationHandlers = [applications];
