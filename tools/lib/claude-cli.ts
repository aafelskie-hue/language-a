/**
 * Claude Code CLI Utility
 * Shared wrapper for executing Claude via the CLI instead of SDK
 */

import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface ClaudeCliOptions {
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number; // milliseconds
  useWebSearch?: boolean;
}

export interface ClaudeCliResult {
  text: string;
  success: boolean;
  error?: string;
}

/**
 * Default timeout: 5 minutes
 */
const DEFAULT_TIMEOUT = 5 * 60 * 1000;

/**
 * Execute Claude Code CLI with a prompt
 */
export async function runClaude(
  prompt: string,
  options: ClaudeCliOptions = {}
): Promise<ClaudeCliResult> {
  const {
    systemPrompt,
    timeout = DEFAULT_TIMEOUT,
    useWebSearch = false,
  } = options;

  // Build the combined prompt
  let fullPrompt = '';

  if (systemPrompt) {
    fullPrompt += `<system>\n${systemPrompt}\n</system>\n\n`;
  }

  if (useWebSearch) {
    fullPrompt += `<instructions>
You have access to web search. Search the web to find accurate, up-to-date information to complete this task.
After searching, provide your response in the exact format requested.
</instructions>\n\n`;
  }

  fullPrompt += prompt;

  // Write prompt to a temp file to avoid shell escaping issues
  const tempFile = path.join(os.tmpdir(), `claude-prompt-${Date.now()}.txt`);

  try {
    fs.writeFileSync(tempFile, fullPrompt, 'utf-8');

    // Read prompt from file using bash redirection
    const result = execFileSync('/bin/bash', [
      '-c',
      `cat "${tempFile}" | claude -p - --output-format text`,
    ], {
      timeout,
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024, // 10MB
      env: { ...process.env },
    });

    return {
      text: result.trim(),
      success: true,
    };
  } catch (error) {
    if (error instanceof Error) {
      // Check for timeout
      if ('killed' in error && (error as NodeJS.ErrnoException).killed) {
        return {
          text: '',
          success: false,
          error: `Timeout after ${timeout / 1000} seconds`,
        };
      }

      // Check for exec errors
      const execError = error as { stdout?: string; stderr?: string; status?: number };
      if (execError.stdout) {
        return {
          text: execError.stdout,
          success: false,
          error: execError.stderr || `Process exited with code ${execError.status}`,
        };
      }

      return {
        text: '',
        success: false,
        error: error.message,
      };
    }

    return {
      text: '',
      success: false,
      error: String(error),
    };
  } finally {
    // Clean up temp file
    try {
      fs.unlinkSync(tempFile);
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Execute Claude and extract JSON from the response
 */
export async function runClaudeForJson<T>(
  prompt: string,
  options: ClaudeCliOptions = {}
): Promise<{ data: T | null; raw: string; error?: string }> {
  const result = await runClaude(prompt, options);

  if (!result.success) {
    return {
      data: null,
      raw: result.text,
      error: result.error,
    };
  }

  // Try to extract JSON from the response
  const jsonStr = extractJson(result.text);

  try {
    const data = JSON.parse(jsonStr) as T;
    return { data, raw: result.text };
  } catch (e) {
    return {
      data: null,
      raw: result.text,
      error: `Failed to parse JSON: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

/**
 * Extract JSON from text that may have preamble or markdown fences
 */
export function extractJson(text: string): string {
  // Try to find JSON block with markdown fences
  const fencedMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (fencedMatch) {
    return fencedMatch[1].trim();
  }

  // Try to find JSON array or object pattern
  const jsonMatch = text.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
  if (jsonMatch) {
    return jsonMatch[0];
  }

  // Fallback: strip common preamble and try the whole thing
  return text.replace(/```json\s*|```\s*/g, '').trim();
}

/**
 * Delay helper for rate limiting
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
