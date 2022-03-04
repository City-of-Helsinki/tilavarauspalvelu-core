import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { IconAngleLeft } from "hds-react";
import { useHistory } from "react-router-dom";
import { BasicLink } from "../styles/util";

interface IProps {
  route?: string;
}

const StyledLink = styled(BasicLink)`
  display: inline-flex;
  align-items: center;
  font-size: var(--fontsize-heading-s);
  padding-right: var(--spacing-s);
`;

function LinkPrev({ route }: IProps): JSX.Element {
  const { t } = useTranslation();
  const { goBack } = useHistory();
  return (
    <StyledLink
      to={route || "#"}
      data-testid="link__previous"
      onClick={(e) => {
        if (!route) {
          e.preventDefault();
          goBack();
        }
      }}
    >
      <IconAngleLeft size="m" aria-hidden />
      {t("common.prev")}
    </StyledLink>
  );
}

export default LinkPrev;
