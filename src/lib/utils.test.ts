import { describe, it, expect } from 'vitest';
import { generateChatTitle } from './utils';

describe('generateChatTitle', () => {
  it('returns a short message unchanged, trimmed', () => {
    expect(generateChatTitle('  Hello there  ')).toBe('Hello there');
  });

  it('collapses newlines into spaces', () => {
    expect(generateChatTitle('line one\nline two')).toBe('line one line two');
  });

  it('keeps a 50-character message intact', () => {
    const msg = 'a'.repeat(50);
    expect(generateChatTitle(msg)).toBe(msg);
    expect(generateChatTitle(msg)).toHaveLength(50);
  });

  it('truncates a longer message to 47 chars + ellipsis', () => {
    const title = generateChatTitle('a'.repeat(60));
    expect(title).toBe('a'.repeat(47) + '...');
    expect(title).toHaveLength(50);
  });
});
