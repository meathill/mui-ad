'use client';

// biome-ignore lint/style/useImportType: default import needed for react-easy-crop
import Cropper from 'react-easy-crop';
import type { BannerComposer } from './use-banner-composer';

const ASPECT_PRESETS: Array<{ label: string; v: number | undefined }> = [
  { label: '自由', v: undefined },
  { label: '1:1', v: 1 },
  { label: '300×250', v: 300 / 250 },
  { label: '728×90', v: 728 / 90 },
  { label: '160×600', v: 160 / 600 },
];

export function CropStep({ c }: { c: BannerComposer }) {
  const saving = c.step === 'saving';
  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-soft">拖拽框调整裁剪范围，滚轮缩放。确定尺寸后点保存，原图和裁剪版都会存到 R2。</p>
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft">锁定比例</span>
        {ASPECT_PRESETS.map((opt) => (
          <button
            key={opt.label}
            type="button"
            onClick={() => c.setAspect(opt.v)}
            className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${
              c.aspect === opt.v
                ? 'border-ember bg-ember/15 text-ember-deep'
                : 'border-rule text-ink-soft hover:border-ink hover:text-ink'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="relative h-[50vh] overflow-hidden rounded-xl border border-rule/60 bg-ink">
        {c.previewUrl && (
          <Cropper
            image={c.previewUrl}
            crop={c.crop}
            zoom={c.zoom}
            aspect={c.aspect}
            onCropChange={c.setCrop}
            onZoomChange={c.setZoom}
            onCropComplete={(_area, pixels) => c.setCroppedArea(pixels)}
          />
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft">缩放</span>
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={c.zoom}
          onChange={(e) => c.setZoom(Number(e.target.value))}
          className="flex-1 accent-ember-deep"
        />
      </div>

      {c.error && <p className="rounded-md bg-danger/10 px-4 py-2 font-mono text-xs text-danger-deep">{c.error}</p>}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => c.setStep('compose')}
          className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft hover:text-ink"
        >
          ← 重新生成
        </button>
        <button
          type="button"
          onClick={c.handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-2.5 font-mono text-[12px] uppercase tracking-[0.18em] text-paper transition-colors hover:bg-ember-deep disabled:opacity-60"
        >
          {saving ? '保存中…' : '保存并使用'}
        </button>
      </div>
    </div>
  );
}
