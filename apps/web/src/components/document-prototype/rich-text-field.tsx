"use client";

import { useEffect, useRef } from "react";
import UniqueID from "@tiptap/extension-unique-id";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  LuBold,
  LuItalic,
  LuList,
  LuListOrdered,
  LuUnderline,
} from "react-icons/lu";
import type { RichText } from "../../../../../packages/contracts/resume-content";

interface RichTextFieldProps {
  label: string;
  placeholder?: string;
  value: RichText;
  onChange: (value: RichText) => void;
}

const extensions = [
  UniqueID.configure({ types: ["listItem"] }),
  StarterKit.configure({
    blockquote: false,
    code: false,
    codeBlock: false,
    heading: false,
    horizontalRule: false,
    link: false,
    strike: false,
  }),
];

const RichTextField = ({
  label,
  placeholder,
  value,
  onChange,
}: RichTextFieldProps) => {
  const emitted = useRef<RichText | undefined>(undefined);
  const editor = useEditor({
    immediatelyRender: false,
    extensions,
    content: value.content?.length
      ? value
      : { type: "doc", content: [{ type: "paragraph" }] },
    editorProps: {
      attributes: {
        "aria-label": label,
        ...(placeholder ? { "aria-placeholder": placeholder } : {}),
        role: "textbox",
        "aria-multiline": "true",
        class:
          "min-h-[calc(4lh+1.25rem)] cursor-text px-3 py-2.5 text-sm outline-none [&_ol]:list-decimal [&_ul]:list-disc [&_ol]:pl-5 [&_ul]:pl-5 [&_p+p]:mt-1.5",
      },
    },
    onUpdate: ({ editor }) => {
      // Initial extension normalization is not a user edit.
      if (!editor.isFocused) return;
      const next = editor.getJSON() as RichText;
      emitted.current = next;
      onChange(next);
    },
  });
  useEffect(() => {
    if (!editor || value === emitted.current) return;
    const next = value.content?.length
      ? value
      : { type: "doc" as const, content: [{ type: "paragraph" as const }] };
    if (JSON.stringify(editor.getJSON()) !== JSON.stringify(next))
      editor.commands.setContent(next, { emitUpdate: false });
  }, [editor, value]);
  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      showPlaceholder:
        editor?.isEmpty &&
        editor.state.doc.content.content.every(
          (node) => node.type.name === "paragraph",
        ),
      bold: editor?.isActive("bold"),
      italic: editor?.isActive("italic"),
      underline: editor?.isActive("underline"),
      bullets: editor?.isActive("bulletList"),
      numbering: editor?.isActive("orderedList"),
    }),
  });
  const actions = [
    {
      label: "Bold",
      icon: LuBold,
      active: state?.bold,
      run: () => editor?.chain().focus().toggleBold().run(),
    },
    {
      label: "Italic",
      icon: LuItalic,
      active: state?.italic,
      run: () => editor?.chain().focus().toggleItalic().run(),
    },
    {
      label: "Underline",
      icon: LuUnderline,
      active: state?.underline,
      run: () => editor?.chain().focus().toggleUnderline().run(),
    },
    {
      label: "Bulleted list",
      icon: LuList,
      active: state?.bullets,
      run: () => editor?.chain().focus().toggleBulletList().run(),
    },
    {
      label: "Numbered list",
      icon: LuListOrdered,
      active: state?.numbering,
      run: () => editor?.chain().focus().toggleOrderedList().run(),
    },
  ];

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold">{label}</span>
      <div className="overflow-hidden rounded-lg border border-line bg-paper focus-within:border-accent">
        <div
          role="group"
          aria-label={label + " formatting"}
          className="flex flex-wrap gap-0.5 border-b border-line bg-canvas p-1"
        >
          {actions.map(({ label, icon: Icon, active, run }) => (
            <button
              key={label}
              type="button"
              disabled={!editor}
              onMouseDown={(event) => event.preventDefault()}
              onClick={run}
              aria-label={label}
              aria-pressed={Boolean(active)}
              title={label}
              className="grid size-9 place-items-center rounded-md text-muted hover:bg-paper aria-pressed:bg-accent-soft aria-pressed:text-accent"
            >
              <Icon aria-hidden="true" className="size-4" />
            </button>
          ))}
        </div>
        <div className="relative rounded-b-[calc(var(--radius-lg)-1px)] focus-within:ring-2 focus-within:ring-accent focus-within:ring-inset">
          <EditorContent editor={editor} />
          {placeholder && state?.showPlaceholder && (
            <p
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-3 top-2.5 text-sm text-muted"
            >
              {placeholder}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export { RichTextField };
