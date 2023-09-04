import React, { useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import App from "../App";
import Layout from "./layout";

export default function Index() {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.error === "RefreshAccessTokenError") {
      // eslint-disable-next-line no-console
      console.warn("Refreshing access token failed, forcing sign in");
      signIn("tunnistamo"); // Force sign in to hopefully resolve error
    }
  }, [session]);

  return (
    <Layout>
      <App />
    </Layout>
  );
}
