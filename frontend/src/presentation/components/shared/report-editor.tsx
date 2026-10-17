"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold, Italic, Strikethrough, List, ListOrdered, Heading2, Heading3,
  TableIcon, Undo2, Redo2, Check, Loader2,
} from "lucide-react";
import type { TiptapContent } from "@/src/domain/entities/report";
import { cn } from "../ui/cn";

function ToolbarButton({
  active, disabled, onClick, label, children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-md text-body transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        active ? "bg-primary-100 text-primary-700" : "hover:bg-surface-soft hover:text-ink-0",
      )}
    >
      {children}
    </button>
  );
}

export function ReportEditor({
  content, editable = true, onChange, onReady,
}: {
  content: TiptapContent;
  editable?: boolean;
  onChange?: (content: TiptapContent) => void;
  onReady?: (editor: Editor) => void;
}) {
  const editor = useEditor({
    editable,
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Image,
      Placeholder.configure({ placeholder: "Start writing, or ask BHUMI to draft a section…" }),
    ],
    content: content as never,
    editorProps: {
      attributes: {
        class: "report-editor-body focus:outline-none",
      },
    },
    onUpdate: ({ editor: e }) => {
      onChange?.(e.getJSON() as TiptapContent);
    },
  });

  useEffect(() => {
    if (editor) onReady?.(editor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {editable ? (
        <div className="scrollbar-thin flex shrink-0 items-center gap-0.5 overflow-x-auto border-b border-hairline bg-surface-card px-3 py-2">
          <ToolbarButton label="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
            <Undo2 className="size-4" aria-hidden />
          </ToolbarButton>
          <ToolbarButton label="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
            <Redo2 className="size-4" aria-hidden />
          </ToolbarButton>
          <span className="mx-1.5 h-5 w-px bg-hairline" aria-hidden />
          <ToolbarButton
            label="Heading 2" active={editor.isActive("heading", { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 className="size-4" aria-hidden />
          </ToolbarButton>
          <ToolbarButton
            label="Heading 3" active={editor.isActive("heading", { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            <Heading3 className="size-4" aria-hidden />
          </ToolbarButton>
          <span className="mx-1.5 h-5 w-px bg-hairline" aria-hidden />
          <ToolbarButton label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
            <Bold className="size-4" aria-hidden />
          </ToolbarButton>
          <ToolbarButton label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <Italic className="size-4" aria-hidden />
          </ToolbarButton>
          <ToolbarButton label="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
            <Strikethrough className="size-4" aria-hidden />
          </ToolbarButton>
          <span className="mx-1.5 h-5 w-px bg-hairline" aria-hidden />
          <ToolbarButton label="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <List className="size-4" aria-hidden />
          </ToolbarButton>
          <ToolbarButton label="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <ListOrdered className="size-4" aria-hidden />
          </ToolbarButton>
          <span className="mx-1.5 h-5 w-px bg-hairline" aria-hidden />
          <ToolbarButton
            label="Insert table"
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          >
            <TableIcon className="size-4" aria-hidden />
          </ToolbarButton>
        </div>
      ) : null}

      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto bg-canvas">
        <div className="mx-auto max-w-3xl bg-surface-card px-10 py-12 shadow-sm sm:my-8 sm:rounded-lg">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}

export function useAutosave(reportId: string, save: (content: TiptapContent) => Promise<void>) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef<TiptapContent | null>(null);

  function schedule(content: TiptapContent) {
    latestRef.current = content;
    setStatus("idle");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      if (!latestRef.current) return;
      setStatus("saving");
      await save(latestRef.current);
      setStatus("saved");
    }, 1200);
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return { status, schedule };
}

export function AutosaveIndicator({ status }: { status: "idle" | "saving" | "saved" }) {
  if (status === "idle") return null;
  return (
    <span className="flex items-center gap-1.5 text-[11.5px] text-muted-soft">
      {status === "saving" ? (
        <>
          <Loader2 className="size-3 animate-spin" aria-hidden />
          Saving…
        </>
      ) : (
        <>
          <Check className="size-3 text-success" aria-hidden />
          Saved
        </>
      )}
    </span>
  );
}
