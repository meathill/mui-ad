'use client';

import { Dialog } from '@base-ui-components/react/dialog';
import { ArrowRight, Sparkle, X } from '@phosphor-icons/react';
import { useEffect, useMemo, useState } from 'react';
// biome-ignore lint/style/useImportType: default import needed for react-easy-crop
import Cropper from 'react-easy-crop';
import type { Product } from '@muiad/db';
import { Field, inputClass, inputMonoClass } from '@/components/ui/field';
import { apiFromConfig } from '@/lib/api';
import { arrayBufferToBlob, cropImageToBlob, type PixelArea } from '@/lib/image';
import { PROVIDER_LIST, type ImageProvider } from '@/lib/providers';
import { type ProviderId, useConfig } from '@/lib/store';

interface AIBannerComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  adId?: string;
  targetAspect?: number;
  onResult: (url: string) => void;
}

type Step = 'compose' | 'generating' | 'crop' | 'saving';

export function AIBannerComposer({ open, onOpenChange, product, adId, targetAspect, onResult }: AIBannerComposerProps) {
  const workerUrl = useConfig((s) => s.workerUrl);
  const apiKey = useConfig((s) => s.apiKey);
  const openaiKey = useConfig((s) => s.openaiKey);
  const googleKey = useConfig((s) => s.googleKey);

  const availableProviders = useMemo<ImageProvider[]>(() => {
    return PROVIDER_LIST.filter((p) => (p.id === 'openai' ? openaiKey : googleKey));
  }, [openaiKey, googleKey]);

  const [providerId, setProviderId] = useState<ProviderId>('openai');
  const [modelId, setModelId] = useState('');
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState('1024x1024');
  const [step, setStep] = useState<Step>('compose');
  const [error, setError] = useState('');

  const [originalBytes, setOriginalBytes] = useState<ArrayBuffer | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState<number | undefined>(targetAspect);
  const [croppedArea, setCroppedArea] = useState<PixelArea | null>(null);

  // Reset state on open + seed defaults from the selected product
  useEffect(() => {
    if (!open) return;
    const firstAvailable = availableProviders[0];
    if (firstAvailable) {
      setProviderId(firstAvailable.id);
      setModelId(firstAvailable.models[0]?.id ?? '');
    }
    setStep('compose');
    setError('');
    setOriginalBytes(null);
    setPreviewUrl(null);
    setCroppedArea(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setAspect(targetAspect);
    if (product) setPrompt(defaultPrompt(product));
  }, [open, product, availableProviders, targetAspect]);

  // Revoke preview blob URL on change/close
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const provider = PROVIDER_LIST.find((p) => p.id === providerId);
  const providerKey = providerId === 'openai' ? openaiKey : googleKey;
  const model = provider?.models.find((m) => m.id === modelId);

  async function handleGenerate() {
    if (!provider || !providerKey || !model) {
      setError('缺 provider key 或模型');
      return;
    }
    setStep('generating');
    setError('');
    try {
      const result = await provider.generate({ model: model.id, prompt, size }, providerKey);
      setOriginalBytes(result.bytes);
      const blob = arrayBufferToBlob(result.bytes, result.contentType);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setStep('crop');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStep('compose');
    }
  }

  async function handleSave() {
    if (!originalBytes || !previewUrl || !provider || !model) return;
    const api = apiFromConfig(workerUrl, apiKey);
    if (!api) return;
    setStep('saving');
    setError('');
    try {
      // Always upload the original model output.
      const originalBlob = arrayBufferToBlob(originalBytes, 'image/png');
      const originalFile = new File([originalBlob], 'original.png', { type: 'image/png' });
      const originalUpload = await api.uploads.create(originalFile);
      const originalKey = originalUpload.key;

      // If the user cropped, upload the cropped version too.
      let croppedKey: string | undefined;
      let finalUrl = originalUpload.url;
      let finalWidth: number | undefined;
      let finalHeight: number | undefined;

      if (croppedArea) {
        const croppedBlob = await cropImageToBlob(previewUrl, croppedArea, 'image/png');
        const croppedFile = new File([croppedBlob], 'cropped.png', { type: 'image/png' });
        const croppedUpload = await api.uploads.create(croppedFile);
        croppedKey = croppedUpload.key;
        finalUrl = croppedUpload.url;
        finalWidth = croppedArea.width;
        finalHeight = croppedArea.height;
      }

      await api.aiGenerations.create({
        provider: provider.id,
        model: model.id,
        prompt,
        originalKey,
        croppedKey,
        width: finalWidth,
        height: finalHeight,
        productId: product?.id,
        adId,
      });

      onResult(finalUrl);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStep('crop');
    }
  }

  const needsKeysHint = availableProviders.length === 0;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm transition-opacity data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[min(44rem,94vw)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-rule bg-paper shadow-[0_30px_80px_-40px_oklch(0.2_0.05_50/0.4)] outline-none transition data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0">
          <div className="flex items-center justify-between border-b border-rule/60 px-6 py-4">
            <div className="flex items-baseline gap-2">
              <Sparkle size={16} weight="fill" className="text-ember-deep" />
              <Dialog.Title className="font-serif text-xl tracking-tight">让 AI 生成 banner</Dialog.Title>
            </div>
            <Dialog.Close className="rounded-full p-1 text-ink-soft hover:bg-rule/40 hover:text-ink">
              <X size={16} />
            </Dialog.Close>
          </div>

          <div className="max-h-[70vh] overflow-y-auto p-6">
            {needsKeysHint ? (
              <div className="rounded-lg border border-ember/40 bg-ember/10 px-4 py-3 text-sm text-ink-soft">
                还没有配置任何 provider API key。去{' '}
                <a
                  href="/settings"
                  className="font-mono text-[12px] text-ember-deep underline-offset-4 hover:underline"
                >
                  /settings
                </a>{' '}
                填一个 OpenAI 或 Google key（BYOK，只存你浏览器 localStorage）。
              </div>
            ) : step === 'compose' || step === 'generating' ? (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Provider">
                    <select
                      value={providerId}
                      onChange={(e) => {
                        const next = e.target.value as ProviderId;
                        setProviderId(next);
                        const p = PROVIDER_LIST.find((pp) => pp.id === next);
                        setModelId(p?.models[0]?.id ?? '');
                      }}
                      className={inputClass}
                    >
                      {availableProviders.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Model">
                    <select value={modelId} onChange={(e) => setModelId(e.target.value)} className={inputClass}>
                      {provider?.models.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <Field label="Prompt">
                  <textarea
                    rows={6}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className={`${inputClass} font-mono text-[13px] leading-relaxed`}
                  />
                </Field>

                <Field label="输出尺寸" hint="OpenAI 固定 1024x1024 / 1024x1536 / 1536x1024；Gemini 默认 1024x1024">
                  <select value={size} onChange={(e) => setSize(e.target.value)} className={inputMonoClass}>
                    {(model?.sizes ?? ['1024x1024']).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </Field>

                {error && (
                  <p className="rounded-md bg-danger/10 px-4 py-2 font-mono text-xs text-danger-deep">{error}</p>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={step === 'generating' || !prompt.trim()}
                    className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-2.5 font-mono text-[12px] uppercase tracking-[0.18em] text-paper transition-colors hover:bg-ember-deep disabled:opacity-60"
                  >
                    {step === 'generating' ? '生成中…（10–60 秒）' : '生成'}
                    {step !== 'generating' && <ArrowRight size={12} weight="bold" />}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-ink-soft">
                  拖拽框调整裁剪范围，滚轮缩放。确定尺寸后点保存，原图和裁剪版都会存到 R2。
                </p>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft">锁定比例</span>
                  {[
                    { label: '自由', v: undefined },
                    { label: '1:1', v: 1 },
                    { label: '300×250', v: 300 / 250 },
                    { label: '728×90', v: 728 / 90 },
                    { label: '160×600', v: 160 / 600 },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setAspect(opt.v)}
                      className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${
                        aspect === opt.v
                          ? 'border-ember bg-ember/15 text-ember-deep'
                          : 'border-rule text-ink-soft hover:border-ink hover:text-ink'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div className="relative h-[50vh] overflow-hidden rounded-xl border border-rule/60 bg-ink">
                  {previewUrl && (
                    <Cropper
                      image={previewUrl}
                      crop={crop}
                      zoom={zoom}
                      aspect={aspect}
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={(_area, pixels) => setCroppedArea(pixels)}
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
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="flex-1 accent-ember-deep"
                  />
                </div>

                {error && (
                  <p className="rounded-md bg-danger/10 px-4 py-2 font-mono text-xs text-danger-deep">{error}</p>
                )}

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep('compose')}
                    className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft hover:text-ink"
                  >
                    ← 重新生成
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={step === 'saving'}
                    className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-2.5 font-mono text-[12px] uppercase tracking-[0.18em] text-paper transition-colors hover:bg-ember-deep disabled:opacity-60"
                  >
                    {step === 'saving' ? '保存中…' : '保存并使用'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function defaultPrompt(product: Product): string {
  return `Refined editorial-style banner artwork for "${product.name}".

About the product: ${product.description ?? 'A developer tool.'}

Style direction:
- Clean, minimal, premium aesthetic with a single strong focal element.
- Warm neutral background (off-white / paper), one ember-orange accent.
- New York Times editorial feel. No embedded text, words, or logos.
- AVOID generic AI aesthetics: no purple-blue gradients, no holographic slop,
  no neon on dark backgrounds.`;
}
