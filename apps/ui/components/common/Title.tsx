import React from "react";
import Head from "next/head";

type Props = {
  children: string;
};
const Title = ({ children }: Props): JSX.Element => (
  <Head>
    <title>{children}</title>
  </Head>
);

export default Title;
