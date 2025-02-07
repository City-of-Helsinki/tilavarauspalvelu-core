import React, { Children, useEffect, useState } from "react";
import { IconAngleDown, IconAngleUp } from "hds-react";
import styled from "styled-components";
import { fontMedium } from "../common/typography";
import IconButton from "./IconButton";

export interface ShowAllContainerProps {
  // Label-text for the "show all" toggle-button
  showAllLabel: string;
  // Label-text for the "show less" toggle-button (optional, defaults to showAllLabel)
  showLessLabel?: string;
  // Maximum number of child elements shown unless "Show all" is toggled
  maximumNumber: number;
  // All the elements to show, when "show all" is toggled
  children: React.ReactNode;
  // "Show all"-button alignment <"left" | "center" | "right> (optional, defaults to "right")
  alignButton?: "left" | "center" | "right";
  // Should the component return an <ul> element (optional, defaults to false)
  renderAsUl?: boolean;
  initiallyOpen?: boolean;
  [rest: string]: unknown; // any other params, like id/aria/testing/etc
}

const ToggleButtonContainer = styled.div<{
  $buttonAlign: string;
  $topMargin: string;
}>`
  display: flex;
  align-items: center;
  justify-content: ${(props) => props.$buttonAlign};
  margin-top: ${(props) => props.$topMargin};
  ${fontMedium}
`;

/*
 * @param {string} showAllLabel - Label-text for the "Show all"-button
 * @param {string} showLessLabel - Label-text for the "show less" toggle-button (optional, defaults to showAllLabel)
 * @param {number} maximumNumber - Maximum number of child elements shown unless "Show all" is clicked (optional, defaults to 0)
 * @param {boolean} initiallyOpen - Should the component be open on initial render (optional, defaults to false)
 * @param {"left" | "right" | "center"} alignButton - "Show all"-button alignment <"left" | "center" | "right> (optional, defaults to "right")
 * @param {React.ReactNode} children - All the elements to show, when "show all" is toggled
 * @param (boolean) [renderAsUl] - Should the component return an <ul> element (optional, defaults to false)
 * @returns {JSX.Element} A container which renders `maximumNumber` of children followed by a "Show all" button. The
 * button text is defined via `showAllLabel` (and optionally `showLessLabel` if the text should change upon toggle).
 * The button toggles between showing all `children` and showing only the amount defined by `maximumNumber`.
 * Using `maximumNumber=0` (or omitting maximumNumber) results in a button which toggles the visibility of the entire content.
 */
const ShowAllContainer = ({
  showAllLabel,
  showLessLabel = showAllLabel,
  maximumNumber = 0,
  initiallyOpen = false,
  alignButton = "left",
  renderAsUl,
  children,
  ...rest
}: ShowAllContainerProps) => {
  const [showAll, setShowAll] = useState<boolean>(false);
  let buttonAlignCSS: string;
  switch (alignButton) {
    case "left":
      buttonAlignCSS = "flex-start";
      break;
    case "center":
      buttonAlignCSS = "center";
      break;
    default:
      buttonAlignCSS = "flex-end";
  }

  // update the showAll state if the initiallyOpen prop changes
  useEffect(() => {
    setShowAll(initiallyOpen);
  }, [initiallyOpen]);

  return (
    <div {...rest}>
      {renderAsUl ? (
        <ul
          data-testid="show-all__content"
          className="ShowAllContainer__Content"
        >
          {showAll
            ? children
            : Children.map(
                children,
                (child, index) => index < maximumNumber && child
              )}
        </ul>
      ) : (
        <div
          data-testid="show-all__content"
          className="ShowAllContainer__Content"
        >
          {showAll
            ? children
            : Children.map(
                children,
                (child, index) => index < maximumNumber && child
              )}
        </div>
      )}
      {Children.count(children) > maximumNumber && (
        <ToggleButtonContainer
          $buttonAlign={buttonAlignCSS}
          $topMargin={maximumNumber ? "var(--spacing-m)" : "0"}
        >
          <IconButton
            label={showAll ? showLessLabel : showAllLabel}
            icon={showAll ? <IconAngleUp /> : <IconAngleDown />}
            onClick={() => setShowAll((prev) => !prev)}
            className="ShowAllContainer__ToggleButton"
            data-testid="show-all__toggle-button"
          />
        </ToggleButtonContainer>
      )}
    </div>
  );
};

export default ShowAllContainer;
