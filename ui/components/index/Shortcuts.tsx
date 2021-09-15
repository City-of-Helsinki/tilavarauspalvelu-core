import React from "react";
import { IconCalendar, Linkbox } from "hds-react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import Container from "../common/Container";
import { breakpoint } from "../../modules/style";
import { JustForDesktop, JustForMobile } from "../../modules/style/layout";
import { KebabHeading } from "../../modules/style/typography";

type Shortcut = {
  heading: string;
  link: string;
  icon?: React.ReactNode;
};

const shortcuts: Shortcut[] = [
  {
    heading: "organizeEvent",
    link: "/",
    icon: <IconCalendar size="xl" />,
  },
  { heading: "pictureOrSound", link: "/", icon: <IconCalendar size="xl" /> },
  { heading: "sports", link: "/", icon: <IconCalendar size="xl" /> },
  { heading: "tutoring", link: "/", icon: <IconCalendar size="xl" /> },
  { heading: "working", link: "/", icon: <IconCalendar size="xl" /> },
  { heading: "sauna", link: "/", icon: <IconCalendar size="xl" /> },
  { heading: "workshop", link: "/", icon: <IconCalendar size="xl" /> },
];

const Wrapper = styled.div`
  background-color: var(--tilavaraus-header-background-color);
  padding-bottom: var(--spacing-layout-l);
`;

const Heading = styled(KebabHeading)`
  margin: 0;
  padding: 0 0 var(--spacing-l);
  font-size: var(--fontsize-heading-xs);

  @media (min-width: ${breakpoint.m}) {
    font-size: var(--fontsize-heading-m);
    padding: var(--spacing-m) 0 var(--spacing-3-xl);
  }
`;

const ShortcutsWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-2-xs);

  & > div {
    &:hover {
      opacity: 0.7;
    }

    background-color: var(--color-engel-light);
  }

  & > div > div {
    background-color: inherit;
    display: grid;
    justify-content: center;
    padding-bottom: 50px;

    div[role="heading"] {
      font-size: var(--fontsize-body-m);
      text-align: center;
      padding-top: var(--spacing-2-xs);
    }

    svg {
      order: -1;
      margin: 0 auto;
    }
  }

  & > div > a > svg {
    --icon-size: var(--spacing-layout-xs) !important;
    left: 46%;
  }

  @media (min-width: ${breakpoint.m}) {
    & > div > div div[role="heading"] {
      font-size: var(--fontsize-body-l);
    }

    gap: var(--spacing-m);
    grid-template-columns: 1fr 1fr 1fr;
  }

  @media (min-width: ${breakpoint.l}) {
    grid-template-columns: 1fr 1fr 1fr 1fr;
  }
`;

const Shortcuts = (): JSX.Element => {
  const { t } = useTranslation("home");

  return (
    <Wrapper>
      <Container>
        <Heading>
          <JustForMobile>{t("shortcutsHeadingMobile")}</JustForMobile>
          <JustForDesktop>{t("shortcutsHeading")}</JustForDesktop>
        </Heading>
        <ShortcutsWrapper>
          {shortcuts.map((shortcut) => (
            <Linkbox
              key={shortcut.heading}
              heading={t(`shortcuts.${shortcut.heading}`)}
              href={shortcut.link}
              linkAriaLabel={t(`shortcuts.${shortcut.heading}`)}
              linkboxAriaLabel={t(`shortcuts.${shortcut.heading}`)}
            >
              {shortcut.icon}
            </Linkbox>
          ))}
        </ShortcutsWrapper>
      </Container>
    </Wrapper>
  );
};

export default Shortcuts;
