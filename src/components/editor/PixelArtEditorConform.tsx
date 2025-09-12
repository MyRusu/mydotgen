"use client";

import { useEffect, useState } from 'react';
import { useActionState } from 'react';
// Conform 風のサーバーアクション連携フォーム
// - PixelArtEditor は純粋な UI。ここで hidden input に同期して `savePixelArt` へ POST 相当を行います。
import PixelArtEditor from '@/components/editor/PixelArtEditor';
import { savePixelArt } from '@/app/actions/pixelArt';

export type PixelArtEditorConformProps = {
  initial: { id?: string; title: string; size: 16 | 32 | 64; pixels: number[] };
};

export default function PixelArtEditorConform({ initial }: PixelArtEditorConformProps) {
  const [editorState, setEditorState] = useState(initial);
  // `formAction` は `<form action={...}>` に渡す。submit でサーバーアクションが実行される。
  const [, formAction] = useActionState(savePixelArt, null);

  // エディタの状態を hidden フィールドに反映（Controlled Components）
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
      {/* pixels は数値配列を JSON 文字列化して渡す（サーバー側で Zod により検証） */}
      <input name="pixels" type="hidden" value={JSON.stringify(editorState.pixels)} readOnly />
      <div style={{ marginTop: 12 }}>
        <button type="submit" style={{ padding: '6px 10px', cursor: 'pointer' }}>
          保存
        </button>
      </div>
    </form>
  );
}
