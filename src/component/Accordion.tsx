import React, { ReactNode, useState } from "react";
import { IconAngleDown, IconAngleUp } from "hds-react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { H2 } from "../styles/typography";

interface IProps {
  heading: string | JSX.Element | null;
  defaultOpen?: boolean;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const ToggleButton = styled.button`
  border: 0;
  background: none;
`;

const Heading = styled.div<{ $disabled: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: var(--spacing-m);
  ${({ $disabled }) =>
    $disabled
      ? `
      cursor: default;
      opacity: 0.5;
    `
      : `
      ${ToggleButton} {
         cursor: pointer;
      }

      cursor: pointer;
    `}

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
  disabled = false,
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
        onClick={() => !disabled && toggleOpenState(!isAccordionOpen)}
        data-testid="accordion__header"
        $disabled={disabled}
      >
        <H2 className="heading">{heading}</H2>
        <ToggleButton
          type="button"
          aria-label={buttonAriaLabel}
          disabled={disabled}
          onClick={() => !disabled && toggleOpenState(!isAccordionOpen)}
        >
          {isAccordionOpen ? (
            <ToggleIconOpen aria-hidden />
          ) : (
            <ToggleIconClosed aria-hidden />
          )}
        </ToggleButton>
      </Heading>
      <Content aria-hidden={!isAccordionOpen}>{children}</Content>
    </Wrapper>
  );
}

export default Accordion;
