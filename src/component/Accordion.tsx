import React, { ReactNode, useState } from "react";
import { IconAngleDown, IconAngleUp } from "hds-react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { H2 } from "../styles/typography";

interface IProps {
  heading: string | null;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const Heading = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: var(--spacing-m);

  h2 {
    font-size: var(--header-font-size);
  }
`;

const Content = styled.div`
  padding-top: var(--content-padding-top);
  padding-bottom: var(--spacing-unit);
`;

const Wrapper = styled.div<{ $open: boolean }>`
  --header-font-size: var(--fontsize-heading-xxs);
  --button-size: var(--fontsize-heading-m);
  --border-color: var(--color-silver);
  --content-padding-top: var(--spacing-m);
  --spacing-unit: var(--spacing-m);

  ${Content} {
    display: ${({ $open }) => ($open ? "block" : "none")};
  }
`;

const ToggleButton = styled.button`
  border: 0;
  background: none;
`;

const ToggleIconOpen = styled(IconAngleUp).attrs({
  style: {
    "--icon-size": "var(--button-size)",
  } as React.CSSProperties,
})``;

const ToggleIconClosed = styled(IconAngleDown).attrs({
  style: {
    "--icon-size": "var(--button-size)",
  } as React.CSSProperties,
})``;

function Accordion({
  heading,
  defaultOpen = false,
  children,
  className,
  style,
  ...rest
}: IProps): JSX.Element {
  const [isAccordionOpen, toggleOpenState] = useState(defaultOpen);

  const { t } = useTranslation();

  const buttonAriaLabel = isAccordionOpen
    ? `${t("common.close")} ${t("common.accordion")} "${heading}"`
    : `${t("common.open")} ${t("common.accordion")} "${heading}"`;

  return (
    <Wrapper
      style={style}
      className={className}
      $open={isAccordionOpen}
      {...rest}
    >
      <Heading
        onClick={() => toggleOpenState(!isAccordionOpen)}
        data-testid="accordion__header"
      >
        <H2>{heading}</H2>
        <ToggleButton
          type="button"
          aria-label={buttonAriaLabel}
          onClick={() => toggleOpenState(!isAccordionOpen)}
        >
          {isAccordionOpen ? <ToggleIconOpen /> : <ToggleIconClosed />}
        </ToggleButton>
      </Heading>
      <Content aria-hidden={!isAccordionOpen}>{children}</Content>
    </Wrapper>
  );
}

export default Accordion;
