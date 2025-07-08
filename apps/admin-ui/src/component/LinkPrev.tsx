import React from "react";
import styled from "styled-components";
import { useTranslation } from "next-i18next";
import { IconAngleLeft, IconSize } from "hds-react";
import Link from "next/link";

const StyledLink = styled(Link)`
  display: inline-flex;
  font-size: var(--fontsize-body-m);
  color: var(--color-black-90);
  padding-right: var(--spacing-s);
  text-decoration: none;
  user-select: none;
  gap: var(--spacing-2-xs);
  align-content: center;
  align-items: center;
`;

type Props = {
  route?: string;
  style?: React.CSSProperties;
  className?: string;
};

function LinkPrevInner({ route, style, className }: Props): JSX.Element {
  const { t } = useTranslation();
  return (
    <StyledLink href={route || ".."} style={style} className={className} data-testid="link__previous">
      <IconAngleLeft size={IconSize.Small} />
      {t("common:prev")}
    </StyledLink>
  );
}

const PreviousLinkWrapper = styled.div`
  padding: var(--spacing-s) 0 0;
`;

export function LinkPrev(props: Props): JSX.Element {
  return (
    <PreviousLinkWrapper>
      <LinkPrevInner {...props} />
    </PreviousLinkWrapper>
  );
}
