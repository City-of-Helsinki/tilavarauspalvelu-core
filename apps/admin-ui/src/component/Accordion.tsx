import React, { ReactNode, useEffect, useState } from "react";
import { IconAngleDown, IconAngleUp } from "hds-react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { H2 } from "common/src/common/typography";

interface IProps {
  heading: string | JSX.Element | null;
  initiallyOpen?: boolean;
  children: ReactNode;
  headingLevel?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const ToggleButton = styled.button`
  border: 0;
  background: none;
`;

const Heading = styled.div<{ $disabled: boolean }>`
  /* stylelint-disable csstools/value-no-unknown-custom-properties */
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

  h2, h3, h4, h5, h6 {
    font-size: var(--header-font-size);
  }
`;

const Content = styled.div`
  padding-top: var(--content-padding-top);
  padding-bottom: var(--spacing-unit);
`;

const Wrapper = styled.div<{ $open: boolean }>`
  --header-font-size: var(--fontsize-heading-m);
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

/// HDS Accordion doesn't update when it's initiallyOpen prop changes
/// so we can't programmatically open it (for example from validation errors)
/// TODO styling is bit off
/// TODO seems like this affected MainMenu link styling
export function Accordion({
  heading,
  headingLevel = "h2",
  initiallyOpen = false,
  children,
  disabled = false,
  className,
  style,
  ...rest
}: IProps): JSX.Element {
  const [isAccordionOpen, toggleOpenState] = useState(initiallyOpen);

  const { t } = useTranslation();

  useEffect(() => {
    toggleOpenState(initiallyOpen);
  }, [initiallyOpen]);

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
        <H2 className="heading" $legacy as={headingLevel}>
          {heading}
        </H2>
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
