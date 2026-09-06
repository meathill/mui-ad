'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Product } from '@muiad/db';
import { arrayBufferToBlob, cropImageToBlob, type PixelArea } from '@/lib/image';
import { PROVIDER_LIST, type ImageProvider } from '@/lib/providers';
import { type ProviderId, useConfig } from '@/lib/store';
import { errMsg } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import { defaultPrompt } from './prompt';

export interface AIBannerComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  adId?: string;
  targetAspect?: number;
  onResult: (url: string) => void;
}

export type Step = 'compose' | 'generating' | 'crop' | 'saving';

export function useBannerComposer({
  open,
  onOpenChange,
  product,
  adId,
  targetAspect,
  onResult,
}: AIBannerComposerProps) {
  const api = useApi();
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

  // 打开时重置状态，并按所选产品播默认 prompt
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

  // preview blob URL 随变随释放
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
      setError(errMsg(e));
      setStep('compose');
    }
  }

  async function handleSave() {
    if (!originalBytes || !previewUrl || !provider || !model) return;
    setStep('saving');
    setError('');
    try {
      // 永远先传原图。
      const originalBlob = arrayBufferToBlob(originalBytes, 'image/png');
      const originalFile = new File([originalBlob], 'original.png', { type: 'image/png' });
      const originalUpload = await api.uploads.create(originalFile);
      const originalKey = originalUpload.key;

      // 裁过就再传裁剪版。
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
      setError(errMsg(e));
      setStep('crop');
    }
  }

  function selectProvider(next: ProviderId) {
    setProviderId(next);
    const p = PROVIDER_LIST.find((pp) => pp.id === next);
    setModelId(p?.models[0]?.id ?? '');
  }

  return {
    availableProviders,
    provider,
    providerId,
    model,
    modelId,
    setModelId,
    prompt,
    setPrompt,
    size,
    setSize,
    step,
    setStep,
    error,
    previewUrl,
    crop,
    setCrop,
    zoom,
    setZoom,
    aspect,
    setAspect,
    setCroppedArea,
    needsKeysHint: availableProviders.length === 0,
    selectProvider,
    handleGenerate,
    handleSave,
  };
}

export type BannerComposer = ReturnType<typeof useBannerComposer>;
