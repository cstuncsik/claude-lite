export function generateChatTitle(firstMessage: string): string {
  // Take first 50 characters of the message as title
  const cleaned = firstMessage.trim().replace(/\n/g, ' ');
  if (cleaned.length <= 50) {
    return cleaned;
  }
  return cleaned.substring(0, 47) + '...';
}
