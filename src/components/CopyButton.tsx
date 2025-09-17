'use client';

import { useState } from 'react';

type Props = {
  text: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
};

export default function CopyButton({ text, label = 'コピー', copiedLabel = 'コピーしました', className }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy', err);
      setCopied(false);
    }
  }

  return (
    <button type="button" className={className} onClick={handleCopy} style={{ minWidth: 96 }}>
      {copied ? copiedLabel : label}
    </button>
  );
}
