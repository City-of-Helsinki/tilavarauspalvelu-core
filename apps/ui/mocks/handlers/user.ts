import { graphql } from "msw";
import { UserType } from "common/types/gql-types";

const currentUser = graphql.query("getCurrentUser", (req, res, ctx) => {
  const user: UserType = {
    id: "faopwefkope",
    pk: 12,
    firstName: "John",
    lastName: "Doe",
    username: "johndoe",
    email: "john@doe.it",
    isSuperuser: false,
    unitRoles: [],
    uuid: "12345",
  };
  return res(ctx.data({ currentUser: user }));
});

const currentUserGlobal = graphql.query(
  "getCurrentUserGlobal",
  (req, res, ctx) => {
    const user: UserType = {
      id: "faopwefkope",
      pk: 42,
      firstName: "John",
      lastName: "Doe",
      username: "johndoe",
      email: "john@doe.it",
      isSuperuser: false,
      unitRoles: [],
      uuid: "12345",
    };

    // return global user for view in which reservation notification is wanted
    const headers = req.headers.all();
    const xReferrer = headers["x-referrer"];
    const shouldReturnUser = xReferrer?.endsWith("/search/single");
    const data = shouldReturnUser ? { currentUser: user } : null;
    return res(ctx.data(data));
  }
);

export const userHandlers = [currentUser, currentUserGlobal];
