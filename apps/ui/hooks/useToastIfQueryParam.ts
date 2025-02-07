import { useEffect } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { successToast } from "common/src/common/toast";

export function useToastIfQueryParam({
  key,
  successMessage,
}: {
  key: string | string[];
  successMessage: string | (() => string);
}) {
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    const removeTimeUpdatedParam = () => {
      // TODO this could be changed to useSearchParams instead of router
      const { pathname, query } = router;
      // NOTE ParsedQuery is a Record<string, string>
      const params = new URLSearchParams(query as Record<string, string>);
      if (Array.isArray(key)) {
        for (const k of key) {
          params.delete(k);
        }
      } else {
        params.delete(key);
      }

      router.replace(
        {
          pathname,
          query: params.toString(),
        },
        undefined,
        {
          shallow: true,
          scroll: false,
        }
      );
    };
    const q = router.query;

    const text =
      typeof successMessage === "string" ? successMessage : successMessage();
    if (Array.isArray(key)) {
      if (key.every((k) => q[k])) {
        successToast({
          text,
        });
        removeTimeUpdatedParam();
      }
    } else if (q[key]) {
      successToast({
        text,
      });
      removeTimeUpdatedParam();
    }
  }, [router, t, key, successMessage]);
}
