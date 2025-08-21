import React, { useEffect, useRef } from "react";
import type { JSX } from "react";

interface TextItem {
  type: string;
  text?: string;
  marks?: Array<{ type: string; attrs?: { color?: string } }>;
  content?: TextItem[];
  attrs?: { level?: number };
}

interface ContentItem {
  type: string;
  content?: TextItem[] | ContentItem[];
  attrs?: {
    level?: number;
    src?: string;
    alt?: string;
    checked?: boolean;
    embedHtml?: string; // allow raw embed html if provided
  };
}

interface BlockItem {
  type: string;
  text?: string;
  attrs?: { src?: string; embedHtml?: string };
}

/* -----------------------
   Utility: load external script once
   ----------------------- */
const loadScriptOnce = (src: string, id: string) => {
  return new Promise<void>((resolve, reject) => {
    if (typeof document === "undefined") return resolve();
    if (document.getElementById(id)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.id = id;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(s);
  });
};

/* -----------------------
   Provider detection & helpers
   ----------------------- */
const detectProvider = (url: string | undefined) => {
  if (!url) return "generic";
  if (/youtube\.com|youtu\.be|youtube-nocookie/.test(url)) return "youtube";
  if (/tiktok\.com/.test(url)) return "tiktok";
  if (/twitch\.tv/.test(url)) return "twitch";
  if (/facebook\.com|fb\.watch/.test(url)) return "facebook";
  if (/instagram\.com/.test(url)) return "instagram";
  if (/x\.com|twitter\.com/.test(url)) return "x";
  return "generic";
};

const extractYouTubeId = (url: string) => {
  // handles youtu.be/ID, v=ID, /embed/ID
  const m = url.match(
    /(?:v=|\/embed\/|youtu\.be\/|\/v\/)([A-Za-z0-9_-]{11})/
  );
  return m ? m[1] : null;
};

const extractTikTokId = (url: string) => {
  // /video/<id>
  const m = url.match(/\/video\/(\d+)/);
  return m ? m[1] : null;
};

const extractTwitchChannelOrVideo = (url: string) => {
  // twitch.tv/<channel>/video/<id>  OR twitch.tv/<channel>
  const vid = url.match(/twitch\.tv\/videos?\/(\d+)/);
  if (vid) return { type: "video", id: vid[1] };
  const ch = url.match(/twitch\.tv\/([^\/\?&]+)/);
  if (ch) return { type: "channel", id: ch[1] };
  return null;
};

const extractInstagramShortcode = (url: string) => {
  // /p/<shortcode>/ or /reel/<shortcode>/
  const m = url.match(/instagram\.com\/(?:p|reel)\/([^\/\?]+)/);
  return m ? m[1] : null;
};

const extractXStatusId = (url: string) => {
  const m = url.match(/twitter\.com\/[^\/]+\/status\/(\d+)/) || url.match(/x\.com\/[^\/]+\/status\/(\d+)/);
  return m ? m[1] : null;
};

/* -----------------------
   Small embed components
   ----------------------- */

const YouTubeEmbed: React.FC<{ url: string }> = ({ url }) => {
  const id = extractYouTubeId(url);
  if (!id) {
    // fallback to generic iframe
    return (
      <div className="my-4 aspect-video w-full">
        <iframe
          src={url}
          className="w-full h-full rounded-xl"
          title="YouTube (fallback)"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }
  return (
    <div className="my-4 aspect-video w-full">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${id}`}
        className="w-full h-full rounded-xl"
        title="YouTube video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
};

const TikTokEmbed: React.FC<{ url?: string; embedHtml?: string }> = ({ url, embedHtml }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!ref.current) return;
    // If raw embed HTML provided, inject it and load script
    if (embedHtml) {
      ref.current.innerHTML = embedHtml;
      loadScriptOnce("https://www.tiktok.com/embed.js", "tiktok-embed-js").catch(() => {});
      return;
    }
    // build blockquote for the video URL if url contains video id
    if (url) {
      const id = extractTikTokId(url);
      if (!id) {
        // fallback: inject generic embed anchor
        ref.current.innerHTML = `<blockquote class="tiktok-embed" cite="${url}" data-video-id="" style="max-width: 605px;min-width: 325px;"><section><a href="${url}" target="_blank">View TikTok</a></section></blockquote>`;
        loadScriptOnce("https://www.tiktok.com/embed.js", "tiktok-embed-js").catch(() => {});
        return;
      }
      // create standard blockquote template
      const block = `<blockquote class="tiktok-embed" cite="${url}" data-video-id="${id}" style="max-width: 605px;min-width: 325px;"><section></section></blockquote>`;
      ref.current.innerHTML = block;
      loadScriptOnce("https://www.tiktok.com/embed.js", "tiktok-embed-js").catch(() => {});
    }
  }, [url, embedHtml]);
  return <div ref={ref} className="my-4" />;
};

const TwitchEmbed: React.FC<{ url: string }> = ({ url }) => {
  // For channel live embeds we must pass parent param
  const info = extractTwitchChannelOrVideo(url);
  const parent = typeof window !== "undefined" ? window.location.hostname : "localhost";
  if (!info) {
    return (
      <div className="my-4 aspect-video w-full">
        <iframe src={url} className="w-full h-full rounded-xl" title="Twitch (fallback)" allowFullScreen />
      </div>
    );
  }
  if (info.type === "video") {
    return (
      <div className="my-4 aspect-video w-full">
        <iframe
          src={`https://player.twitch.tv/?video=v${info.id}&parent=${parent}`}
          className="w-full h-full rounded-xl"
          title="Twitch video"
          allowFullScreen
        />
      </div>
    );
  }
  return (
    <div className="my-4 aspect-video w-full">
      <iframe
        src={`https://player.twitch.tv/?channel=${info.id}&parent=${parent}`}
        className="w-full h-full rounded-xl"
        title="Twitch channel"
        allowFullScreen
      />
    </div>
  );
};

const FacebookEmbed: React.FC<{ url: string }> = ({ url }) => {
  // Facebook embed uses a plugins URL that takes the href param
  const src = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0`;
  return (
    <div className="my-4 aspect-video w-full">
      <iframe
        src={src}
        className="w-full h-full rounded-xl"
        title="Facebook video"
        allowFullScreen
      />
    </div>
  );
};

const InstagramEmbed: React.FC<{ url: string }> = ({ url }) => {
  const code = extractInstagramShortcode(url);
  if (!code) {
    return (
      <div className="my-4">
        <a href={url} target="_blank" rel="noreferrer">
          Open Instagram
        </a>
      </div>
    );
  }
  return (
    <div className="my-4">
      <iframe
        src={`https://www.instagram.com/p/${code}/embed`}
        className="w-full h-96 rounded-xl"
        title="Instagram embed"
        allowFullScreen
      />
    </div>
  );
};

const XEmbed: React.FC<{ url: string }> = ({ url }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!ref.current) return;
    // Build a minimal blockquote for platform script to transform
    ref.current.innerHTML = `<blockquote class="twitter-tweet"><a href="${url}"></a></blockquote>`;
    loadScriptOnce("https://platform.twitter.com/widgets.js", "twitter-wjs").catch(() => {});
  }, [url]);
  return <div ref={ref} className="my-4" />;
};

const GenericIframe: React.FC<{ url: string }> = ({ url }) => {
  return (
    <div className="my-4 aspect-video w-full">
      <iframe
        src={url}
        className="w-full h-full rounded-xl"
        title="Embedded content"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
};

/* -----------------------
   Render helpers (text + content)
   ----------------------- */

const renderText = (textItem: TextItem, key: number) => {
  if (!textItem || textItem.type !== "text") return null;
  let className = "";
  let style: React.CSSProperties = {};

  textItem.marks?.forEach((mark: any) => {
    switch (mark.type) {
      case "bold":
        className += " font-bold";
        break;
      case "italic":
        className += " italic";
        break;
      case "underline":
        className += " underline";
        break;
      case "strike":
        className += " line-through";
        break;
      case "code":
        className += " font-mono bg-gray-800 px-1 rounded";
        break;
      case "link":
        style.color = "#8B5CF6";
        break;
      case "textStyle":
        if (mark.attrs?.color) style.color = mark.attrs.color;
        break;
      case "highlight":
        style.backgroundColor = mark.attrs?.color || "#DDD6FE";
        break;
      case "subscript":
        className += " align-sub text-sm";
        break;
      case "superscript":
        className += " align-super text-sm";
        break;
      case "mention":
        className += " text-violet-400";
        break;
      case "hashtag":
        className += " text-cyan-400";
        break;
      default:
        break;
    }
  });

  return (
    <span key={key} className={className} style={style}>
      {textItem.text}
    </span>
  );
};

const renderContent = (item: ContentItem, key: number): JSX.Element | null => {
  if (!item) return null;

  // If item is a nested ContentItem with content as ContentItem[], handle recursively
  const maybeNested = Array.isArray(item.content) && item.content.length > 0 && (item.content[0] as any).type;

  switch (item.type) {
    case "paragraph":
      // paragraph might contain inline TextItem[]
      if (!maybeNested) {
        return (
          <p key={key} className="mb-4">
            {(item.content as TextItem[] | undefined)?.map((textItem, i) => renderText(textItem as TextItem, i)) || null}
          </p>
        );
      }
      // nested blocks inside paragraph
      return (
        <p key={key} className="mb-4">
          {(item.content as any[]).map((c, i) => (c.type === "text" ? renderText(c, i) : renderContent(c, i)))}
        </p>
      );

    case "heading": {
      const HeadingTag = `h${item.attrs?.level || 2}` as keyof JSX.IntrinsicElements;
      return (
        <HeadingTag key={key} className={`text-violet-300 font-bold my-4 ${item.attrs?.level === 1 ? "text-2xl" : item.attrs?.level === 2 ? "text-xl" : "text-lg"}`}>
          {(item.content as TextItem[] | undefined)?.map((t, i) => renderText(t, i))}
        </HeadingTag>
      );
    }

    case "blockquote":
      return (
        <blockquote key={key} className="border-l-4 border-violet-500 pl-4 italic my-4 text-gray-300">
          {(item.content as TextItem[] | undefined)?.map((t, i) => renderText(t, i))}
        </blockquote>
      );

    case "codeBlock":
      return (
        <pre key={key} className="bg-gray-800 text-pink-300 p-4 rounded my-4 overflow-x-auto">
          <code>{(item.content as any[] | undefined)?.map((t) => t.text).join("")}</code>
        </pre>
      );

    case "horizontalRule":
      return <hr key={key} className="border-t border-gray-700 my-4" />;

    case "hardBreak":
      return <br key={key} />;

    case "bulletList":
    case "orderedList": {
      const ListTag = item.type === "bulletList" ? "ul" : "ol";
      return React.createElement(
        ListTag,
        { key, className: `my-4 ${item.type === "bulletList" ? "list-disc" : "list-decimal"} pl-6` },
        (item.content as ContentItem[] | undefined)?.map((li: ContentItem, i: number) => (
          <li key={i}>{(li.content || []).map((c: any, j: number) => (c.type === "text" ? renderText(c, j) : renderContent(c, j)))}</li>
        ))
      );
    }

    case "table":
      return (
        <table key={key} className="w-full border border-violet-500 my-4 rounded overflow-hidden">
          <tbody>
            {(item.content as ContentItem[] | undefined)?.map((row: ContentItem, rIdx: number) => (
              <tr key={rIdx}>
                {(row.content || []).map((cell: ContentItem, cIdx: number) => {
                  const CellTag = cell.type === "tableHeader" ? "th" : "td";
                  return React.createElement(
                    CellTag,
                    { key: cIdx, className: "border-b border-violet-400 px-2 py-1 text-left" },
                    (cell.content || []).map((t: any, i: number) => (t.type === "text" ? renderText(t, i) : renderContent(t, i)))
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      );

    case "image":
      return (
        <div key={key} className="my-4 flex justify-center">
          <img src={item.attrs?.src} alt={item.attrs?.alt || ""} className="rounded-xl object-contain max-h-96" />
        </div>
      );

    case "iframe":
    case "embed": {
      const src = item.attrs?.src;
      const embedHtml = item.attrs?.embedHtml;
      const provider = detectProvider(src || "");
      switch (provider) {
        case "youtube":
          return <YouTubeEmbed key={key} url={src || ""} />;
        case "tiktok":
          return <TikTokEmbed key={key} url={src} embedHtml={embedHtml} />;
        case "twitch":
          return <TwitchEmbed key={key} url={src || ""} />;
        case "facebook":
          return <FacebookEmbed key={key} url={src || ""} />;
        case "instagram":
          return <InstagramEmbed key={key} url={src || ""} />;
        case "x":
          return <XEmbed key={key} url={src || ""} />;
        default:
          // If embedHtml was provided, inject it and try to load known scripts if pattern matches
          if (embedHtml) {
            return <RawHtmlEmbed key={key} html={embedHtml} srcHint={src} />;
          }
          return <GenericIframe key={key} url={src || ""} />;
      }
    }

    case "callout":
      return (
        <div key={key} className="border-dashed border-violet-500 p-4 rounded-xl my-4 bg-violet-900/20">
          {(item.content as TextItem[] | undefined)?.map((t, i) => renderText(t, i))}
        </div>
      );

    case "panel":
      return (
        <div key={key} className="bg-gray-800/50 p-4 rounded-xl my-4 border-l-4 border-violet-500">
          {(item.content as TextItem[] | undefined)?.map((t, i) => renderText(t, i))}
        </div>
      );

    case "taskList":
      return (
        <ul key={key} className="my-4 list-none pl-4">
          {(item.content as ContentItem[] | undefined)?.map((task: ContentItem, i: number) => (
            <li key={i} className="flex items-start my-2">
              <input type="checkbox" checked={task.attrs?.checked} readOnly className="mt-1 mr-2" />
              <span>{(task.content || []).map((textItem: any, j: number) => (textItem.type === "text" ? renderText(textItem, j) : renderContent(textItem, j)))}</span>
            </li>
          ))}
        </ul>
      );

    default:
      if (item.content) {
        return (
          <div key={key} className="my-4">
            {(item.content as any[]).map((contentItem: any, i: number) => (contentItem.type === "text" ? renderText(contentItem, i) : renderContent(contentItem, i)))}
          </div>
        );
      }
      return null;
  }
};

/* -----------------------
   Raw embed HTML injector (for user-provided blockquote+script)
   This ensures external scripts run after injection.
   ----------------------- */
const RawHtmlEmbed: React.FC<{ html: string; srcHint?: string | undefined }> = ({ html, srcHint }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = html;
    // If html contains tiktok or twitter, ensure scripts are present
    if (html.includes("tiktok.com") || (srcHint && srcHint.includes("tiktok.com"))) {
      loadScriptOnce("https://www.tiktok.com/embed.js", "tiktok-embed-js").catch(() => {});
    }
    if (html.includes("twitter.com") || (srcHint && srcHint.includes("twitter.com"))) {
      loadScriptOnce("https://platform.twitter.com/widgets.js", "twitter-wjs").catch(() => {});
    }
    // facebook, instagram usually render iframes directly inside provided HTML
  }, [html, srcHint]);
  return <div ref={ref} className="my-4" />;
};

/* -----------------------
   Blocks renderer (simple blocks format)
   ----------------------- */
const renderBlocksContent = (blocks: BlockItem[]) => {
  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        const src = block.attrs?.src;
        const embedHtml = block.attrs?.embedHtml;
        const provider = detectProvider(src || "");
        switch (block.type) {
          case "paragraph":
            return (
              <p key={index} className="mb-4">
                {block.text}
              </p>
            );
          case "heading":
            return (
              <h2 key={index} className="text-xl font-bold text-violet-300 my-4">
                {block.text}
              </h2>
            );
          case "blockquote":
            return (
              <blockquote key={index} className="border-l-4 border-violet-500 pl-4 italic my-4">
                {block.text}
              </blockquote>
            );
          case "iframe":
          case "embed":
            // If block contains raw embedHtml, use RawHtmlEmbed
            if (embedHtml) return <RawHtmlEmbed key={index} html={embedHtml} srcHint={src} />;
            switch (provider) {
              case "youtube":
                return <YouTubeEmbed key={index} url={src || ""} />;
              case "tiktok":
                return <TikTokEmbed key={index} url={src} />;
              case "twitch":
                return <TwitchEmbed key={index} url={src || ""} />;
              case "facebook":
                return <FacebookEmbed key={index} url={src || ""} />;
              case "instagram":
                return <InstagramEmbed key={index} url={src || ""} />;
              case "x":
                return <XEmbed key={index} url={src || ""} />;
              default:
                return <GenericIframe key={index} url={src || ""} />;
            }
          case "image":
            return (
              <div key={index} className="my-4 flex justify-center">
                <img src={block.attrs?.src} alt="" className="rounded-xl object-contain max-h-96" />
              </div>
            );
          default:
            return (
              <p key={index} className="mb-4">
                {block.text}
              </p>
            );
        }
      })}
    </div>
  );
};

/* -----------------------
   Main Renderer export
   ----------------------- */
export const RichTextRenderer: React.FC<{ contentJson: any }> = ({ contentJson }) => {
  if (!contentJson) return null;

  let content;
  try {
    content = typeof contentJson === "string" ? JSON.parse(contentJson) : contentJson;
  } catch (e) {
    console.error("Error parsing content JSON:", e);
    return <div>Error rendering content</div>;
  }

  if (content.type === "doc" && Array.isArray(content.content)) {
    return <div className="rich-text-content space-y-4">{(content.content as ContentItem[]).map((item, i) => renderContent(item, i))}</div>;
  } else if (Array.isArray(content.blocks)) {
    return renderBlocksContent(content.blocks as BlockItem[]);
  } else if (Array.isArray(content)) {
    return <div className="rich-text-content space-y-4">{(content as ContentItem[]).map((item, i) => renderContent(item, i))}</div>;
  }

  return <div>Unsupported content format</div>;
};
