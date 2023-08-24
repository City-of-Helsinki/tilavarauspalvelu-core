import { breakpoints } from "common/src/common/style";
import { H4 } from "common/src/common/typography";
import { Notification } from "hds-react";
import styled from "styled-components";
import { Container } from "common";

export const Wrapper = styled.div`
  padding-bottom: var(--spacing-layout-xl);
`;

export const TwoColumnLayout = styled.div`
  display: block;
  margin-bottom: var(--spacing-m);

  @media (min-width: ${breakpoints.l}) {
    display: grid;
    gap: var(--spacing-layout-s);
    grid-template-columns: 7fr 390px;
    margin-top: var(--spacing-m);
    margin-bottom: var(--spacing-xl);
  }
`;

export const Left = styled.div`
  max-width: 100%;
`;

export const Content = styled.div`
  font-size: var(--fontsize-body-l);
  line-height: var(--lineheight-l);
  white-space: pre-wrap;
  word-break: break-word;
  margin-bottom: var(--spacing-2-xl);
`;

export const PaddedContent = styled(Content)`
  padding-top: var(--spacing-m);
  margin-bottom: var(--spacing-m);
`;

export const CalendarFooter = styled.div<{ $cookiehubBannerHeight?: number }>`
  position: sticky;
  bottom: ${({ $cookiehubBannerHeight }) =>
    $cookiehubBannerHeight ? `${$cookiehubBannerHeight}px` : 0};
  background-color: var(--color-white);
  z-index: var(--tilavaraus-stack-order-sticky-container);

  display: flex;
  flex-direction: column-reverse;

  @media (min-width: ${breakpoints.l}) {
    flex-direction: column;
    gap: var(--spacing-2-xl);
    justify-content: space-between;
  }
`;

export const BottomWrapper = styled.div`
  margin: 0;
  padding: 0;
`;

export const BottomContainer = styled(Container)`
  margin-bottom: calc(var(--spacing-s) * -1 + var(--spacing-layout-xl) * -1);
  padding-bottom: var(--spacing-layout-xl);
`;

export const Subheading = styled(H4).attrs({ as: "h3" })<{
  $withBorder?: boolean;
}>`
  ${({ $withBorder }) =>
    $withBorder &&
    `
      border-bottom: 1px solid var(--color-black-50);
      padding-bottom: var(--spacing-s);
    `}
`;

export const CalendarWrapper = styled.div`
  margin-bottom: var(--spacing-layout-l);
  position: relative;

  .rbc-event {
    padding: 2px;

    @media (min-width: ${breakpoints.m}) {
      padding: 2px 5px;
    }

    @media (min-width: ${breakpoints.l}) {
      padding: 2px;
    }

    @media (min-width: ${breakpoints.xl}) {
      padding: 2px 5px;
    }
  }
`;

export const MapWrapper = styled.div`
  margin-top: var(--spacing-m);
  margin-bottom: var(--spacing-xs);
`;

export const StyledNotification = styled(Notification)<{ $isSticky?: boolean }>`
  div > div {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }

  ${({ $isSticky }) =>
    $isSticky &&
    `
    position: sticky;
    top: 0;
    z-index: var(--tilavaraus-stack-order-sticky-container);`};
  svg {
    color: var(--color-info);
    min-width: 24px;
  }

  button > svg {
    color: inherit;
  }
`;

export const PinkBox = styled.div`
  margin: var(--spacing-m) 0;
  padding: 1px var(--spacing-m) var(--spacing-m);
  background-color: var(--color-suomenlinna-light);
  line-height: var(--lineheight-l);

  p {
    &:last-of-type {
      margin-bottom: 0;
    }

    margin-bottom: var(--spacing-s);
  }

  ${Subheading} {
    margin-top: var(--spacing-m);
  }
`;

export const ErrorBox = styled(Notification)`
  max-width: 360px;
  align-self: flex-end;
  margin-bottom: var(--spacing-m);
`;

export const ErrorList = styled.ul`
  margin-top: var(--spacing-2-xs);
`;

export const ErrorAnchor = styled.a`
  &,
  &:visited {
    color: var(--color-black) !important;
    text-decoration: underline;
    line-height: var(--lineheight-xl);
  }
`;
