import axios from "axios";
import applyCaseMiddleware from "axios-case-converter";

import { getSession } from "next-auth/react";
import { authEnabled, isBrowser } from "../const";

const axiosOptions = {
  timeout: 20000,
  headers: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "Content-Type": "application/json",
  },
};

const axiosClient = applyCaseMiddleware(axios.create(axiosOptions));

if (isBrowser && authEnabled) {
  axiosClient.interceptors.request.use(async (req) => {
    const session = await getSession();

    if (session?.apiTokens?.tilavaraus) {
      req.headers.Authorization = `Bearer ${session.apiTokens.tilavaraus}`;
    }

    return req;
  });
}

export default axiosClient;
