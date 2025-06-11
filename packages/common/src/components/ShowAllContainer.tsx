import React, { type HTMLAttributes, useEffect, useState } from "react";
import { IconAngleDown, IconAngleUp } from "hds-react";
import styled from "styled-components";
import { AutoGrid, Flex } from "../../styled";
import IconButton from "./IconButton";

export interface ShowAllContainerProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  // Label-text for the "show all" toggle-button
  showAllLabel: string;
  // Label-text for the "show less" toggle-button (optional, defaults to showAllLabel)
  showLessLabel?: string;
  // Maximum number of child elements shown unless "Show all" is toggled
  maximumNumber?: number;
  minWidth?: string;
  // All the elements to show, when "show all" is toggled
  children: JSX.Element[] | JSX.Element;
  // "Show all"-button alignment <"left" | "right> (optional, defaults to "right")
  alignButton?: "left" | "right";
  // Should the component return an <ul> element (optional, defaults to false)
  renderAsUl?: boolean;
  // Should the component be open on initial render
  initiallyOpen?: boolean;
  // Extra content to show next to the "Show all" button, e.g. checkbox filter
  extraShowMoreContent?: JSX.Element;
}

// styled component so we can use "as" to cast the html element
const Div = styled.div``;

function ShowAllContainer({
  showAllLabel,
  showLessLabel = showAllLabel,
  maximumNumber = 0,
  initiallyOpen = false,
  alignButton = "left",
  minWidth = "18rem",
  renderAsUl,
  extraShowMoreContent,
  children,
  ...rest
}: ShowAllContainerProps) {
  const [showAll, setShowAll] = useState<boolean>(false);
  // update the showAll state if the initiallyOpen prop changes
  useEffect(() => {
    setShowAll(initiallyOpen);
  }, [initiallyOpen]);

  const count = Array.isArray(children) ? children.length : 1;
  const content = showAll
    ? children
    : Array.isArray(children)
      ? children.slice(0, maximumNumber)
      : null;

  return (
    <Flex {...rest}>
      {count > 1 ? (
        <AutoGrid
          $minWidth={minWidth}
          as={renderAsUl ? "ul" : "div"}
          data-testid="show-all__content"
          className="ShowAllContainer__Content"
          aria-live="polite"
          aria-expanded={showAll}
        >
          {content}
        </AutoGrid>
      ) : (
        <Div
          as={renderAsUl ? "ul" : "div"}
          data-testid="show-all__content"
          className="ShowAllContainer__Content"
          aria-live="polite"
          aria-expanded={showAll}
        >
          {content}
        </Div>
      )}
      {count > maximumNumber && (
        <Flex
          $alignItems="center"
          $direction={`row${alignButton === "right" ? "-reverse" : ""}`}
          $justifyContent="space-between"
        >
          <IconButton
            label={showAll ? showLessLabel : showAllLabel}
            icon={showAll ? <IconAngleUp /> : <IconAngleDown />}
            onClick={() => setShowAll((prev) => !prev)}
            className="ShowAllContainer__ToggleButton"
            data-testid="show-all__toggle-button"
          />
          {extraShowMoreContent}
        </Flex>
      )}
    </Flex>
  );
}

export default ShowAllContainer;
