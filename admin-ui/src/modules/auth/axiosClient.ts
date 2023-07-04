import axios from "axios";
import applyCaseMiddleware from "axios-case-converter";
import { getSession } from "next-auth/react";
import { PROFILE_TOKEN_HEADER } from "app/common/const";

const axiosOptions = {
  timeout: 20000,
  headers: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "Content-Type": "application/json",
  },
};

const authEnabled = true;

const axiosClient = applyCaseMiddleware(axios.create(axiosOptions));

if (typeof window !== "undefined" && authEnabled) {
  axiosClient.interceptors.request.use(async (req) => {
    const session = await getSession();

    if (session?.apiTokens?.tilavaraus) {
      req.headers.Authorization = `Bearer ${session.apiTokens.tilavaraus}`;
    }

    if (session?.apiTokens?.profile) {
      req.headers[PROFILE_TOKEN_HEADER] = `${session?.apiTokens.profile}`;
    }

    return req;
  });
}

export default axiosClient;
