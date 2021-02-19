import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { IconAngleLeft } from "hds-react";
import { BasicLink } from "../styles/util";

interface IProps {
  route: string;
}

const StyledLink = styled(BasicLink)`
  display: inline-flex;
  align-items: center;
  font-size: var(--fontsize-heading-s);
  padding-right: var(--spacing-s);

  svg {
    margin-right: 0.5em;
  }
`;

function LinkPrev({ route }: IProps): JSX.Element {
  const { t } = useTranslation();
  return (
    <StyledLink to={route}>
      <IconAngleLeft size="m" />
      {t("common.prev")}
    </StyledLink>
  );
}

export default LinkPrev;
