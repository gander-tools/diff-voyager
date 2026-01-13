# Security Guidelines

**CRITICAL:** Security vulnerabilities MUST be prevented at all times. Follow these mandatory rules:

## API Security

### 1. Rate Limiting

- ALL API endpoints that perform file system operations MUST have rate limiting
- Use `@fastify/rate-limit` for Fastify routes
- Configure appropriate limits per endpoint based on resource intensity
- Example:
  ```typescript
  app.get('/artifacts/:id/file', {
    config: { rateLimit: { max: 50, timeWindow: '1 minute' } }
  }, handler);
  ```

### 2. Path Traversal Prevention

- NEVER use user input directly in file paths with `path.join()`, `fs.readFile()`, etc.
- ALWAYS validate inputs (check for empty strings, null bytes)
- ALWAYS validate requested paths stay within allowed directories
- ALWAYS resolve symlinks and validate the real path
- Example secure file access function:
  ```typescript
  async function getSecureFile(baseDir: string, userPath: string, filename: string) {
    // Validate inputs (no empty strings, no null bytes)
    if (!userPath || userPath.includes('\0') || !filename || filename.includes('\0')) {
      throw new Error('Invalid path');
    }

    const base = resolve(baseDir);
    const requested = resolve(base, userPath, filename);

    // FIRST CHECK: Path must be within baseDir
    if (!requested.startsWith(base + sep)) {
      throw new Error('Path traversal detected');
    }

    // Verify file exists and is a regular file
    const fileStat = await stat(requested);
    if (!fileStat.isFile()) {
      throw new Error('Not a regular file');
    }

    // CRITICAL: Resolve symlinks and verify real path
    const realPath = await realpath(requested);

    // SECOND CHECK: Real path must still be within baseDir
    // This prevents symlink attacks
    if (!realPath.startsWith(base + sep)) {
      throw new Error('Symlink points outside allowed directory');
    }

    return await readFile(realPath);
  }
  ```

### 3. Input Validation

- Validate ALL user inputs at API boundaries
- Reject malformed requests early
- Use schema validation (Fastify schemas, Zod, etc.)
- Sanitize inputs before use

### 4. OWASP Top 10 Prevention

- **Command Injection**: Never pass user input to shell commands
- **SQL Injection**: Use parameterized queries (we use prepared statements)
- **XSS**: Sanitize HTML output when serving user content
- **SSRF**: Validate and restrict URLs for crawling
- **Insecure Deserialization**: Validate JSON schemas

## Code Quality for Security

### 1. Indentation and Formatting

- ALWAYS maintain correct code indentation
- Use Biome formatter before committing
- Incorrect indentation can hide logic errors that lead to vulnerabilities

### 2. Error Handling

- Never expose internal errors to users
- Log detailed errors internally
- Return generic error messages externally
- Handle all async rejections

### 3. Testing

- Write security tests for all validation logic
- Test path traversal prevention
- Test rate limiting behavior
- Test input validation edge cases

## Pre-Commit Checklist

Before committing ANY code that:
- Accepts user input
- Performs file system operations
- Executes external commands
- Handles authentication/authorization

Verify:
- [ ] Rate limiting is applied (if file system or expensive operation)
- [ ] Path traversal is prevented (if file paths involved)
- [ ] Input validation is present
- [ ] Error handling doesn't leak information
- [ ] Tests cover security scenarios
- [ ] Code is properly formatted (run `npm run format`)

## Common Vulnerabilities to AVOID

**NEVER:**
- Use `path.join(baseDir, req.params.userId)` without validation
- Execute file operations without rate limiting
- Pass user input to `exec()`, `spawn()`, or similar
- Trust user input for file names, paths, or commands
- Skip input validation "just for MVP"

**ALWAYS:**
- Validate paths stay within allowed directories
- Apply rate limiting to resource-intensive endpoints
- Sanitize and validate all user inputs
- Use parameterized queries for database operations
- Test security features explicitly

## Related Documentation

- [Backend Development](backend-dev.md) - Backend implementation patterns
- [@ts-rest Guide](ts-rest.md) - Type-safe API contract
- [Drizzle ORM Guide](drizzle-orm.md) - Database query patterns
