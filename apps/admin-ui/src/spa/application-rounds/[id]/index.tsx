import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { errorToast } from "common/src/common/toast";
import { UserPermissionChoice, useApplicationRoundQuery } from "@gql/gql-types";
import Loader from "@/component/Loader";
import { Review } from "./review";
import { useCheckPermission } from "@/hooks";
import { base64encode, filterNonNullable } from "common/src/helpers";
import { isApplicationRoundInProgress } from "@/helpers";

function ApplicationRound({ pk }: { pk: number }): JSX.Element {
  const { t } = useTranslation();
  const [isInProgress, setIsInProgress] = useState(false);

  const id = base64encode(`ApplicationRoundNode:${pk}`);
  const isValid = pk > 0;

  const { data, loading, refetch } = useApplicationRoundQuery({
    skip: !isValid,
    variables: { id },
    pollInterval: isInProgress ? 10000 : 0,
    onError: () => {
      errorToast({ text: t("errors.errorFetchingData") });
    },
  });
  const { applicationRound } = data ?? {};
  const units = filterNonNullable(
    applicationRound?.reservationUnits.map((x) => x.unit?.pk)
  );
  const { hasPermission: canView } = useCheckPermission({
    units,
    permission: UserPermissionChoice.CanViewApplications,
  });
  const { hasPermission: canManage } = useCheckPermission({
    units,
    permission: UserPermissionChoice.CanManageApplications,
  });
  const hasPermission = canView || canManage;

  // NOTE: useEffect works, onCompleted does not work with refetch
  useEffect(() => {
    if (data) {
      if (isApplicationRoundInProgress(data.applicationRound)) {
        setIsInProgress(true);
      } else {
        setIsInProgress(false);
      }
    }
  }, [data]);

  if (loading) {
    return <Loader />;
  }

  if (!applicationRound) {
    return <div>{t("errors.applicationRoundNotFound")}</div>;
  }

  if (!hasPermission) {
    return <div>{t("errors.noPermission")}</div>;
  }

  return <Review applicationRound={applicationRound} refetch={refetch} />;
}

type IParams = {
  applicationRoundId: string;
};

function ApplicationRoundRouted(): JSX.Element | null {
  const { t } = useTranslation();
  const { applicationRoundId } = useParams<IParams>();

  const pk = Number(applicationRoundId);
  if (pk > 0) {
    return <ApplicationRound pk={pk} />;
  }

  return <div>{t("errors.router.invalidApplicationRoundNumber")}</div>;
}

export default ApplicationRoundRouted;
