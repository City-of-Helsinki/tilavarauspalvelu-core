import styled from "styled-components";
import { Link } from "react-router-dom";
import { ButtonCss, ButtonStyleProps } from "common/styles/buttonCss";

/// @brief looks like a button but is a link
/// @desc why? because nesting buttons and links is invalid html and HDS doesn't include this
/// Looks like a HDS button (should have all the same styles)
/// This requires react-router-dom (no next/link support yet)
/// Differences to HDS: secondary is black themed since we don't use the standard light blue
/// @param variant: 'primary' | 'secondary'
/// @param size: 'normal' | 'large'
export const ButtonLikeLink = styled(Link)<ButtonStyleProps>`
  ${ButtonCss}
`;
