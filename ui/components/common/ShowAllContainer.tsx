import React, { Children, useState } from "react";
import { IconAngleDown, IconAngleUp } from "hds-react";
import styled from "styled-components";
import { fontMedium } from "common/src/common/typography";
import IconButton from "./IconButton";

interface ShowAllContainerProps {
  // Label-text for the "show all" toggle-button
  showAllLabel: string;
  // Label-text for the "show less" toggle-button (optional, defaults to showAllLabel)
  showLessLabel?: string;
  // Maximum number of child elements shown unless "Show all" is toggled
  maxLength: number;
  // All the elements to show, when "show all" is toggled
  children: React.ReactNode;
  // "Show all"-button alignment <"left" | "center" | "right> (optional, defaults to "right")
  alignButton?: "left" | "center" | "right";
  // Select which --spacing-variable to use as the margin between content and toggle-button
  buttonTopMargin?: "2-xs" | "xs" | "s" | "m" | "l" | "xl" | "xxl";
  [rest: string]: unknown; // any other params, like id/aria/testing/etc
}

/*
 * @param {string} label - Label-text for the "Show all"-button
 * @param {number} maxLength - Maximum number of child elements shown unless "Show all" is clicked
 * @param {React.ReactNode} children - child elements
 * @returns {JSX.Element} A container which renders  contained list
 */
const ShowAllContainer = ({
  showAllLabel,
  showLessLabel = showAllLabel,
  maxLength,
  alignButton = "right",
  buttonTopMargin = "m",
  children,
  ...rest
}: ShowAllContainerProps) => {
  const [showAll, setShowAll] = useState(false);
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
  const buttonMarginCSS = `--spacing-${buttonTopMargin}`;
  const ToggleButtonContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: ${buttonAlignCSS};
    margin-top: var(${buttonMarginCSS});
    color: var(--color-black) !important;
    ${fontMedium}
  `;
  return (
    <>
      <div {...rest}>
        {showAll
          ? children
          : Children.map(
              children,
              (child, index) => index < maxLength && child
            )}
      </div>
      {Children.count(children) > maxLength && (
        <ToggleButtonContainer>
          <IconButton
            label={showAll ? showLessLabel : showAllLabel}
            icon={showAll ? <IconAngleUp /> : <IconAngleDown />}
            onClick={() => setShowAll((prev) => !prev)}
          />
        </ToggleButtonContainer>
      )}
    </>
  );
};

export default ShowAllContainer;
