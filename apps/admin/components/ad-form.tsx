'use client';

import type { ReactNode } from 'react';
import type { Zone } from '@muiad/db';
import { Field, inputClass, inputMonoClass } from '@/components/ui/field';
import { UploadInput } from '@/components/ui/upload-input';

export interface AdFieldValues {
  title: string;
  content: string;
  imageUrl: string;
  linkUrl: string;
  weight: number;
}

/** 广告新建/编辑共用的标题/文案/ banner /落地页/权重字段。产品选择与提交逻辑留在各页。 */
export function AdFields({
  values,
  onPatch,
  bannerHint,
  bannerExtra,
  composer,
}: {
  values: AdFieldValues;
  onPatch: (patch: Partial<AdFieldValues>) => void;
  bannerHint: string;
  bannerExtra?: ReactNode;
  composer?: ReactNode;
}) {
  return (
    <>
      <Field label="标题" hint="一行简短的卖点，出现在广告卡片顶部">
        <input
          required
          value={values.title}
          onChange={(e) => onPatch({ title: e.target.value })}
          className={inputClass}
        />
      </Field>

      <Field label="文案" hint="可选，小字描述">
        <textarea
          value={values.content}
          onChange={(e) => onPatch({ content: e.target.value })}
          rows={3}
          className={`${inputClass} resize-none`}
        />
      </Field>

      <Field label="Banner 图片" hint={bannerHint}>
        <UploadInput value={values.imageUrl} onChange={(url) => onPatch({ imageUrl: url })} extraAction={bannerExtra} />
      </Field>

      {composer}

      <Field label="落地页 URL">
        <input
          required
          type="url"
          value={values.linkUrl}
          onChange={(e) => onPatch({ linkUrl: e.target.value })}
          className={inputMonoClass}
        />
      </Field>

      <Field label="权重" hint="同一广告位下，高权重被选中概率更大；默认 1">
        <input
          type="number"
          min={1}
          required
          value={values.weight}
          onChange={(e) => onPatch({ weight: Number(e.target.value) })}
          className={`${inputMonoClass} w-32`}
        />
      </Field>
    </>
  );
}

/** 广告位多选卡片。new 页只列 active 并显示 host，edit 页全列并显示 status。 */
export function ZonePicker({
  title,
  zones,
  selected,
  onToggle,
  meta,
  emptyHint,
}: {
  title: string;
  zones: Zone[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  meta: (z: Zone) => ReactNode;
  emptyHint: ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">{title}</label>
      {zones.length === 0 ? (
        emptyHint
      ) : (
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {zones.map((z) => (
            <label
              key={z.id}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${
                selected.has(z.id) ? 'border-ember bg-ember/10' : 'border-rule hover:border-ink/60'
              }`}
            >
              <input
                type="checkbox"
                checked={selected.has(z.id)}
                onChange={() => onToggle(z.id)}
                className="accent-ember-deep"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm">{z.name}</div>
                <div className="font-mono text-[10px] text-ink-soft">
                  {z.width}×{z.height} · {meta(z)}
                </div>
              </div>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
