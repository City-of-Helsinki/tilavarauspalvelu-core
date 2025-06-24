import { createApolloClient } from "@/modules/apolloClient";
import { getCommonServerSideProps, getReservationByOrderUuid } from "@/modules/serverUtils";
import { ignoreMaybeArray } from "common/src/helpers";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export async function getReservationServerProps(ctx: GetServerSidePropsContext) {
  const { locale, query } = ctx;
  const commonProps = getCommonServerSideProps();

  const orderId = ignoreMaybeArray(query.orderId);

  if (!orderId) {
    return {
      notFound: true,
      props: {
        ...commonProps,
        ...(await serverSideTranslations(locale ?? "fi")),
        notFound: true,
      },
    };
  }
  const apolloClient = createApolloClient(commonProps.apiBaseUrl, ctx);
  return {
    apolloClient,
    commonProps,
    orderId,
    reservation: await getReservationByOrderUuid(apolloClient, orderId),
    locale,
  };
}
