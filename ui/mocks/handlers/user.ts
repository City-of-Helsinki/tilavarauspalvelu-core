import { rest } from "msw";
import { User } from "common/types/common";

const currentUser = rest.get(
  "http://localhost:8000/v1/users/current/",
  (req, res, ctx) => {
    const user: User = {
      id: 1,
      firstName: "John",
      lastName: "Doe",
    };
    return res(ctx.json(user));
  }
);

export const userHandlers = [currentUser];
