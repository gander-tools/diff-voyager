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
