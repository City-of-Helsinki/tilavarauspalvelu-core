import type { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";
import getConfig from "next/config";

const {
  publicRuntimeConfig: { baseUrl, oidcEndSessionUrl },
} = getConfig();

const federatedLogOut = async (
  req: NextApiRequest,
  res: NextApiResponse
): Promise<NextApiResponse> => {
  try {
    const token = await getToken({ req });
    if (!token) {
      return res.redirect(baseUrl);
    }

    const redirectURL = `${baseUrl}/logout`;
    const endSessionParams = new URLSearchParams({
      post_logout_redirect_uri: redirectURL,
    });
    const fullUrl = `${oidcEndSessionUrl}?${endSessionParams.toString()}`;

    return res.redirect(fullUrl);
  } catch (error) {
    return res.redirect(baseUrl);
  }
};

export default federatedLogOut;
