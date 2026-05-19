import { generateChatTitle } from './utils';

describe('generateChatTitle', () => {
  it('should return the message as is if it is 50 characters or less', () => {
    expect(generateChatTitle('Short message')).toBe('Short message');
    expect(generateChatTitle('A'.repeat(50))).toBe('A'.repeat(50));
  });

  it('should truncate message to 47 characters and add ellipsis if longer than 50 characters', () => {
    expect(generateChatTitle('A'.repeat(51))).toBe('A'.repeat(47) + '...');
    expect(generateChatTitle('A'.repeat(100))).toBe('A'.repeat(47) + '...');
  });

  it('should handle messages with exactly 50 characters correctly', () => {
    const fiftyCharString = 'A'.repeat(50);
    expect(generateChatTitle(fiftyCharString)).toBe(fiftyCharString);
  });

  it('should handle messages with exactly 51 characters correctly', () => {
    const fiftyOneCharString = 'A'.repeat(51);
    const expected = 'A'.repeat(47) + '...';
    expect(generateChatTitle(fiftyOneCharString)).toBe(expected);
  });

  it('should trim leading and trailing whitespace', () => {
    expect(generateChatTitle('  Hello World  ')).toBe('Hello World');
    expect(generateChatTitle('   AAAAAAAAAA   ')).toBe('AAAAAAAAAA'); // Testing with a shorter string that won't get truncated
  });

  it('should replace newline characters with spaces', () => {
    expect(generateChatTitle('Line 1\nLine 2')).toBe('Line 1 Line 2');
    expect(generateChatTitle('A\nB\nC')).toBe('A B C');
  });

  it('should handle mixed trimming, newlines, and truncation', () => {
    const longMessageWithNewlines = '  ' + 'A'.repeat(45) + '\n' + 'B'.repeat(45) + '  ';
    const processed = longMessageWithNewlines.trim().replace(/\n/g, ' ');
    const expected = processed.substring(0, 47) + '...';
    
    expect(generateChatTitle(longMessageWithNewlines)).toBe(expected);
  });
});