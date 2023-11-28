import React from "react";
import { Tag as HDSTag } from "hds-react";
import styled from "styled-components";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

// TODO move the Tags to separate file
const TagWrapper = styled.div`
  display: flex;
  gap: var(--spacing-s);
  flex-wrap: wrap;
`;

const StyledTag = styled(HDSTag)`
  border-radius: 30px;
  padding: 0 1em;
`;

const DeleteTag = styled(HDSTag)`
  background: transparent;
`;

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
  // TODO translate the tags t('key.${tag.key}', { value: tag.value })
  // Return empty div if no tags so there is no CLS
  // TODO should reserve space for one row of tags by default (less shift in the layout)
  // TODO
  // Lets think the tag name
  // for homeCity the value is a pk, but we need the tag to be a name (that is tied to the pk, not available during compile time)
  // for search string the value is the tag directly
  // (val: string | null) => homeCity.options.find((o) => String(o.value) === val)?.label ?? null
  // for selects the value is a pk, but the name
  // (val: string) => val
  // for other selects the values are pks, but the end result is translated enum (though it's tied to the select options)
  // (val: string | null) => options.find((o) => String(o.value) === val)?.label ?? null
  // so all of these would need to be functions?
  return (
    <TagWrapper>
      {tags.map((tag) => (
        <StyledTag
          id={tag.key}
          onDelete={() => handleDelete(tag)}
          key={tag.key}
        >
          {translateTag(tag.key, tag.value)}
        </StyledTag>
      ))}
      {tags.length > 0 && (
        <DeleteTag
          id="delete"
          onDelete={handleReset}
          theme={{ "--tag-background": "transparent" }}
        >
          {t("common.clear")}
        </DeleteTag>
      )}
    </TagWrapper>
  );
}
