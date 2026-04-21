'use client';

import { CloudArrowUp, Sparkle, X } from '@phosphor-icons/react';
import { type DragEvent, useRef, useState } from 'react';
import { apiFromConfig } from '@/lib/api';
import { useConfig } from '@/lib/store';

interface UploadInputProps {
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  maxBytes?: number;
  /** Show a text field next to the uploader for users who prefer pasting a URL. */
  allowUrlInput?: boolean;
  /** If provided, renders an "AI 生成" button that calls /api/ai/banner with these params. */
  aiGeneration?: { productId: string; styleHint?: string };
}

const DEFAULT_MAX = 5 * 1024 * 1024;

export function UploadInput({
  value,
  onChange,
  accept = 'image/*',
  maxBytes = DEFAULT_MAX,
  allowUrlInput = true,
  aiGeneration,
}: UploadInputProps) {
  const workerUrl = useConfig((s) => s.workerUrl);
  const apiKey = useConfig((s) => s.apiKey);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  async function generate() {
    if (!aiGeneration) return;
    const api = apiFromConfig(workerUrl, apiKey);
    if (!api) return;
    setError('');
    setGenerating(true);
    try {
      const res = await api.ai.generateBanner({
        productId: aiGeneration.productId,
        styleHint: aiGeneration.styleHint,
      });
      onChange(res.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setGenerating(false);
    }
  }

  async function upload(file: File) {
    setError('');
    if (file.size > maxBytes) {
      setError(
        `文件太大（${(file.size / 1024 / 1024).toFixed(1)} MB），上限 ${(maxBytes / 1024 / 1024).toFixed(0)} MB`,
      );
      return;
    }
    const api = apiFromConfig(workerUrl, apiKey);
    if (!api) {
      setError('配置丢失，请重新设置 API key');
      return;
    }
    setUploading(true);
    try {
      const res = await api.uploads.create(file);
      onChange(res.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setUploading(false);
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file) upload(file);
  }

  function handleDrop(e: DragEvent<HTMLElement>) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  function handleDragOver(e: DragEvent<HTMLElement>) {
    e.preventDefault();
    if (!dragOver) setDragOver(true);
  }

  function handleDragLeave(e: DragEvent<HTMLElement>) {
    e.preventDefault();
    setDragOver(false);
  }

  function clear() {
    onChange('');
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className="space-y-3">
      {aiGeneration && (
        <button
          type="button"
          onClick={generate}
          disabled={generating || uploading}
          className="inline-flex items-center gap-1.5 rounded-full border border-ember/50 bg-ember/5 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-ember-deep transition-colors hover:bg-ember/15 disabled:opacity-60"
        >
          <Sparkle size={12} weight="fill" />
          {generating ? 'AI 生成中…（10–30 秒）' : '✨ 让 AI 生成 banner'}
        </button>
      )}

      {value ? (
        <div className="flex items-start gap-4 rounded-xl border border-rule/60 bg-paper-deep/30 p-3">
          {/* biome-ignore lint/performance/noImgElement: raw img intentional for preview */}
          <img src={value} alt="preview" className="size-20 rounded-md border border-rule/60 bg-paper object-cover" />
          <div className="min-w-0 flex-1">
            <div className="truncate font-mono text-[11px] text-ink-soft" title={value}>
              {value.replace(/^https?:\/\//, '')}
            </div>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="rounded-full border border-rule px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft hover:border-ink hover:text-ink"
              >
                替换
              </button>
              <button
                type="button"
                onClick={clear}
                className="inline-flex items-center gap-1 rounded-full border border-rule px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft hover:border-danger-deep hover:text-danger-deep"
              >
                <X size={10} /> 清除
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
            dragOver
              ? 'border-ember bg-ember/5'
              : 'border-rule bg-paper-deep/20 hover:border-ink/50 hover:bg-paper-deep/40'
          }`}
        >
          <CloudArrowUp size={28} className={dragOver ? 'text-ember-deep' : 'text-ink-soft'} />
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">
            {uploading ? '上传中…' : '拖拽图片到这里，或点击选择'}
          </div>
          <div className="font-mono text-[10px] text-ink-soft/60">
            JPG / PNG / WEBP / GIF / AVIF · 最大 {(maxBytes / 1024 / 1024).toFixed(0)} MB
          </div>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && <p className="rounded-md bg-danger/10 px-3 py-2 font-mono text-xs text-danger-deep">{error}</p>}

      {allowUrlInput && (
        <details className="text-xs text-ink-soft">
          <summary className="cursor-pointer font-mono uppercase tracking-[0.18em]">或粘贴 URL</summary>
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://…"
            className="mt-2 w-full rounded-lg border border-rule bg-paper px-3 py-2 font-mono text-xs focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/20"
          />
        </details>
      )}
    </div>
  );
}
