"use client";

import { useEffect, useState } from 'react';
import { useActionState } from 'react';
import PixelArtEditor from '@/components/editor/PixelArtEditor';
import { savePixelArt } from '@/app/actions/pixelArt';

export type PixelArtEditorConformProps = {
  initial: { id?: string; title: string; size: 16 | 32 | 64; pixels: number[] };
};

export default function PixelArtEditorConform({ initial }: PixelArtEditorConformProps) {
  const [editorState, setEditorState] = useState(initial);
  const [, formAction] = useActionState(savePixelArt, null);

  // keep hidden inputs in sync with editor state via controlled values
  useEffect(() => {
    // no-op; editorState is updated from PixelArtEditor via onStateChange
  }, [editorState]);

  return (
    <form action={formAction} noValidate>
      <PixelArtEditor
        id={initial.id}
        title={initial.title}
        size={initial.size}
        pixels={initial.pixels}
        onStateChange={(s) => setEditorState(s)}
        hideSaveButton
      />
      {editorState.id ? (
        <input name="id" type="hidden" value={editorState.id} readOnly />
      ) : null}
      <input name="title" type="hidden" value={editorState.title} readOnly />
      <input name="size" type="hidden" value={editorState.size} readOnly />
      <input name="pixels" type="hidden" value={JSON.stringify(editorState.pixels)} readOnly />
      <div style={{ marginTop: 12 }}>
        <button type="submit" style={{ padding: '6px 10px', cursor: 'pointer' }}>
          保存
        </button>
      </div>
    </form>
  );
}
