import React from "react";
import type { GetServerSidePropsContext } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import styled from "styled-components";
import { H2 } from "ui/src/styled";
import { KorosHeading, Heading } from "@/components/KorosHeading";
import { useSession } from "@/hooks";
import { HERO_IMAGE_URL } from "@/modules/const";

const Ingress = styled(H2)`
  max-width: 44rem;
  margin: var(--spacing-3-xl) auto var(--spacing-2-xl);
  padding: 0 var(--spacing-xl);
  text-align: center;
  line-height: 1.8125rem;
`;

type PageProps = Awaited<ReturnType<typeof getServerSideProps>>["props"];
export default function Index({ rand }: PageProps) {
  const { t } = useTranslation();

  const { user } = useSession();

  let headingStr = t("translation:MainLander.welcome");
  if (
    user?.username === "u-gptwmnqqnjahlfj2uas2glyx5a" &&
    rand < 0.1 // 10% chance
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
      rand: Math.random(),
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}
