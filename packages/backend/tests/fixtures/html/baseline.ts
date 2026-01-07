/**
 * Baseline HTML fixtures for testing
 */

export const BASELINE_SIMPLE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Test Page Title</title>
  <meta name="description" content="Test description">
  <link rel="canonical" href="http://localhost:3456/page">
  <meta name="robots" content="index, follow">
</head>
<body>
  <h1>Main Heading</h1>
  <h2>Subheading One</h2>
  <p>Content paragraph.</p>
</body>
</html>`;

export const BASELINE_WITH_LINKS = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Page With Links</title>
  <meta name="description" content="A page containing links">
</head>
<body>
  <h1>Page With Links</h1>
  <nav>
    <a href="/page-1">Link to Page 1</a>
    <a href="/page-2">Link to Page 2</a>
    <a href="/page-3">Link to Page 3</a>
  </nav>
</body>
</html>`;

export const BASELINE_MINIMAL = `<!DOCTYPE html>
<html>
<head>
  <title>Minimal Page</title>
</head>
<body>
  <h1>Minimal</h1>
</body>
</html>`;

export const BASELINE_FULL_SEO = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Full SEO Test Page</title>
  <meta name="description" content="This is a comprehensive test page with full SEO metadata">
  <link rel="canonical" href="http://localhost:3456/seo-page">
  <meta name="robots" content="index, follow">
  <meta property="og:title" content="Full SEO Test Page">
  <meta property="og:description" content="Open Graph description">
</head>
<body>
  <h1>Main SEO Heading</h1>
  <h2>Secondary Heading</h2>
  <p>This page contains comprehensive SEO metadata for testing purposes.</p>
  <p>Multiple paragraphs ensure we capture content properly.</p>
</body>
</html>`;
