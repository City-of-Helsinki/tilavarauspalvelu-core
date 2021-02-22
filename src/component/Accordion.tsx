import React, { ReactNode, useState } from "react";
import { IconAngleDown, IconAngleUp } from "hds-react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { H2 } from "../styles/typography";

interface IProps {
  heading: string | null;
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
}

const Content = styled.div``;

const Wrapper = styled.div<{ $open: boolean }>`
  ${Content} {
    display: ${({ $open }) => ($open ? "block" : "none")};
  }

  margin-bottom: var(--spacing-l);
`;

const Heading = styled.div`
  &:hover {
    h2,
    button {
      opacity: 0.4;
    }
  }

  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
  border-bottom: 1px solid var(--tilavaraus-ui-gray);
  margin-bottom: var(--spacing-l);
`;

const ToggleButton = styled.button`
  border: 0;
  background: none;
`;

function Accordion({
  heading,
  children,
  className,
  defaultOpen = false,
}: IProps): JSX.Element {
  const [isAccordionOpen, toggleOpenState] = useState(defaultOpen);

  const { t } = useTranslation();

  const buttonAriaLabel = isAccordionOpen
    ? `${t("common.close")} ${t("common.accordion")} "${heading}"`
    : `${t("common.open")} ${t("common.accordion")} "${heading}"`;
  const toggleIcon = isAccordionOpen ? <IconAngleUp /> : <IconAngleDown />;

  return (
    <Wrapper className={className} $open={isAccordionOpen}>
      <Heading onClick={() => toggleOpenState(!isAccordionOpen)}>
        <H2>{heading}</H2>
        <ToggleButton
          type="button"
          aria-label={buttonAriaLabel}
          onClick={() => toggleOpenState(!isAccordionOpen)}
        >
          {toggleIcon}
        </ToggleButton>
      </Heading>
      <Content aria-hidden={!isAccordionOpen}>{children}</Content>
    </Wrapper>
  );
}

export default Accordion;
