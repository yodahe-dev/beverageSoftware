import React from "react";
import type { JSX } from "react";
// components/post/RichTextRenderer.tsx
// This component should contain the same renderText, renderContent, and renderBlocksContent functions
// from the main page file, but adapted for the component structure

interface TextItem {
  type: string;
  text?: string;
  marks?: Array<{ type: string; attrs?: { color?: string } }>;
  content?: TextItem[];
  attrs?: { level?: number };
}

interface ContentItem {
  type: string;
  content?: TextItem[];
  attrs?: { level?: number; src?: string; alt?: string; checked?: boolean };
}

interface BlockItem {
  type: string;
  text?: string;
}

// Render text with marks
const renderText = (textItem: TextItem, key: number) => {
  if (!textItem || textItem.type !== 'text') return null;
  let className = "";
  let style: React.CSSProperties = {};

  textItem.marks?.forEach((mark: any) => {
    switch (mark.type) {
      case 'bold': className += " font-bold"; break;
      case 'italic': className += " italic"; break;
      case 'underline': className += " underline"; break;
      case 'strike': className += " line-through"; break;
      case 'code': className += " font-mono bg-gray-800 px-1 rounded"; break;
      case 'link': style.color = "#8B5CF6"; break;
      case 'textStyle':
        if (mark.attrs?.color) style.color = mark.attrs.color;
        break;
      case 'highlight':
        style.backgroundColor = mark.attrs?.color || "#DDD6FE";
        break;
      case 'subscript': className += " align-sub text-sm"; break;
      case 'superscript': className += " align-super text-sm"; break;
      case 'mention': className += " text-violet-400"; break;
      case 'hashtag': className += " text-cyan-400"; break;
      default: break;
    }
  });

  return <span key={key} className={className} style={style}>{textItem.text}</span>;
};

// Recursive render for nested content
const renderContent = (item: ContentItem, key: number): JSX.Element | null => {
  if (!item) return null;

  switch (item.type) {
    case 'paragraph':
      return <p key={key} className="mb-4">{item.content?.map((textItem, i) => renderText(textItem, i))}</p>;

    case 'heading':
      const HeadingTag = `h${item.attrs?.level || 2}` as keyof JSX.IntrinsicElements;
      return (
        <HeadingTag key={key} className={`text-violet-300 font-bold my-4 
          ${item.attrs?.level === 1 ? 'text-2xl' : item.attrs?.level === 2 ? 'text-xl' : 'text-lg'}`}>
          {item.content?.map((textItem, i) => renderText(textItem, i))}
        </HeadingTag>
      );

    case 'blockquote':
      return (
        <blockquote key={key} className="border-l-4 border-violet-500 pl-4 italic my-4 text-gray-300">
          {item.content?.map((textItem, i) => renderText(textItem, i))}
        </blockquote>
      );

    case 'codeBlock':
      return (
        <pre key={key} className="bg-gray-800 text-pink-300 p-4 rounded my-4 overflow-x-auto">
          <code>{item.content?.map((t: any, i: number) => t.text).join('')}</code>
        </pre>
      );

    case 'horizontalRule':
      return <hr key={key} className="border-t border-gray-700 my-4" />;

    case 'hardBreak':
      return <br key={key} />;

    case 'bulletList':
    case 'orderedList':
      const ListTag = item.type === 'bulletList' ? 'ul' : 'ol';
      return React.createElement(ListTag, { key, className: `my-4 ${item.type==='bulletList'?'list-disc':'list-decimal'} pl-6` },
        item.content?.map((li: ContentItem, i: number) => 
          <li key={i}>{li.content?.map((contentItem, j) => renderContent(contentItem, j))}</li>)
      );

    case 'table':
      return (
        <table key={key} className="w-full border border-violet-500 my-4 rounded overflow-hidden">
          <tbody>
            {item.content?.map((row: ContentItem, rIdx: number) => (
              <tr key={rIdx}>
                {row.content?.map((cell: ContentItem, cIdx: number) => {
                  const CellTag = cell.type === 'tableHeader' ? 'th' : 'td';
                  return React.createElement(CellTag, { 
                    key: cIdx, 
                    className: "border-b border-violet-400 px-2 py-1 text-left" 
                  }, cell.content?.map((textItem, i) => renderText(textItem, i)));
                })}
              </tr>
            ))}
          </tbody>
        </table>
      );

    case 'image':
      return (
        <div key={key} className="my-4 flex justify-center">
          <img 
            src={item.attrs?.src} 
            alt={item.attrs?.alt || ""} 
            className="rounded-xl object-contain max-h-96"
          />
        </div>
      );

    case 'iframe':
      return (
        <div key={key} className="my-4 aspect-video w-full">
          <iframe src={item.attrs?.src} className="w-full h-full rounded-xl" title="Embedded content" />
        </div>
      );

    case 'callout':
      return (
        <div key={key} className="border-dashed border-violet-500 p-4 rounded-xl my-4 bg-violet-900/20">
          {item.content?.map((textItem, i) => renderText(textItem, i))}
        </div>
      );

    case 'panel':
      return (
        <div key={key} className="bg-gray-800/50 p-4 rounded-xl my-4 border-l-4 border-violet-500">
          {item.content?.map((textItem, i) => renderText(textItem, i))}
        </div>
      );

    case 'taskList':
      return (
        <ul key={key} className="my-4 list-none pl-4">
          {item.content?.map((task: ContentItem, i: number) => (
            <li key={i} className="flex items-start my-2">
              <input 
                type="checkbox" 
                checked={task.attrs?.checked} 
                readOnly 
                className="mt-1 mr-2"
              />
              <span>{task.content?.map((textItem, j) => renderText(textItem, j))}</span>
            </li>
          ))}
        </ul>
      );

    default:
      // For unsupported types, try to render text content
      if (item.content) {
        return (
          <div key={key} className="my-4">
            {item.content.map((contentItem, i) => renderContent(contentItem, i))}
          </div>
        );
      }
      return null;
  }
};

// Render blocks format content (like {"blocks":[{"type":"paragraph","text":"Nature's mystery."}]})
const renderBlocksContent = (blocks: BlockItem[]) => {
  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'paragraph':
            return <p key={index} className="mb-4">{block.text}</p>;
          case 'heading':
            return <h2 key={index} className="text-xl font-bold text-violet-300 my-4">{block.text}</h2>;
          case 'blockquote':
            return <blockquote key={index} className="border-l-4 border-violet-500 pl-4 italic my-4">{block.text}</blockquote>;
          default:
            return <p key={index} className="mb-4">{block.text}</p>;
        }
      })}
    </div>
  );
};

// Main Renderer
export const RichTextRenderer = ({ contentJson }: { contentJson: any }) => {
  if (!contentJson) return null;
  
  let content;
  try {
    content = typeof contentJson === 'string' ? JSON.parse(contentJson) : contentJson;
  } catch (e) {
    console.error("Error parsing content JSON:", e);
    return <div>Error rendering content</div>;
  }

  // Handle different content formats
  if (content.type === 'doc' && Array.isArray(content.content)) {
    return <div className="rich-text-content space-y-4">{content.content.map((item: ContentItem, i: number) => renderContent(item, i))}</div>;
  } else if (Array.isArray(content.blocks)) {
    return renderBlocksContent(content.blocks);
  } else if (Array.isArray(content)) {
    return <div className="rich-text-content space-y-4">{content.map((item: ContentItem, i: number) => renderContent(item, i))}</div>;
  }

  return <div>Unsupported content format</div>;
};