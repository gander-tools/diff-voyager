/**
 * Secure file access utilities for artifact endpoints
 * Prevents path traversal and symlink attacks
 */

import { readFile, realpath, stat } from 'node:fs/promises';
import { resolve, sep } from 'node:path';

export interface SecureFileResult {
  path: string;
  content: Buffer | string;
  isText: boolean;
}

/**
 * Validates and securely accesses a file within the artifacts directory.
 *
 * SECURITY CRITICAL: Implements defense-in-depth:
 * 1. Input validation (null bytes, empty strings)
 * 2. Path traversal check BEFORE symlink resolution
 * 3. File type enforcement (regular file only)
 * 4. Symlink resolution with realpath()
 * 5. Path traversal check AFTER symlink resolution
 *
 * @param artifactsDir - Base artifacts directory
 * @param pageId - Page ID from request (USER INPUT)
 * @param filename - Filename to access
 * @throws Error if validation fails or file doesn't exist
 */
export async function getSecureFile(
  artifactsDir: string,
  pageId: string,
  filename: string,
): Promise<SecureFileResult> {
  // 1. Validate inputs (no null bytes, no empty strings)
  if (!pageId || pageId.trim() === '' || pageId.includes('\0')) {
    throw new Error('Invalid path: pageId is invalid');
  }
  if (!filename || filename.trim() === '' || filename.includes('\0')) {
    throw new Error('Invalid path: filename is invalid');
  }

  // 2. Resolve paths
  const baseDir = resolve(artifactsDir);
  const requestedPath = resolve(baseDir, pageId, filename);

  // 3. FIRST CHECK: Path must be within baseDir (before symlink resolution)
  if (!requestedPath.startsWith(baseDir + sep)) {
    throw new Error('Invalid path: Path traversal attempt detected');
  }

  // 4. Verify file exists and is regular file
  let fileStat: Awaited<ReturnType<typeof stat>>;
  try {
    fileStat = await stat(requestedPath);
  } catch (_error) {
    throw new Error('File not found');
  }

  if (!fileStat.isFile()) {
    throw new Error('Invalid path: Not a regular file');
  }

  // 5. CRITICAL: Resolve symlinks
  let realPath: string;
  try {
    realPath = await realpath(requestedPath);
  } catch (_error) {
    throw new Error('Invalid path: Cannot resolve file path');
  }

  // 6. SECOND CHECK: Real path must still be within baseDir
  //    This prevents symlink attacks (symlink → /etc/passwd)
  if (!realPath.startsWith(baseDir + sep)) {
    throw new Error('Invalid path: Symlink points outside artifacts directory');
  }

  // 7. Read file (text vs binary)
  const isTextFile = filename.endsWith('.html') || filename.endsWith('.har');
  const content = await readFile(realPath, isTextFile ? 'utf-8' : undefined);

  return { path: realPath, content, isText: isTextFile };
}
