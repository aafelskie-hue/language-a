export interface TextSegment {
  text: string;
  bold: boolean;
}

export function parseMessageText(content: string): TextSegment[] {
  const segments: TextSegment[] = [];
  const regex = /\*\*Pattern (\d+):?\s*([^*]+)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: content.slice(lastIndex, match.index), bold: false });
    }
    segments.push({ text: match[0].replace(/\*\*/g, ''), bold: true });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    segments.push({ text: content.slice(lastIndex), bold: false });
  }

  return segments.length > 0 ? segments : [{ text: content, bold: false }];
}
