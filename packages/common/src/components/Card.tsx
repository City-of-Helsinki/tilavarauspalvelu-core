import React, { ElementType } from "react";
import styled from "styled-components";
import Link from "next/link";
import { Flex, fontMedium } from "../../styled";
import { breakpoints } from "../const";

type CardVariant = "default" | "vertical";

export type CardInfoItem = {
  value: string;
  icon?: JSX.Element;
  testId?: string;
};

export type CardProps = {
  heading: string;
  headingTestId?: string;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  text?: string;
  textTestId?: string;
  variant?: CardVariant;
  backgroundColor?: string;
  testId?: string;
  link?: string;
  imageSrc?: string;
  imageAlt?: string;
  tags?: JSX.Element[];
  infos?: CardInfoItem[];
  buttons?: JSX.Element[];
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  LinkComponent?: LinkComponent;
};

const Wrapper = styled.div<{ $bgColor: string }>`
  &,
  * {
    box-sizing: border-box;
  }
  background-color: ${(props) => props.$bgColor};
  display: flex;
  height: 100%;
  width: 100%;
  flex-direction: column;
  align-items: stretch;

  &.card--with-link {
    img {
      cursor: pointer;
    }
    &:has(img:hover) .card__header {
      text-decoration: underline;
    }
  }
  @media (min-width: ${breakpoints.m}) {
    &.card--default {
      flex-direction: row;
    }
  }
`;

const ImageWrapper = styled(Flex).attrs({
  $gap: "none",
  $alignItems: "center",
  $justifyContent: "center",
  $direction: "row",
})`
  overflow: hidden;
  width: 100%;
  max-height: 220px;
  background: var(--color-black-20);
  a {
    display: block;
    width: 100%;
    height: 100%;
  }
  @media (min-width: ${breakpoints.m}) {
    .card--default & {
      max-width: 200px;
      max-height: unset;
    }
  }

  @media (min-width: ${breakpoints.l}) {
    width: 100%;
    max-height: 205px;
    .card--default & {
      max-width: 190px;
    }
  }
`;

const Image = styled.img`
  display: block;
  object-fit: cover;
  object-position: center;
  width: 100%;
  height: 100%;
  max-height: 146px;
  @media (max-width: ${breakpoints.m}) {
    min-height: 220px;
    max-height: 220px;
  }
`;

const CardContent = styled.div<{ $itemCount: number }>`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: var(--spacing-s);
  position: relative;
  width: 100%;
  height: 100%;
  padding: var(--spacing-s) var(--spacing-m);
  flex-grow: 1;
  font-size: var(--fontsize-body-m);

  @media (min-width: ${breakpoints.m}) {
    .card--default & {
      display: grid;
      grid-template-rows: repeat(2, auto);
      grid-template-columns: repeat(2, auto);
      gap: 0;
      padding: var(--spacing-m);
    }
    .card--default.card--with-image.card--with-tags & {
      margin-top: 0;
    }
  }

  @media (min-width: ${breakpoints.l}) {
    .card--default & {
      gap: 0;
    }
  }
`;

const ChildContainer = styled.div`
  grid-column: 1;
  grid-row: 2;
  align-content: end;
`;

// Don't import react-router-dom here because we don't want to have it as a dependency
type LinkProps = {
  children: React.ReactNode;
  tabIndex?: number;
  to: To;
};
type LinkComponent = React.ForwardRefExoticComponent<LinkProps & React.RefAttributes<HTMLAnchorElement>>;
type To = string | Partial<Path>;
interface Path {
  pathname: string;
  search: string;
  hash: string;
}

function WrapWithLink({
  content,
  link,
  focusable = true,
  LinkComponent,
}: Readonly<{
  content: JSX.Element;
  link?: string;
  focusable?: boolean;
  LinkComponent?: LinkComponent;
}>): JSX.Element {
  if (!link) {
    return content;
  }
  if (LinkComponent) {
    return (
      <LinkComponent tabIndex={focusable ? 0 : 1} to={link}>
        {content}
      </LinkComponent>
    );
  }
  return (
    <Link tabIndex={focusable ? 0 : 1} href={link}>
      {content}
    </Link>
  );
}

/**
 * @name Card
 * @description Card component that displays a plain card with a heading and main text. It may also contain an image and tags/status labels, infos, and buttons. Any child elements are rendered after the main text.
 * @param {string} [heading] - The heading text of the card.
 * @param {string} [headingTestId] - The test ID of the heading element.
 * @param {string} [headingLevel=3] - The level of the heading element (1-6)
 * @param {string} [text] - The main text content of the card.
 * @param {string} [textTestId] - The test ID of the text element.
 * @param {"default" | "vertical"} [variant="default"] - The variant of the card, either "default" or "vertical".
 * @param {string} [backgroundColor="var(--color-black-5)"] - The background color of the card.
 * @param {string} [testId] - The test ID of the card component.
 * @param {string} [link] - The URL to navigate to when the card is clicked.
 * @param {string} [imageSrc] - The URL of the image to display in the card.
 * @param {string} [imageAlt=""] - The alt text of the image.
 * @param {Array<JSX.Element>} [tags] - An array of JSX elements (should be either Tag or StatusLabel) to display in the card.
 * @param {Array<{ value: string; icon?: JSX.Element, testId?: string }>} [infos] - An array of info objects (icon & text) to display in the card.
 * @param {Array<JSX.Element>} [buttons] - An array of button elements to display in the card.
 * @param {ReactNode} [children] - Additional children elements to render in the card, after the main text.
 * @param {string} [className] - Additional class names to apply to the card.
 * @param {React.CSSProperties} [style] - Additional styles to apply to the card.
 * @param {React.ReactElement} [LinkComponent] - A custom Link component to use instead of the next Link.
 *
 * @returns {JSX.Element} The rendered Card component.
 */
export default function Card({
  heading,
  headingTestId,
  headingLevel = 3,
  text = "",
  textTestId,
  variant = "default",
  backgroundColor = "var(--color-black-5)",
  testId,
  link,
  imageSrc,
  imageAlt = "",
  tags,
  infos,
  buttons,
  children,
  className,
  style,
  LinkComponent,
}: Readonly<CardProps>): JSX.Element {
  const wrapperClasses = [`card--${variant ?? "default"}`];
  let itemCount = 1; // Texts are always present
  if (imageSrc) wrapperClasses.push("card--with-image");
  if (link) wrapperClasses.push("card--with-link");
  if (tags) {
    wrapperClasses.push("card--with-tags");
    itemCount++;
  }
  if (infos) itemCount++;
  if (buttons) itemCount++;

  return (
    <Wrapper
      $bgColor={backgroundColor}
      className={`${className} ${wrapperClasses.join(" ")}`}
      style={style}
      data-testid={testId}
    >
      {imageSrc && (
        <ImageWrapper>
          <WrapWithLink
            content={<Image src={imageSrc} alt={imageAlt} aria-hidden="true" />}
            link={link}
            focusable={false}
            LinkComponent={LinkComponent}
          />
        </ImageWrapper>
      )}
      <CardContent $itemCount={itemCount}>
        <Texts
          heading={heading}
          headingTestId={headingTestId}
          headingLevel={headingLevel}
          text={text}
          textTestId={textTestId}
          link={link}
          LinkComponent={LinkComponent}
        />
        {children && <ChildContainer>{children}</ChildContainer>}
        {infos && <Infos infos={infos} />}
        {tags && <Tags tags={tags} />}
        {buttons && <Buttons buttons={buttons} />}
      </CardContent>
    </Wrapper>
  );
}

// For all Containers the base (==mobile) styling is close to identical with the card--vertical styles,
// thus we only need to define the desktop styles for the default card variant
const TextContainer = styled.div`
  grid-column: 1;
  grid-row: 1;
  gap: var(--spacing-s);
  a {
    text-decoration-color: var(--color-black);
    &:not(:hover) {
      text-decoration: none;
    }
  }

  @media (min-width: ${breakpoints.m}) {
    .card--default & {
      grid-column: 1;
      grid-row: 1;
    }
  }
`;

const TagContainer = styled.div`
  display: flex;
  gap: var(--spacing-xs);
  grid-column: 1;
  grid-row: 1;
  order: -1;
  justify-content: flex-start;

  /* display the tags on top of the image */
  .card--with-image & {
    position: absolute;
    top: calc(0px - var(--spacing-layout-m));
  }

  @media (min-width: ${breakpoints.m}) {
    .card--default & {
      position: relative;
      top: 0;
      grid-column: 2;
      align-items: flex-start;
      justify-content: flex-end;
      margin-top: 0;
    }
  }
`;

const InfoContainer = styled.div`
  display: flex;
  flex-direction: column;
  grid-row: 2;
  gap: var(--spacing-3-xs);
  margin-right: auto;
  justify-content: space-evenly;
  font-size: var(--fontsize-body-s);

  @media (min-width: ${breakpoints.m}) {
    .card--default & {
      grid-row: 2;
    }
  }

  @media (min-width: ${breakpoints.l}) {
    .card--default & {
      grid-row: 2;
      flex-direction: row;
      gap: var(--spacing-l);
    }
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  grid-row: 3;
  width: 100%;
  gap: var(--spacing-xs);
  flex-direction: column;
  align-items: flex-end;
  > * {
    width: 100%;
  }

  @media (min-width: ${breakpoints.m}) {
    .card--default & {
      max-width: 100%;
      grid-column: 2;
      grid-row: 2;
      flex-direction: row;
      justify-content: flex-end;
      gap: var(--spacing-s);
      > * {
        width: auto;
      }
    }
  }
`;

const Text = styled.p`
  font-size: var(--fontsize-body-m);
  margin: 0;
`;

const Header = styled.h3`
  ${fontMedium};
  font-size: var(--fontsize-heading-s);
  margin: 0;
  .card--with-link a & {
    text-decoration: none;
    color: var(--color-black);
  }
`;

function Texts({
  heading,
  headingTestId,
  headingLevel,
  text,
  textTestId,
  link,
  LinkComponent,
}: Readonly<{
  heading: string;
  headingTestId?: string;
  headingLevel: number;
  text: string;
  textTestId?: string;
  link?: string;
  LinkComponent?: LinkComponent;
}>) {
  const headingElement = `h${headingLevel.toString()}` as ElementType;
  return (
    <TextContainer>
      <WrapWithLink
        content={
          <Header className="card__header" as={headingElement} data-testid={headingTestId ?? "card__heading"}>
            {heading}
          </Header>
        }
        link={link}
        LinkComponent={LinkComponent}
      />
      <Text data-testid={textTestId ?? "card__content"}>{text}</Text>
    </TextContainer>
  );
}

function Tags({ tags }: Readonly<{ tags?: JSX.Element[] }>) {
  if (!tags) return null;
  return <TagContainer data-testid="card__tags">{tags}</TagContainer>;
}

const InfoItem = styled(Flex).attrs({
  $gap: "2-xs",
  $alignItems: "center",
  $direction: "row",
})`
  font-size: var(--fontsize-body-s);
  margin-top: auto;
  p {
    margin: 0;
    font-size: var(--fontsize-body-s);
  }
`;

function Infos({
  infos,
}: Readonly<{
  infos?: { value: string; icon?: JSX.Element; testId?: string }[];
}>) {
  if (!infos) return null;
  return (
    <InfoContainer>
      {infos.map((info) => (
        <Info key={info.value} value={info.value} icon={info.icon} data-testid={info.testId} />
      ))}
    </InfoContainer>
  );
}

function Info({ value, icon, ...rest }: Readonly<{ value: string; icon?: JSX.Element }>) {
  return (
    <InfoItem {...rest}>
      {icon}
      <p>{value}</p>
    </InfoItem>
  );
}

function Buttons({ buttons }: Readonly<{ buttons?: JSX.Element[] }>) {
  if (!buttons) return null;
  return <ButtonContainer>{buttons}</ButtonContainer>;
}
