import Head from "next/head";

type Props = {
  children: string;
};
const Title = ({ children }: Props) => (
  <Head>
    <title>{children}</title>
  </Head>
);

export default Title;
