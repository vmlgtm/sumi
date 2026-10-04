import { Note } from './types';

export function stripHtml(html: unknown): string {
  if (typeof html !== 'string' || !html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return (doc.body.textContent || '').trim();
}

export function isNoteEmpty(title: unknown, contentHtml: unknown): boolean {
  const plainTitle = typeof title === 'string' ? title.trim() : '';
  const plainContent = typeof contentHtml === 'string' ? stripHtml(contentHtml) : '';
  return plainTitle.length === 0 && plainContent.length === 0;
}

export function sanitizeUrl(url: string): string {
  const trimmed = (url || '').trim();
  if (/^(https?:\/\/|mailto:|#)/i.test(trimmed)) {
    return trimmed;
  }
  // Auto-prepend https:// if domain-like (e.g. github.com/foo)
  if (/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}(\/.*)?$/i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return '';
}

export function isValidUrl(url: string): boolean {
  return Boolean(sanitizeUrl(url));
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
      case 'code':
        return `\`${childrenText}\``;
      case 'a': {
        const href = el.getAttribute('href') || '';
        return `[${childrenText}](${href})`;
      }
      case 'p': {
        if (el.classList.contains('task-item')) {
          const checkbox = el.querySelector<HTMLInputElement>('input[type="checkbox"]');
          const isChecked = checkbox?.checked || checkbox?.hasAttribute('checked') || el.classList.contains('task-done');
          const textEl = el.querySelector('.task-text') || el;
          const taskContent = Array.from(textEl.childNodes)
            .filter(n => (n as HTMLElement).tagName?.toLowerCase() !== 'input' && !(n as HTMLElement).classList?.contains('task-checkbox'))
            .map(processNode)
            .join('')
            .trim();
          return `${isChecked ? '- [x]' : '- [ ]'} ${taskContent}\n`;
        }
        return `${childrenText}\n\n`;
      }
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
    contentHtml: `<p><strong>Sumi</strong> is a local-first, distraction-free scratchpad.</p><ul><li><strong>⌥N / c</strong> — New note</li><li><strong>⌘K</strong> — Search & links</li><li><strong>⌘E / \`code\`</strong> — Inline code</li><li><strong>- [ ]</strong> — Checklist</li><li><strong>⌘/</strong> — All shortcuts</li></ul>`,
    pinned: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
