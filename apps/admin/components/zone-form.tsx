'use client';

import { Field, inputClass, inputMonoClass } from '@/components/ui/field';

export const ZONE_SIZE_PRESETS: Array<{ label: string; w: number; h: number }> = [
  { label: '300×250 矩形', w: 300, h: 250 },
  { label: '728×90 横幅', w: 728, h: 90 },
  { label: '160×600 长条', w: 160, h: 600 },
  { label: '320×50 移动', w: 320, h: 50 },
];

export interface ZoneFormValues {
  name: string;
  siteUrl: string;
  width: number;
  height: number;
  category: string;
  description: string;
  tags: string;
  audience: string;
}

/** 广告位新建/编辑共用的名称/站点/尺寸/marketplace 字段。提交与删除逻辑留在各页。 */
export function ZoneForm({
  values,
  onPatch,
  marketplaceHint,
}: {
  values: ZoneFormValues;
  onPatch: (patch: Partial<ZoneFormValues>) => void;
  marketplaceHint: string;
}) {
  return (
    <>
      <Field label="名称" hint="给自己看的识别名，比如 ‘博客侧边栏’">
        <input
          required
          value={values.name}
          onChange={(e) => onPatch({ name: e.target.value })}
          className={inputClass}
        />
      </Field>

      <Field label="所属站点 URL">
        <input
          required
          type="url"
          value={values.siteUrl}
          onChange={(e) => onPatch({ siteUrl: e.target.value })}
          placeholder="https://yourblog.dev"
          className={inputMonoClass}
        />
      </Field>

      <div>
        <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">尺寸</label>
        <div className="flex flex-wrap gap-2">
          {ZONE_SIZE_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => onPatch({ width: p.w, height: p.h })}
              className={`rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors ${
                values.width === p.w && values.height === p.h
                  ? 'border-ember bg-ember/15 text-ember-deep'
                  : 'border-rule text-ink-soft hover:border-ink hover:text-ink'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            type="number"
            min={1}
            required
            value={values.width}
            onChange={(e) => onPatch({ width: Number(e.target.value) })}
            className="w-28 rounded-lg border border-rule bg-paper px-3 py-2 font-mono text-sm focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/20"
          />
          <span className="self-center font-mono text-ink-soft">×</span>
          <input
            type="number"
            min={1}
            required
            value={values.height}
            onChange={(e) => onPatch({ height: Number(e.target.value) })}
            className="w-28 rounded-lg border border-rule bg-paper px-3 py-2 font-mono text-sm focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/20"
          />
          <span className="self-center font-mono text-xs text-ink-soft">px</span>
        </div>
      </div>

      <div className="rounded-xl border border-rule/60 bg-paper-deep/20 p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ember-deep">marketplace</p>
        <p className="mt-1 text-sm text-ink-soft">{marketplaceHint}</p>
        <div className="mt-5 space-y-5">
          <Field label="分类" hint="blog · docs · tool · newsletter · playground ...">
            <input
              value={values.category}
              onChange={(e) => onPatch({ category: e.target.value })}
              placeholder="blog"
              className={inputMonoClass}
            />
          </Field>
          <Field label="简介" hint="一两句话说清楚这个位置适合投什么">
            <textarea
              rows={2}
              value={values.description}
              onChange={(e) => onPatch({ description: e.target.value })}
              className={`${inputClass} resize-none`}
            />
          </Field>
          <Field label="标签" hint="逗号分隔，例如：ai, devtools, typescript">
            <input
              value={values.tags}
              onChange={(e) => onPatch({ tags: e.target.value })}
              placeholder="ai,devtools"
              className={inputMonoClass}
            />
          </Field>
          <Field label="目标受众" hint="比如：自托管 AI 工具的独立开发者">
            <input
              value={values.audience}
              onChange={(e) => onPatch({ audience: e.target.value })}
              className={inputClass}
            />
          </Field>
        </div>
      </div>
    </>
  );
}
