import React from "react";
import { Dialog } from "hds-react";
import styled from "styled-components";
import { fixedDialogCss } from "common/styled/fixedDialog";
import type { FixedDialogProps } from "common/styled/fixedDialog";

/// Wrapper around Dialog export issues (monorepo), duplicated in customer ui
export const FixedDialog = styled(Dialog)<FixedDialogProps>`
  ${fixedDialogCss}
`;
