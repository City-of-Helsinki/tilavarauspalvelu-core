import type { NextApiRequest, NextApiResponse } from "next";
import { apiBaseUrl } from "app/common/const";

/// Mask graphql endpoint for the client so we can drop cookies
/// otherwise the large request size causes a 502
/// TODO we can move authentication here using server getSession
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST" && req.method !== "OPTIONS") {
    return res.status(405).send("Only POST is allowed");
  }

  const auth = req.headers.authorization;
  if (auth == null) {
    return res.status(401).send("No authorization token");
  }

  const uri = `${apiBaseUrl}/graphql/`;
  const response = await fetch(uri, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: auth,
    },
    body: JSON.stringify(req.body),
  });

  return res.status(response.status).json(await response.json());
}
