import React from "react";
import { useAuthState } from "../../../context/AuthStateContext";

type Props = {
  unitPk: number;
  serviceSectorPks: number[];
  permissionName: string;
  children: React.ReactNode;
  otherwise?: React.ReactNode;
};

const VisibleIfPermission = ({
  unitPk,
  serviceSectorPks,
  permissionName,
  children,
  otherwise,
}: Props): JSX.Element => {
  const { hasPermission } = useAuthState().authState;
  const permission = hasPermission(permissionName, unitPk, serviceSectorPks);

  return (
    <>
      {permission && children}
      {!permission && otherwise}
    </>
  );
};

const VisibleIfPermissionWrapper = (props: {
  unitPk?: number;
  serviceSectorPks: number[];
  permissionName: string;
  children: React.ReactNode;
  otherwise?: React.ReactNode;
}) => {
  const { unitPk } = props;

  if (!unitPk) {
    return null;
  }
  if (props.serviceSectorPks.length === 0) {
    return null;
  }

  return <VisibleIfPermission {...props} unitPk={unitPk} />;
};

export default VisibleIfPermissionWrapper;
