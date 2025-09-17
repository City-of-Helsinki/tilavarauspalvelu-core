import type { NextApiRequest, NextApiResponse } from "next";
import { getVersion } from "@/modules/baseUtils.mjs";

type ResponseData = {
  message: string;
  version: string;
};
export default function handler(_req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  const title = "Healthcheck";
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({
    message: title,
    version: getVersion(),
  });
}

export const revalidate = 0;
