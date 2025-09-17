import { describe, it, expect } from 'vitest';
import { renderMarkdownToHtml } from '@/lib/markdown/render';

describe('renderMarkdownToHtml', () => {
  it('renders headings and paragraphs', () => {
    const html = renderMarkdownToHtml('# Title\n\nParagraph');
    expect(html).toContain('<h1>Title</h1>');
    expect(html).toContain('<p>Paragraph</p>');
  });

  it('sanitizes script tags', () => {
    const html = renderMarkdownToHtml('Hello<script>alert(1)</script>');
    expect(html).toContain('<p>Hello</p>');
    expect(html).not.toContain('script');
  });
});
