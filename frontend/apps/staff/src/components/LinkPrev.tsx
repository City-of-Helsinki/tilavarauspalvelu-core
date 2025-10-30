import React from "react";
import styled from "styled-components";
import { useTranslation } from "next-i18next";
import { IconAngleLeft, IconSize } from "hds-react";
import { useRouter } from "next/router";
import { focusStyles, removeButtonStyles } from "ui/src/styled";

const StyledLink = styled.button`
  ${removeButtonStyles}
  display: inline-flex;
  font-size: var(--fontsize-body-m);
  color: var(--color-black-90);
  padding-right: var(--spacing-s);
  text-decoration: none;
  user-select: none;
  gap: var(--spacing-2-xs);
  align-content: center;
  align-items: center;

  ${focusStyles}
  &:hover {
    text-decoration: underline;
    cursor: pointer;
  }
`;

type Props = {
  route?: string;
  style?: React.CSSProperties;
  className?: string;
};

function LinkPrevInner({ route, style, className }: Props): JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  const handleClick = () => {
    if (route) {
      router.replace(route);
    } else {
      router.back();
    }
  };

  return (
    <StyledLink onClick={handleClick} style={style} className={className} data-testid="link__previous">
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
