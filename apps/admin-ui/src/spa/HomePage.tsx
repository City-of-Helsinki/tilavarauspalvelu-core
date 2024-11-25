import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { H2 } from "common/src/common/typography";
import { HERO_IMAGE_URL } from "@/common/const";
import { KorosHeading, Heading } from "@/component/KorosHeading";
import { useSession } from "@/hooks/auth";

const Ingress = styled(H2)`
  max-width: 44rem;
  margin: var(--spacing-3-xl) auto var(--spacing-2-xl);
  padding: 0 var(--spacing-xl);
  text-align: center;
  line-height: 1.8125rem;
`;

function HomePage(): JSX.Element {
  const { t } = useTranslation();

  const { user } = useSession();

  let headingStr = t("User.welcome");
  const name = user?.firstName;
  if (name) {
    headingStr += `, ${name}`;
  }

  return (
    <div>
      <KorosHeading heroImage={HERO_IMAGE_URL}>
        <Heading>{headingStr}!</Heading>
      </KorosHeading>
      <Ingress as="p">{t("MainLander.ingress")}</Ingress>
    </div>
  );
}

export default HomePage;
