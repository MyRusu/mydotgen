"use client";

import { useEffect, useMemo, useState } from 'react';
import { useActionState } from 'react';
// Conform 風のサーバーアクション連携フォーム
// - PixelArtEditor は純粋な UI。ここで hidden input に同期して `savePixelArt` へ POST 相当を行います。
import PixelArtEditor from '@/components/editor/PixelArtEditor';
import { savePixelArt } from '@/app/actions/pixelArt';

export type PixelArtEditorConformProps = {
  initial: { id?: string; title: string; size: 16 | 32 | 64; pixels: number[] };
  hideTitle?: boolean;
};

export default function PixelArtEditorConform({ initial, hideTitle }: PixelArtEditorConformProps) {
  const draftKey = useMemo(() => `pixelart:draft:${initial.id ?? 'new'}`, [initial.id]);
  // SSR と CSR で初期状態を一致させてハイドレーション不整合を防ぐ
  const [editorState, setEditorState] = useState(initial);
  // マウント後にローカルドラフトを読み込み（あれば上書き）
  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.pixels) && parsed.size) setEditorState(parsed);
      }
    } catch {}
    // 初期 id/title/size/pixels が変わった場合はドラフトが古い可能性があるため、キーが変わった時のみ読み直す
  }, [draftKey]);
  // `formAction` は `<form action={...}>` に渡す。submit でサーバーアクションが実行される。
  const [, formAction] = useActionState(savePixelArt, null);

  // 変更をローカルストレージへ即時同期（簡易）
  useEffect(() => {
    try {
      localStorage.setItem(draftKey, JSON.stringify(editorState));
    } catch {}
  }, [editorState, draftKey]);

  return (
    <form action={formAction} noValidate onSubmit={() => {
      try { localStorage.removeItem(draftKey); } catch {}
    }}>
      <PixelArtEditor
        id={editorState.id}
        title={editorState.title}
        size={editorState.size}
        pixels={editorState.pixels}
        onStateChange={(s) => setEditorState(s)}
        hideSaveButton
        hideTitle={hideTitle}
        leftFooter={<button type="submit" className="btn" style={{ width: '100%' }}>保存</button>}
      />
      {editorState.id ? (
        <input name="id" type="hidden" value={editorState.id} readOnly />
      ) : null}
      <input name="title" type="hidden" value={editorState.title} readOnly />
      <input name="size" type="hidden" value={editorState.size} readOnly />
      {/* pixels は数値配列を JSON 文字列化して渡す（サーバー側で Zod により検証） */}
      <input name="pixels" type="hidden" value={JSON.stringify(editorState.pixels)} readOnly />
    </form>
  );
}
