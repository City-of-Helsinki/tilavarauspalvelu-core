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
export function SearchTags({ hide = [] }: { hide?: string[] }): JSX.Element {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const handleDelete = (tag: string) => {
    const vals = new URLSearchParams(params);
    vals.delete(tag);
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
  params.forEach((value, key) => tags.push({ key, value }));
  // TODO translate the tags t('key.${tag.key}', { value: tag.value })
  // Return empty div if no tags so there is no CLS
  // TODO should reserve space for one row of tags by default (less shift in the layout)
  return (
    <TagWrapper>
      {tags.map((tag) => (
        <StyledTag
          id={tag.key}
          onDelete={() => handleDelete(tag.key)}
          key={tag.key}
        >
          {tag.value}
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
