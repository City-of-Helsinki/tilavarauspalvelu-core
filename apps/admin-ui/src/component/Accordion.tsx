import React, { ReactNode, useEffect, useState } from "react";
import { IconAngleDown, IconAngleUp } from "hds-react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { H2 } from "common/src/common/typography";
import { Flex } from "common/styles/util";

interface IProps {
  heading: string | JSX.Element | null;
  initiallyOpen?: boolean;
  open?: boolean;
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

const Heading = styled(Flex).attrs({
  $align: "center",
  $justify: "space-between",
  $direction: "row",
})<{ $disabled: boolean }>`
  cursor: pointer;
  user-select: none;
  border-bottom: 1px solid var(--border-color);
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

// TODO add animation to the open/close toggle (ex. keyframe visiblity)
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

const StyledH2 = styled(H2)`
  --header-line-height: 1.5;
  --header-padding: var(--spacing-m);
  margin: 0;
  padding: var(--header-padding) 0;
  line-height: var(--header-line-height);
`;

/// HDS Accordion doesn't update when it's initiallyOpen prop changes
/// so we can't programmatically open it (for example from validation errors)
/// TODO styling is bit off
/// TODO seems like this affected MainMenu link styling
/// @param open programmaticaly open the accordion (overrides user state temporarily)
/// @param initiallyOpen set the default open state (overrides user state permanently)
export function Accordion({
  heading,
  headingLevel = "h2",
  initiallyOpen = false,
  open,
  children,
  disabled = false,
  className,
  style,
  ...rest
}: IProps): JSX.Element {
  const [accordionOpenState, toggleOpenState] = useState(initiallyOpen);

  const { t } = useTranslation();

  useEffect(() => {
    toggleOpenState(initiallyOpen);
  }, [initiallyOpen]);

  const isAccordionOpen = open || accordionOpenState;
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
        <StyledH2 className="heading" as={headingLevel}>
          {heading}
        </StyledH2>
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
