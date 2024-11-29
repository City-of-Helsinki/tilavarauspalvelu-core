import { Link } from "hds-react";
import React from "react";
import styled from "styled-components";
import { H1 } from "common/src/common/typography";
import { PUBLIC_URL } from "./const";
import { useTranslation } from "next-i18next";

const Image = styled.img`
  width: 100%;
  max-width: 400px;
`;

function Error5xx({ feedbackUrl }: { feedbackUrl: string }): JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      <H1 $large>{t("errorPages.generalError.title")}</H1>
      <Link external href="/">
        {t("errorPages.linkToVaraamo")}
      </Link>
      <Link external href={feedbackUrl}>
        {t("errorPages.giveFeedback")}
      </Link>
      <Image src={`${PUBLIC_URL}/5xx.png`} />
    </>
  );
}

export default Error5xx;
