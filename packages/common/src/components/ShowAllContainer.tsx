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
  // "Show all"-button alignment <"left" | "center" | "right> (optional, defaults to "right")
  alignButton?: "left" | "right";
  // Should the component return an <ul> element (optional, defaults to false)
  renderAsUl?: boolean;
  initiallyOpen?: boolean;
}

// styled component so we can use "as" to cast the html element
const Div = styled.div``;

/*
 * @param {string} showAllLabel - Label-text for the "Show all"-button
 * @param {string} showLessLabel - Label-text for the "show less" toggle-button (optional, defaults to showAllLabel)
 * @param {number} maximumNumber - Maximum number of child elements shown unless "Show all" is clicked (optional, defaults to 0)
 * @param {boolean} initiallyOpen - Should the component be open on initial render (optional, defaults to false)
 * @param {"left" | "right" | "center"} alignButton - "Show all"-button alignment <"left" | "center" | "right> (optional, defaults to "right")
 * @param {JSX.Element[] | JSX.Element} items - All the elements to show, when "show all" is toggled
 * @param (boolean) [renderAsUl] - Should the component return an <ul> element (optional, defaults to false)
 * @returns {JSX.Element} A container which renders `maximumNumber` of items followed by a "Show all" button. The
 * button text is defined via `showAllLabel` (and optionally `showLessLabel` if the text should change upon toggle).
 * The button toggles between showing all `items` and showing only the amount defined by `maximumNumber`.
 * Using `maximumNumber=0` (or omitting maximumNumber) results in a button which toggles the visibility of the entire content.
 */
function ShowAllContainer({
  showAllLabel,
  showLessLabel = showAllLabel,
  maximumNumber = 0,
  initiallyOpen = false,
  alignButton = "left",
  minWidth = "18rem",
  renderAsUl,
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
          $direction="row"
          $justifyContent={alignButton === "right" ? "flex-end" : "flex-start"}
        >
          <IconButton
            label={showAll ? showLessLabel : showAllLabel}
            icon={showAll ? <IconAngleUp /> : <IconAngleDown />}
            onClick={() => setShowAll((prev) => !prev)}
            className="ShowAllContainer__ToggleButton"
            data-testid="show-all__toggle-button"
          />
        </Flex>
      )}
    </Flex>
  );
}

export default ShowAllContainer;
