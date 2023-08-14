import type { NextApiRequest, NextApiResponse } from "next/types";
import { apiBaseUrl } from "app/common/const";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { slug } = req.query;
  const path = Array.isArray(slug) ? slug.join("/") : slug;
  const url = `${apiBaseUrl}/v1/${path}`;
  // TODO do some safety checks here
  // TODO we should modify headers here instead of in the client call (api.ts)
  // setting the authorization
  res.redirect(url);
}

export const config = {
  api: {
    bodyParser: false,
  },
};
