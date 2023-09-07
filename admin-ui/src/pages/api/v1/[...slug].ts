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
  const { method, body } = req;
  const reqUrl = `${url}${method !== "GET" ? "/" : ""}${
    params ? `?${params}` : ""
  }`;
  // eslint-disable-next-line no-console
  console.log(method, reqUrl);
  if (method === "GET" && body) {
    return res.status(400).json({ error: "GET cannot have a body", body });
  }
  if ((method === "POST" || method === "PUT" || method === "PATCH") && !body) {
    return res.status(400).json({ error: `${method} requires a body` });
  }
  try {
    const result = await fetch(reqUrl, {
      method,
      ...(method !== "GET" && body ? { body: JSON.stringify(body) } : {}),
      headers: {
        "Content-Type": "application/json",
        ...(session?.apiTokens?.tilavaraus != null
          ? {
              Authorization: `Bearer ${session.apiTokens.tilavaraus}`,
            }
          : {}),
      },
    });
    const data = result.ok ? await result.json() : "";
    return res.status(result.status).json(data);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json(err);
  }
}

export const config = {
  api: {
    // We use api routes to rewrite backend calls without headers and cookies
    // it's more important to rewrite them than to control the size
    // remove this if we are comfortable that they are smaller than 4MB
    responseLimit: false,
  },
};
