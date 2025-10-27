import React from "react";
import { type GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import styled from "styled-components";
import { useTranslation } from "next-i18next";
import { H2 } from "common/src/styled";
import { HERO_IMAGE_URL } from "@/modules/const";
import { KorosHeading, Heading } from "@/components/KorosHeading";
import { useSession } from "@/hooks";
import { getCommonServerSideProps } from "@/modules/serverUtils";

const Ingress = styled(H2)`
  max-width: 44rem;
  margin: var(--spacing-3-xl) auto var(--spacing-2-xl);
  padding: 0 var(--spacing-xl);
  text-align: center;
  line-height: 1.8125rem;
`;

export type PageProps = Awaited<ReturnType<typeof getServerSideProps>>["props"];
export default function Index(_props: PageProps) {
  const { t } = useTranslation();

  const { user } = useSession();

  let headingStr = t("translation:MainLander.welcome");
  if (
    user?.username === "u-gptwmnqqnjahlfj2uas2glyx5a" &&
    Math.random() < 0.1 // 10% chance
  ) {
    headingStr = t("translation:MainLander.welcomeCustom");
  }

  const name = user?.firstName;
  if (name) {
    headingStr += `, ${name}`;
  }

  return (
    <div>
      <KorosHeading heroImage={HERO_IMAGE_URL}>
        <Heading>{headingStr}!</Heading>
      </KorosHeading>
      <Ingress as="p">{t("translation:MainLander.ingress")}</Ingress>
    </div>
  );
}

export async function getServerSideProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      ...(await getCommonServerSideProps()),
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}
