import React from "react";
import styled from "styled-components";
import { Footer as HDSFooter } from "hds-react";
import { useTranslation } from "react-i18next";

const StyledFooter = styled(HDSFooter)`
  & > * {
    &:first-of-type > svg {
      fill: transparent;
    }

    max-width: unset !important;
  }
`;

function Footer(): JSX.Element {
  const { t } = useTranslation();

  return (
    <StyledFooter
      korosType="basic"
      logoLanguage="fi"
      theme="light"
      title={t("common.applicationName")}
    >
      <HDSFooter.Base copyrightHolder={t("common.cityOfHelsinki")} />
    </StyledFooter>
  );
}

export default Footer;
