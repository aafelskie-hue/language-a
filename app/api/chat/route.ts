import { NextRequest, NextResponse } from 'next/server';
import { patterns } from '@/lib/patterns';

// Mock response for demo - ready for Anthropic API integration
export async function POST(request: NextRequest) {
  try {
    const { message, projectPatternIds } = await request.json();

    // Check for API key
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (apiKey) {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 1024,
          system: getSystemPrompt(projectPatternIds),
          messages: [{ role: 'user', content: message }],
        }),
      });

      if (!response.ok) {
        console.error('Anthropic API error:', response.status, await response.text());
        throw new Error('Anthropic API request failed');
      }

      const data = await response.json();
      return NextResponse.json({ message: data.content[0].text });
    }

    // Mock response for demo
    const mockResponse = generateMockResponse(message, projectPatternIds);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json({ message: mockResponse });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}

function generateMockResponse(message: string, projectPatternIds?: number[]): string {
  const lowerMessage = message.toLowerCase();

  // Pattern-specific responses
  if (lowerMessage.includes('cold') || lowerMessage.includes('winter') || lowerMessage.includes('edmonton') || lowerMessage.includes('northern')) {
    return `For cold-climate projects, I'd recommend starting with these key patterns:

**Pattern 58: The Winter City Street** - Design streets for the worst month, not the best. Orient pedestrian routes for maximum sun exposure in winter.

**Pattern 59: The Heated Threshold** - Create a proper vestibule (at least 3 square meters) with radiant floor heat, bench, and storage. This is essential at -30°C.

**Pattern 61: The Dark Season Room** - Designate one south-facing room with maximum winter solar gain and full-spectrum lighting. This addresses the psychological toll of northern winters.

**Pattern 63: The Covered Connection** - Between any two buildings used daily, provide covered, wind-protected walkways.

These patterns work together - the heated threshold (59) connects to the entrance sequence (35), and the dark season room (61) builds on south-facing living (38). Would you like me to explore the connections in more detail?`;
  }

  if (lowerMessage.includes('home office') || lowerMessage.includes('work from home') || lowerMessage.includes('remote work')) {
    return `For a successful home office setup, consider this sequence of patterns:

**Pattern 5: The Home Office Threshold** - The most critical pattern. Create a physical transition between workspace and living space - not just a door, but a change in level, light quality, or passage through a buffer space.

**Pattern 6: The Fifteen-Minute Shed** - If possible, a small separate structure within the property. Even 10 square meters, heated and insulated, transforms the work-from-home experience.

**Pattern 7: The Zoom Room** - A dedicated 2 square meter enclosure for video calls. Separate from the main office - the office is for thinking, the Zoom Room is for performing.

**Pattern 34: Light on Two Sides** - Give your workspace natural light from at least two directions. This affects mood, productivity, and circadian rhythm.

Start with Pattern 5 - the threshold is what makes the separation real. Do you have a specific space in mind?`;
  }

  if (lowerMessage.includes('renovation') || lowerMessage.includes('retrofit') || lowerMessage.includes('existing')) {
    return `For existing building renovations, these patterns are particularly relevant:

**Pattern 28: Heritage Retrofit** - Work from the inside and hidden surfaces. Insulate attic first, then basement, then interior walls. Never wrap the exterior of a building worth preserving.

**Pattern 49: The Repaired Building** - Design so layers are independent and accessible. Structure exposed or inspectable, mechanical systems in accessible chases.

**Pattern 27: Office-to-Housing Conversion** - If converting commercial space, the key move is carving light wells to bring daylight to deep floor plates.

**Pattern 47: Living Surfaces** - Choose materials that age well - wood, stone, tile, lime plaster. Avoid surfaces that peak on installation day.

What's the nature of your renovation - is it primarily energy performance, adapting to new uses, or restoring character?`;
  }

  if (lowerMessage.includes('neighbor') || lowerMessage.includes('community') || lowerMessage.includes('neighborhood')) {
    return `For neighborhood-scale thinking, start with these foundational patterns:

**Pattern 1: The Fifteen-Minute Neighborhood** - The primary test: can residents reach groceries, school, park, clinic, gathering place, and transit within fifteen minutes on foot or by bicycle?

**Pattern 41: The Identifiable Neighborhood** - Roughly 500 people - small enough that residents recognize each other, large enough to support a gathering place.

**Pattern 42: Common Ground** - Reserve at least 10% of land as collectively owned space - gardens, courtyards, playgrounds.

**Pattern 2: The Third Place Network** - Ensure at least five distinct third places serving different social functions - morning quiet, informal gathering, active socializing, creative work, intergenerational mixing.

These work together to create the social fabric that makes a neighborhood more than just houses. Which aspect interests you most?`;
  }

  // Default response
  return `Thank you for your question about pattern-based design. Language A contains 100 interconnected patterns across three scales: Neighborhood, Building, and Construction.

To give you specific guidance, it helps to know:
1. **Scale** - Are you working on a neighborhood, building, or construction detail?
2. **Climate** - Is this for a cold climate (northern winters), or somewhere milder?
3. **Context** - New construction, renovation, or planning?

Some good starting points:
- For any project: **Pattern 34: Light on Two Sides** and **Pattern 35: The Entrance Sequence**
- For cold climates: **Pattern 22: Building Envelope as Climate System** and **Pattern 59: The Heated Threshold**
- For housing: **Pattern 12: The Missing Middle** and **Pattern 14: The Multigenerational Suite**

What's the nature of your project?`;
}

function getSystemPrompt(projectPatternIds?: number[]): string {
  let prompt = `You are a design pattern consultant for Language A — design patterns for enduring places. You help people apply the 100 patterns to real design situations: new homes, renovations, neighborhood planning, climate-resilient building, and community development.

Language A contains design patterns for enduring places — grounded in the forces that don't change. The patterns span three scales: Neighborhood, Building, and Construction.

When a user describes a project or design challenge:
1. Identify the most relevant patterns by number and name
2. Explain WHY each pattern applies to their specific situation
3. Suggest a sequence — start from neighborhood-scale patterns and work down to construction details
4. Reference connections between patterns to show how they reinforce each other
5. Be practical and specific, not abstract
6. For cold-climate projects, prioritize the Northern/Cold-Climate patterns (58–64) and the Energy & Envelope patterns (21–23)

You have access to all 100 patterns and their interconnections. Always reference patterns by their number and name (e.g., "Pattern 6: The Fifteen-Minute Shed").

Tone: Thoughtful, warm, practical. Like an experienced builder walking through a site with a friend.`;

  if (projectPatternIds && projectPatternIds.length > 0) {
    const projectPatterns = projectPatternIds
      .map(id => patterns.find(p => p.id === id))
      .filter(Boolean)
      .map(p => `Pattern ${p!.number}: ${p!.name}`)
      .join(', ');

    prompt += `\n\nThe user has an active project with these patterns: ${projectPatterns}. Consider these when making recommendations.`;
  }

  return prompt;
}
