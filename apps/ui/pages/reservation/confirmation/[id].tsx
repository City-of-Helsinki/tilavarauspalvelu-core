import React, { useEffect } from "react";
import { CenterSpinner } from "@/components/common/common";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { useRouter } from "next/router";
import { getReservationPath } from "@/modules/urls";

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<Props, { notFound: boolean }>;

// Preserving this page for backwards compatibility (it's used as a return page from webstore)
// TODO should move the redirect to middleware
function ReservationSuccess({ reservationPk }: PropsNarrowed) {
  const router = useRouter();
  useEffect(() => {
    const url = getReservationPath(reservationPk, "confirmation");
    router.replace(url);
  }, [router, reservationPk]);

  return <CenterSpinner />;
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { locale, params } = ctx;
  const commonProps = getCommonServerSideProps();
  const notFoundValue = {
    notFound: true,
    props: {
      ...commonProps,
      ...(await serverSideTranslations(locale ?? "fi")),
      notFound: true,
    },
  };

  const reservationPk = Number(params?.id);
  const isValid = reservationPk > 0;
  if (!isValid) {
    return notFoundValue;
  }

  return {
    props: {
      ...commonProps,
      reservationPk,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

export default ReservationSuccess;
