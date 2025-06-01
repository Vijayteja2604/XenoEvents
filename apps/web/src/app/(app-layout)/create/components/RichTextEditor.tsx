"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { cn } from "@/lib/utils";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Underline as UnderlineIcon,
  Undo,
  Redo,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface MenuBarButtonProps {
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  children: React.ReactNode;
}

function MenuBarButton({
  onClick,
  disabled,
  active,
  children,
}: MenuBarButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("h-8 px-3 py-2 hover:bg-gray-100", active && "bg-gray-100")}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </Button>
  );
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Add a description for your event...",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose max-w-none focus:outline-none min-h-[100px] px-3 py-2",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(JSON.stringify(editor.getJSON()));
    },
    immediatelyRender: false,
    parseOptions: {
      preserveWhitespace: true,
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <>
      <div className="relative min-h-[240px] rounded-md border-none bg-white text-xs font-normal shadow-none hover:bg-gray-50/90 sm:text-sm overflow-hidden">
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 border-b bg-white/95 p-2 backdrop-blur supports-[backdrop-filter]:bg-white/75">
          <MenuBarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            active={editor.isActive("heading", { level: 1 })}
          >
            <Heading1 className="h-4 w-4" />
          </MenuBarButton>
          <MenuBarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            active={editor.isActive("heading", { level: 2 })}
          >
            <Heading2 className="h-4 w-4" />
          </MenuBarButton>

          <Separator orientation="vertical" className="mx-1 h-6" />

          <MenuBarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
          >
            <Bold className="h-4 w-4" />
          </MenuBarButton>
          <MenuBarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
          >
            <Italic className="h-4 w-4" />
          </MenuBarButton>
          <MenuBarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive("underline")}
          >
            <UnderlineIcon className="h-4 w-4" />
          </MenuBarButton>

          <Separator orientation="vertical" className="mx-1 h-6" />

          <MenuBarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
          >
            <List className="h-4 w-4" />
          </MenuBarButton>
          <MenuBarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
          >
            <ListOrdered className="h-4 w-4" />
          </MenuBarButton>
          <MenuBarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive("blockquote")}
          >
            <Quote className="h-4 w-4" />
          </MenuBarButton>

          <Separator orientation="vertical" className="mx-1 h-6" />

          <MenuBarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo className="h-4 w-4" />
          </MenuBarButton>
          <MenuBarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo className="h-4 w-4" />
          </MenuBarButton>

          <Separator orientation="vertical" className="mx-1 h-6" />
        </div>

        <div className="px-2">
          <EditorContent editor={editor} />
        </div>
      </div>
    </>
  );
}
