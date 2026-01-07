/**
 * Comparison HTML fixtures for testing multiple runs
 * These represent modified versions of baseline pages
 */

export const CONTENT_CHANGE = `<!DOCTYPE html>
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
  <p>Modified Content</p>
</body>
</html>`;

export const VISUAL_CHANGE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Test Page Title</title>
  <meta name="description" content="Test description">
  <link rel="canonical" href="http://localhost:3456/page">
  <meta name="robots" content="index, follow">
  <style>
    body { background-color: red; }
  </style>
</head>
<body>
  <h1>Main Heading</h1>
  <h2>Subheading One</h2>
  <p>Content paragraph.</p>
</body>
</html>`;

export const STRUCTURE_CHANGE = `<!DOCTYPE html>
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
  <h3>New Subheading</h3>
  <p>Content paragraph.</p>
  <div>New section</div>
</body>
</html>`;
