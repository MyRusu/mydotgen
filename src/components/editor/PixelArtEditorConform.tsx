"use client";

import { useEffect, useState } from 'react';
import { useForm, conform } from '@conform-to/react';
import { getFieldsetConstraint, parseWithZod } from '@conform-to/zod';
import PixelArtEditor from '@/components/editor/PixelArtEditor';
import { PixelArtEditorFormSchema } from '@/lib/schemas/forms/pixelArtEditor';

type ServerAction = (prevState: unknown, formData: FormData) => Promise<any>;

export type PixelArtEditorConformProps = {
  initial: { id?: string; title: string; size: 16 | 32 | 64; pixels: number[] };
  action: ServerAction;
};

export default function PixelArtEditorConform({ initial, action }: PixelArtEditorConformProps) {
  const [editorState, setEditorState] = useState(initial);

  // Conform setup
  const [form, fields] = useForm({
    id: 'pixel-art-editor',
    constraint: getFieldsetConstraint(PixelArtEditorFormSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: PixelArtEditorFormSchema });
    },
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
  });

  // keep hidden inputs in sync with editor state
  useEffect(() => {
    // no-op; editorState is updated from PixelArtEditor via onStateChange
  }, [editorState]);

  return (
    <form id={form.id} onSubmit={form.onSubmit} action={action} noValidate>
      <PixelArtEditor
        id={initial.id}
        title={initial.title}
        size={initial.size}
        pixels={initial.pixels}
        onStateChange={(s) => setEditorState(s)}
        hideSaveButton
      />

      {/* hidden fields bound to Conform & zod schema */}
      {editorState.id ? (
        <input {...conform.input(fields.id)} type="hidden" value={editorState.id} readOnly />
      ) : null}
      <input {...conform.input(fields.title)} type="hidden" value={editorState.title} readOnly />
      <input {...conform.input(fields.size)} type="hidden" value={editorState.size} readOnly />
      <input
        {...conform.input(fields.pixels)}
        type="hidden"
        value={JSON.stringify(editorState.pixels)}
        readOnly
      />

      {/* error summary */}
      {form.errors?.length ? (
        <ul style={{ color: '#c00', marginTop: 12 }}>
          {form.errors.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      ) : null}

      <div style={{ marginTop: 12 }}>
        <button type="submit" style={{ padding: '6px 10px', cursor: 'pointer' }}>
          保存
        </button>
      </div>
    </form>
  );
}

