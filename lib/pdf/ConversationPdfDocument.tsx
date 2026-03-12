import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { sharedStyles, PdfFooter } from './shared-styles';
import { parseMessageText } from './parse-message-text';

export interface ConversationPdfData {
  title: string;
  date: string;
  messageCount: number;
  messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }>;
}

const styles = StyleSheet.create({
  title: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 24,
    marginBottom: 6,
    color: '#111111',
  },
  dateLine: {
    fontSize: 9,
    color: '#666666',
    marginBottom: 4,
  },
  messageSummary: {
    fontSize: 9,
    color: '#666666',
    marginBottom: 20,
  },
  messageBlock: {
    marginBottom: 14,
  },
  userLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: '#111111',
    marginBottom: 2,
  },
  userContent: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#222222',
    lineHeight: 1.4,
  },
  guideLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9.5,
    color: '#333333',
    marginBottom: 2,
  },
  guideParagraph: {
    fontFamily: 'Helvetica',
    fontSize: 9.5,
    color: '#444444',
    lineHeight: 1.4,
    marginBottom: 6,
  },
  boldText: {
    fontFamily: 'Helvetica-Bold',
  },
});

interface ConversationPdfDocumentProps {
  data: ConversationPdfData;
}

function GuideMessageContent({ content }: { content: string }) {
  const paragraphs = content.split('\n\n');

  return (
    <>
      {paragraphs.map((paragraph, i) => {
        const segments = parseMessageText(paragraph);
        return (
          <Text key={i} style={styles.guideParagraph}>
            {segments.map((seg, j) =>
              seg.bold ? (
                <Text key={j} style={styles.boldText}>{seg.text}</Text>
              ) : (
                <Text key={j}>{seg.text}</Text>
              )
            )}
          </Text>
        );
      })}
    </>
  );
}

export function ConversationPdfDocument({ data }: ConversationPdfDocumentProps) {
  return (
    <Document>
      <Page size="LETTER" style={sharedStyles.page}>
        <Text style={sharedStyles.brandMark}>LANGUAGE A</Text>
        <Text style={styles.title}>{data.title}</Text>
        <Text style={styles.dateLine}>{data.date}</Text>
        <Text style={styles.messageSummary}>
          {data.messageCount} {data.messageCount === 1 ? 'message' : 'messages'}
        </Text>

        <View style={sharedStyles.divider} />

        {data.messages.map((msg, i) => (
          <View key={i} style={styles.messageBlock}>
            {msg.role === 'user' ? (
              <>
                <Text style={styles.userLabel}>You:</Text>
                <Text style={styles.userContent}>{msg.content}</Text>
              </>
            ) : (
              <>
                <Text style={styles.guideLabel}>Pattern Guide:</Text>
                <GuideMessageContent content={msg.content} />
              </>
            )}
          </View>
        ))}

        <PdfFooter title={data.title} />
      </Page>
    </Document>
  );
}
