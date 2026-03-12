import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { PdfExportData } from '../exportPdf';
import { sharedStyles, PdfFooter } from './shared-styles';

const styles = StyleSheet.create({
  // Cover header
  projectName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 24,
    marginBottom: 6,
    color: '#111111',
  },
  description: {
    fontSize: 10,
    color: '#444444',
    marginBottom: 6,
  },
  dateLine: {
    fontSize: 9,
    color: '#666666',
    marginBottom: 4,
  },
  summaryLine: {
    fontSize: 9,
    color: '#666666',
    marginBottom: 20,
  },
  // Scale group
  scaleHeading: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#333333',
    marginBottom: 10,
    marginTop: 14,
  },
  // Pattern entry — header block (unbreakable)
  patternHeader: {
    marginBottom: 2,
  },
  patternName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: '#111111',
  },
  patternSolution: {
    fontFamily: 'Helvetica-Oblique',
    fontSize: 9.5,
    color: '#444444',
    marginTop: 2,
  },
  patternStatusInline: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#999999',
  },
  // Pattern body (can break across pages)
  patternBody: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#444444',
    paddingLeft: 12,
    lineHeight: 1.4,
    marginTop: 4,
  },
  // Notes (can break across pages)
  patternNotes: {
    fontSize: 9,
    color: '#555555',
    marginTop: 4,
    paddingLeft: 12,
  },
  patternEntry: {
    marginBottom: 12,
  },
  // Connected patterns section
  sectionTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 14,
    color: '#111111',
    marginBottom: 6,
    marginTop: 20,
  },
  introText: {
    fontFamily: 'Helvetica-Oblique',
    fontSize: 9,
    color: '#666666',
    marginBottom: 10,
  },
  connectedEntry: {
    marginBottom: 10,
  },
  connectedName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: '#111111',
  },
  connectedTo: {
    fontSize: 9,
    color: '#666666',
    marginTop: 1,
  },
  connectedSolution: {
    fontFamily: 'Helvetica-Oblique',
    fontSize: 9.5,
    color: '#444444',
    marginTop: 2,
  },
  // Network summary
  networkRow: {
    fontSize: 9.5,
    color: '#444444',
    marginBottom: 3,
  },
  networkLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9.5,
    color: '#333333',
  },
});

interface ProjectPdfDocumentProps {
  data: PdfExportData;
}

export function ProjectPdfDocument({ data }: ProjectPdfDocumentProps) {
  return (
    <Document>
      <Page size="LETTER" style={sharedStyles.page}>
        {/* Cover header */}
        <Text style={sharedStyles.brandMark}>LANGUAGE A</Text>
        <Text style={styles.projectName}>{data.projectName}</Text>
        {data.description ? (
          <Text style={styles.description}>{data.description}</Text>
        ) : null}
        <Text style={styles.dateLine}>{data.date}</Text>
        <Text style={styles.summaryLine}>
          {data.patternCount} {data.patternCount === 1 ? 'pattern' : 'patterns'} across{' '}
          {data.scaleNames.join(', ')}
        </Text>

        <View style={sharedStyles.divider} />

        {/* Patterns by scale */}
        {data.scaleGroups.map((group) => (
          <View key={group.scale}>
            <Text style={styles.scaleHeading}>
              {group.label.toUpperCase()} — {group.patterns.length}{' '}
              {group.patterns.length === 1 ? 'pattern' : 'patterns'}
            </Text>
            {group.patterns.map((entry) => (
              <View key={entry.readingOrder} style={styles.patternEntry}>
                {/* Unbreakable header block */}
                <View wrap={false} style={styles.patternHeader}>
                  <Text style={styles.patternName}>
                    Pattern {entry.readingOrder}: {entry.name}  <Text style={styles.patternStatusInline}>({entry.status})</Text>
                  </Text>
                  <Text style={styles.patternSolution}>{entry.solution}</Text>
                </View>
                {/* Body outside the unbreakable block — can break across pages */}
                {entry.body ? (
                  <Text style={styles.patternBody}>{entry.body}</Text>
                ) : null}
                {/* Notes outside the unbreakable block — can break across pages */}
                {entry.notes ? (
                  <Text style={styles.patternNotes}>{entry.notes}</Text>
                ) : null}
              </View>
            ))}
          </View>
        ))}

        {/* Connected patterns */}
        {data.connectedPatterns.length > 0 ? (
          <View>
            <View style={sharedStyles.sectionDivider} />
            <Text style={styles.sectionTitle}>Connected Patterns</Text>
            <Text style={styles.introText}>
              Patterns not in this project that connect to two or more of your selected patterns.
            </Text>
            {data.connectedPatterns.map((entry) => (
              <View key={entry.readingOrder} style={styles.connectedEntry}>
                <View wrap={false}>
                  <Text style={styles.connectedName}>
                    Pattern {entry.readingOrder}: {entry.name}
                  </Text>
                  <Text style={styles.connectedTo}>
                    Connected to: {entry.connectedToNames.join(', ')}
                  </Text>
                  <Text style={styles.connectedSolution}>{entry.solution}</Text>
                </View>
                {entry.body ? (
                  <Text style={styles.patternBody}>{entry.body}</Text>
                ) : null}
              </View>
            ))}
            {data.totalConnectedCount > data.connectedPatterns.length ? (
              <Text style={styles.introText}>
                {data.totalConnectedCount - data.connectedPatterns.length} additional connected patterns not shown. View your full project network at language-a.com.
              </Text>
            ) : null}
          </View>
        ) : null}

        {/* Network summary */}
        <View wrap={false}>
          <View style={[sharedStyles.sectionDivider, { marginTop: 12 }]} />
          <Text style={styles.sectionTitle}>Network Summary</Text>
          <Text style={styles.networkRow}>
            <Text style={styles.networkLabel}>Patterns: </Text>
            {data.networkSummary.patternCount}
          </Text>
          <Text style={styles.networkRow}>
            <Text style={styles.networkLabel}>Categories: </Text>
            {data.networkSummary.categoryCount}
          </Text>
          <Text style={styles.networkRow}>
            <Text style={styles.networkLabel}>Scales: </Text>
            {data.networkSummary.scaleCount}
          </Text>
          <Text style={styles.networkRow}>
            <Text style={styles.networkLabel}>Pairwise connections: </Text>
            {data.networkSummary.pairwiseConnections}
          </Text>
          <Text style={styles.networkRow}>
            <Text style={styles.networkLabel}>Network density: </Text>
            {data.networkSummary.densityLabel} ({data.networkSummary.avgConnectionsPerPattern.toFixed(1)} avg connections per pattern)
          </Text>
        </View>

        <PdfFooter title={data.projectName} />
      </Page>
    </Document>
  );
}
