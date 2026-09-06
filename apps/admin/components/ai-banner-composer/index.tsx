'use client';

import { Dialog } from '@base-ui-components/react/dialog';
import { Sparkle, X } from '@phosphor-icons/react';
import { ComposeStep } from './compose-step';
import { CropStep } from './crop-step';
import { useBannerComposer, type AIBannerComposerProps } from './use-banner-composer';

export type { AIBannerComposerProps };

export function AIBannerComposer(props: AIBannerComposerProps) {
  const { open, onOpenChange } = props;
  const c = useBannerComposer(props);
  const composing = c.step === 'compose' || c.step === 'generating';

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
            {c.needsKeysHint ? (
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
            ) : composing ? (
              <ComposeStep c={c} />
            ) : (
              <CropStep c={c} />
            )}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
