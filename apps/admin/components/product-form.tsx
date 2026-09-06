'use client';

import { Field, inputClass, inputMonoClass } from '@/components/ui/field';

export interface ProductFieldValues {
  name: string;
  url: string;
  description: string;
}

/** 产品新建/编辑共用的名称/URL/描述字段。提交与删除逻辑留在各页。 */
export function ProductFields({
  values,
  onPatch,
  nameHint,
  descHint,
}: {
  values: ProductFieldValues;
  onPatch: (patch: Partial<ProductFieldValues>) => void;
  nameHint?: string;
  descHint?: string;
}) {
  return (
    <>
      <Field label="名称" hint={nameHint}>
        <input
          required
          value={values.name}
          onChange={(e) => onPatch({ name: e.target.value })}
          className={inputClass}
        />
      </Field>
      <Field label="产品 URL">
        <input
          required
          type="url"
          value={values.url}
          onChange={(e) => onPatch({ url: e.target.value })}
          placeholder="https://foo.dev"
          className={inputMonoClass}
        />
      </Field>
      <Field label="描述" hint={descHint}>
        <textarea
          value={values.description}
          onChange={(e) => onPatch({ description: e.target.value })}
          rows={4}
          className={`${inputClass} resize-none`}
        />
      </Field>
    </>
  );
}
