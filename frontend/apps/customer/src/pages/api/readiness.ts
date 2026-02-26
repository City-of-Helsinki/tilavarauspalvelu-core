import { getVersion } from "@/modules/baseUtils";
import type { NextApiRequest, NextApiResponse } from "next";

type ResponseData = {
  status: string;
  release: string;
};

export default function handler(_req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({
    status: 'ok',
    release: getVersion(),
  });
}
