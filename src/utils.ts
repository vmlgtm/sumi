import { Note } from './types';

export function stripHtml(html: string): string {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return (doc.body.textContent || '').trim();
}

export function isNoteEmpty(title: string, contentHtml: string): boolean {
  const plainTitle = title.trim();
  const plainContent = stripHtml(contentHtml);
  return plainTitle.length === 0 && plainContent.length === 0;
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffSec = Math.floor((now - timestamp) / 1000);

  if (diffSec < 10) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;

  const diffDays = Math.floor(diffHour / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function htmlToMarkdown(title: string, html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;

  let md = title.trim() ? `# ${title.trim()}\n\n` : '';

  function processNode(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }

    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    const childrenText = Array.from(el.childNodes).map(processNode).join('');

    switch (tag) {
      case 'strong':
      case 'b':
        return `**${childrenText}**`;
      case 'em':
      case 'i':
        return `*${childrenText}*`;
      case 'p':
        return `${childrenText}\n\n`;
      case 'br':
        return '\n';
      case 'ul':
        return `${childrenText}\n`;
      case 'ol':
        return `${childrenText}\n`;
      case 'li': {
        const parentTag = el.parentElement?.tagName.toLowerCase();
        if (parentTag === 'ol') {
          const index = Array.from(el.parentElement?.children || []).indexOf(el) + 1;
          return `${index}. ${childrenText}\n`;
        }
        return `- ${childrenText}\n`;
      }
      default:
        return childrenText;
    }
  }

  md += Array.from(div.childNodes).map(processNode).join('').trim();
  return md;
}

export function downloadFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function createWelcomeNote(): Note {
  return {
    id: 'welcome-to-sumi',
    title: 'Welcome to Sumi (墨)',
    contentHtml: `<p><strong>Sumi</strong> is an ultra-fast, local-first scratchpad built for clarity and speed.</p><p>Key principles:</p><ul><li><strong>Zero lag:</strong> boots in under 50ms, ready to type instantly.</li><li><strong>Pure ink:</strong> crisp white canvas, clean typography, zero distraction.</li><li><strong>Local & private:</strong> 100% offline, zero tracking, notes saved instantly to your browser.</li></ul><p>Essential Shortcuts:</p><ul><li><strong>⌘N</strong> — New note</li><li><strong>⌘K</strong> — Instant search</li><li><strong>⌘P</strong> — Pin / unpin note</li><li><strong>⌘B</strong> / <strong>⌘I</strong> — Bold / Italic</li><li><strong>- </strong> followed by Space — Bulleted list</li><li><strong>⌘/</strong> — Keyboard cheat sheet</li></ul><p>Enjoy the clarity of ink on paper.</p>`,
    pinned: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
