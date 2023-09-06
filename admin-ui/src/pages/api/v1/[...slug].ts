import type { NextApiRequest, NextApiResponse } from "next/types";
import { getServerSession } from "next-auth/next";
import { apiBaseUrl } from "app/common/const";
// eslint-disable-next-line import/extensions
import { authOptions } from "app/pages/api/auth/[...nextauth]";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { slug, params } = req.query;
  const path = Array.isArray(slug) ? slug.join("/") : slug;
  const url = `${apiBaseUrl}/v1/${path}`;
  const session = await getServerSession(req, res, authOptions);
  // TODO do some safety checks here
  const { method } = req;
  const reqUrl = `${url}?${params ?? ""}`;
  // TODO if no session should fail ?
  try {
    const result = await fetch(reqUrl, {
      method,
      body: req.body,
      headers: {
        ...(session?.apiTokens?.tilavaraus != null
          ? {
              Authorization: `Bearer ${session.apiTokens.tilavaraus}`,
            }
          : {}),
      },
    })
      .then((x) => (x.ok ? x : Promise.reject(x)))
      .then((x) => x.json())
      .catch((err) => {
        return Promise.reject(err);
      });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json(err);
  }
}

export const config = {
  api: {
    bodyParser: false,
    // We use api routes to rewrite backend calls without headers and cookies
    // it's more important to rewrite them than to control the size
    // remove this if we are comfortable that they are smaller than 4MB
    responseLimit: false,
  },
};
