import React from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FilterTags, StyledTag, ResetButton } from "common/src/tags";

/// Creates tags from the search params (uses react-router-dom)
/// TODO allow passing keys here that are not supposed to be shown / reset
/// TODO create a wrapper that allows us switching the router (next / react-router)
export function SearchTags({
  translateTag,
  hide = [],
}: {
  translateTag: (key: string, val: string) => string;
  hide?: string[];
}): JSX.Element {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();

  const handleDelete = (tag: { key: string; value: string }) => {
    const vals = new URLSearchParams(params);
    vals.delete(tag.key, tag.value);
    setParams(vals);
  };

  const handleReset = () => {
    const newParams = hide.reduce<typeof params>(
      (acc, s) => (params.get(s) ? { ...acc, [s]: params.get(s) } : acc),
      new URLSearchParams()
    );
    setParams(newParams);
  };

  const tags: { key: string; value: string }[] = [];
  params.forEach((value, key) =>
    !hide.includes(key) ? tags.push({ key, value }) : null
  );

  return (
    <FilterTags>
      {tags.map((tag) => (
        <StyledTag
          onDelete={() => handleDelete(tag)}
          key={`${tag.key}-${tag.value}`}
        >
          {translateTag(tag.key, tag.value)}
        </StyledTag>
      ))}
      {tags.length > 0 && (
        <ResetButton onClick={handleReset} onDelete={handleReset}>
          {t("common.clear")}
        </ResetButton>
      )}
    </FilterTags>
  );
}
