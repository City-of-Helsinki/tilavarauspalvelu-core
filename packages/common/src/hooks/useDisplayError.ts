import { type ApiError, getApiErrors } from "../apolloUtils";
import { errorToast } from "../common/toast";
import { type TFunction, useTranslation } from "next-i18next";

/// formatErrorMessage
/// this should not check for missing keys
/// reason: if the key is missing it's a bug
export function formatErrorMessage(t: TFunction, err: ApiError): string {
  if (err.code === "MUTATION_VALIDATION_ERROR") {
    const validation_code =
      "validation_code" in err && typeof err.validation_code === "string" ? err.validation_code : null;
    const trCode = validation_code ?? "generic_validation_error";
    return t(`errors:api.validation.${trCode}`);
  }
  return t(`errors:api.${err.code}`);
}

/// useDisplayError
/// convert backend error code to user friendly message and toast it
/// only usable for mutations
/// you can pass the error object directly from the catch block
/// NOTE don't use this for queries (they don't return an error code)
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
