import { MetadataRoute } from 'next'

import patterns from '@/data/patterns.json'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.language-a.com'

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date('2026-02-20'),
      changeFrequency: 'monthly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/patterns`,
      lastModified: new Date('2026-02-20'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/network`,
      lastModified: new Date('2026-02-20'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/guide`,
      lastModified: new Date('2026-02-20'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/projects`,
      lastModified: new Date('2026-02-20'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/consult`,
      lastModified: new Date('2026-02-20'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date('2026-02-20'),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date('2026-02-20'),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ]

  // Pattern pages — one URL per pattern using reading_order for URLs
  const patternPages: MetadataRoute.Sitemap = patterns.map((pattern: { reading_order: number }) => ({
    url: `${baseUrl}/patterns/${pattern.reading_order}`,
    lastModified: new Date('2026-02-20'),
    changeFrequency: 'yearly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...patternPages]
}
