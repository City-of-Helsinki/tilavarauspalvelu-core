import { NextApiRequest, NextApiResponse } from "next";
import { apiBaseUrl } from "app/common/const";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  // Remove large cookies on backend request
  res.setHeader("Set-Cookie", [
    "__Secure-next-auth.session-token.0; Max-Age=0; path=/",
    "__Secure-next-auth.session-token.1; Max-Age=0; path=/",
    "cookiehub; Max-Age=0; path=/",
  ]);

  return res.redirect(`${apiBaseUrl}/graphql/`);
};
