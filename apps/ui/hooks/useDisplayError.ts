import { type ApiError, getApiErrors } from "common/src/apolloUtils";
import { errorToast } from "common/src/common/toast";
import { type TFunction, useTranslation } from "next-i18next";

/// formatErrorMessage
/// this should not check for missing keys
/// reason: if the key is missing it's a bug
export function formatErrorMessage(t: TFunction, err: ApiError): string {
  if (err.code === "MUTATION_VALIDATION_ERROR") {
    const validation_code =
      "validation_code" in err
        ? err.validation_code
        : "generic_validation_error";
    return t(`errors:api.validation.${validation_code}`);
  }
  return t(`errors:api.${err.code}`);
}

export function useDisplayError() {
  const { t } = useTranslation();

  return function displayError(error: unknown) {
    const errs = getApiErrors(error);
    if (errs.length > 0) {
      const msgs = errs.map((e) => formatErrorMessage(t, e));
      for (const text of msgs) {
        errorToast({
          text,
        });
      }
    } else {
      errorToast({
        text: t("errors:general_error"),
      });
    }
  };
}
