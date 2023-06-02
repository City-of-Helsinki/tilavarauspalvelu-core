import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { IconAngleLeft } from "hds-react";
import { useNavigate } from "react-router-dom";
import { BasicLink } from "../styles/util";

interface IProps {
  route?: string;
}

const StyledLink = styled(BasicLink)`
  display: inline-flex;
  align-items: center;
  font-size: var(--fontsize-body-m);
  padding-right: var(--spacing-s);
  text-decoration: none;
  gap: var(--spacing-2-xs);
`;

function LinkPrev({ route }: IProps): JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <StyledLink
      to={route || "#"}
      data-testid="link__previous"
      onClick={(e) => {
        if (!route) {
          e.preventDefault();
          navigate(-1);
        }
      }}
    >
      <IconAngleLeft size="s" aria-hidden />
      {t("common.prev")}
    </StyledLink>
  );
}

export default LinkPrev;
