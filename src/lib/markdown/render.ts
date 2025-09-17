import { marked } from 'marked';
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const { window } = new JSDOM('');
const DOMPurify = createDOMPurify(window as unknown as Window);

marked.setOptions({
  gfm: true,
  breaks: true,
});

export function renderMarkdownToHtml(markdown: string): string {
  const rawHtml = marked.parse(markdown ?? '');
  return DOMPurify.sanitize(rawHtml);
}
