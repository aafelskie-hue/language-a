import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';

export const sharedStyles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.35,
    paddingTop: 72,
    paddingBottom: 72,
    paddingHorizontal: 72,
    color: '#222222',
  },
  brandMark: {
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#999999',
    marginBottom: 8,
  },
  divider: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#cccccc',
    marginBottom: 16,
  },
  sectionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#aaaaaa',
    marginTop: 24,
    marginBottom: 16,
  },
  footer: {
    position: 'absolute',
    bottom: 36,
    left: 72,
    right: 72,
    fontSize: 8,
    color: '#999999',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

interface PdfFooterProps {
  title: string;
}

export function PdfFooter({ title }: PdfFooterProps) {
  return React.createElement(Text, {
    style: sharedStyles.footer,
    render: ({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
      `${title} — Language A (language-a.com)     Page ${pageNumber} of ${totalPages}`,
    fixed: true,
  });
}
