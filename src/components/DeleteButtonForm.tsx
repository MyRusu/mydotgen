"use client";

import { useCallback } from 'react';
import { useFormStatus } from 'react-dom';

type Props = {
  id: string;
  action: (formData: FormData) => void | Promise<void>;
  label?: string;
  confirmMessage?: string;
  className?: string;
};

function SubmitBtn({ label, className }: { label?: string; className?: string }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className={className ?? 'btn'}>{pending ? '削除中…' : label ?? '削除'}</button>;
}

export default function DeleteButtonForm({ id, action, label, confirmMessage, className }: Props) {
  const onSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    const ok = window.confirm(confirmMessage ?? '削除しますか？');
    if (!ok) {
      e.preventDefault();
    }
  }, [confirmMessage]);

  return (
    <form action={action} onSubmit={onSubmit}>
      <input type="hidden" name="id" value={id} readOnly />
      <SubmitBtn label={label} className={className ?? 'btn btn-danger'} />
    </form>
  );
}
