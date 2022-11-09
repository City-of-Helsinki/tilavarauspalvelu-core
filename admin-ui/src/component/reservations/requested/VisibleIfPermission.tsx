import React from "react";
import { useAuthState } from "../../../context/AuthStateContext";

type Props = {
  unitPk: number;
  serviceSectorPk?: number;
  permissionName: string;
  children: JSX.Element | JSX.Element[];
  otherwise?: JSX.Element | JSX.Element[];
};

const VisibleIfPermission = ({
  unitPk,
  serviceSectorPk,
  permissionName,
  children,
  otherwise,
}: Props): JSX.Element => {
  const { hasPermission } = useAuthState().authState;
  const permission = hasPermission(permissionName, unitPk, serviceSectorPk);

  return (
    <>
      {permission && children}
      {!permission && otherwise}
    </>
  );
};

export default VisibleIfPermission;
