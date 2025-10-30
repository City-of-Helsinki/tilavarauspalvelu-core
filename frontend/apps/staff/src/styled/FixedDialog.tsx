import React from "react";
import { Dialog } from "hds-react";
import styled from "styled-components";
import { fixedDialogCss, type FixedDialogProps } from "ui/src/styled/fixedDialog";

/// Wrapper around Dialog export issues (monorepo), duplicated in customer ui
export const FixedDialog = styled(Dialog)<FixedDialogProps>`
  ${fixedDialogCss}
`;
