'use client';

import { Dialog } from '@base-ui-components/react/dialog';
import { useState } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = '确认',
  cancelLabel = '取消',
  destructive = false,
  onConfirm,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);

  async function handleConfirm() {
    setBusy(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }

  const confirmClass = destructive
    ? 'bg-danger text-paper hover:bg-danger-deep'
    : 'bg-ink text-paper hover:bg-ember-deep';

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm transition-opacity data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[min(28rem,90vw)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-rule bg-paper p-6 shadow-[0_30px_80px_-40px_oklch(0.2_0.05_50/0.4)] outline-none transition data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0">
          <Dialog.Title className="font-serif text-2xl tracking-tight">{title}</Dialog.Title>
          {description && (
            <Dialog.Description className="mt-3 text-sm leading-relaxed text-ink-soft">
              {description}
            </Dialog.Description>
          )}
          <div className="mt-8 flex justify-end gap-2">
            <Dialog.Close
              disabled={busy}
              className="rounded-full border border-rule px-5 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft hover:border-ink hover:text-ink disabled:opacity-50"
            >
              {cancelLabel}
            </Dialog.Close>
            <button
              type="button"
              disabled={busy}
              onClick={handleConfirm}
              className={`rounded-full px-5 py-2 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors disabled:opacity-60 ${confirmClass}`}
            >
              {busy ? '处理中…' : confirmLabel}
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
