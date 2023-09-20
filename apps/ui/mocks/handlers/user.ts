import { graphql } from "msw";
import { UserType } from "common/types/gql-types";

const currentUser = graphql.query("getCurrentUser", (_req, res, ctx) => {
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

export const userHandlers = [currentUser];
