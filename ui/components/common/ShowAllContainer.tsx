import React, { Children, useState } from "react";
import { IconAngleDown, IconAngleUp } from "hds-react";
import IconButton from "./IconButton";

interface ShowAllContainerProps {
  // Label-text for the "Show all"-button
  showAllLabel: string;
  // Label-text for the "Show less"-button
  showLessLabel?: string;
  // Maximum number of child elements shown unless "Show all" is clicked
  maxLength: number;
  children: React.ReactNode;
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
  children,
}: ShowAllContainerProps) => {
  const [showAll, setShowAll] = useState(false);
  return (
    <div className="show-all-container">
      <div className="show-all-container__items">
        {showAll
          ? children
          : Children.map(
              children,
              (child, index) => index < maxLength && child
            )}
      </div>
      <IconButton
        label={showAll ? showLessLabel : showAllLabel}
        icon={showAll ? <IconAngleUp /> : <IconAngleDown />}
        onClick={() => setShowAll((prev) => !prev)}
        className="show-all-container__toggle-button"
      />
    </div>
  );
};

export default ShowAllContainer;
