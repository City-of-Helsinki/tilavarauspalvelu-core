import type { NextApiRequest, NextApiResponse } from "next";
import getConfig from "next/config";

const {
  publicRuntimeConfig: { baseUrl, oidcEndSessionUrl },
} = getConfig();

const federatedLogOut = async (
  req: NextApiRequest,
  res: NextApiResponse
): Promise<NextApiResponse> => {
  const { token } = req.query;
  try {
    if (!token) {
      // eslint-disable-next-line no-console
      console.warn("logout: no token parameter: redirect to main page");
      return res.redirect(baseUrl);
    }

    // TODO post_logout_redirect_uri doesn't work sometimes with tunnistamo why?
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
