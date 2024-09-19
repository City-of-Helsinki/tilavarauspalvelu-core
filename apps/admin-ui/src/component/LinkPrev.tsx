import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { IconAngleLeft } from "hds-react";
import { BasicLink } from "../styles/util";

const StyledLink = styled(BasicLink)`
  display: inline-flex;
  align-items: center;
  font-size: var(--fontsize-body-m);
  padding-right: var(--spacing-s);
  text-decoration: none;
  gap: var(--spacing-2-xs);
`;

type Props = {
  route?: string;
  style?: React.CSSProperties;
  className?: string;
};

function LinkPrevInner({ route, style, className }: Props): JSX.Element {
  const { t } = useTranslation();
  return (
    <StyledLink
      to={route || ".."}
      relative="path"
      style={style}
      className={className}
      data-testid="link__previous"
    >
      <IconAngleLeft size="s" aria-hidden />
      {t("common.prev")}
    </StyledLink>
  );
}

const PreviousLinkWrapper = styled.div`
  padding: var(--spacing-s);
`;

export function LinkPrev(props: Props): JSX.Element {
  return (
    <PreviousLinkWrapper>
      <LinkPrevInner {...props} />
    </PreviousLinkWrapper>
  );
}
