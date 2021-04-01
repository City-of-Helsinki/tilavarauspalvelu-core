import React from "react";
import styled from "styled-components";
import { Footer as HDSFooter } from "hds-react";
import { useTranslation } from "react-i18next";
import { breakpoints } from "../styles/util";

const StyledFooter = styled(HDSFooter)`
  display: none;

  @media (min-width: ${breakpoints.m}) {
    display: block;
    position: fixed;
    bottom: 0;
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
