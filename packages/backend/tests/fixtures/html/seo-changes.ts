/**
 * SEO change variant fixtures for testing diff detection
 */

export const SEO_TITLE_CHANGED = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Changed Page Title</title>
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

export const SEO_DESCRIPTION_CHANGED = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Test Page Title</title>
  <meta name="description" content="New different description">
  <link rel="canonical" href="http://localhost:3456/page">
  <meta name="robots" content="index, follow">
</head>
<body>
  <h1>Main Heading</h1>
  <h2>Subheading One</h2>
  <p>Content paragraph.</p>
</body>
</html>`;

export const SEO_CANONICAL_CHANGED = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Test Page Title</title>
  <meta name="description" content="Test description">
  <link rel="canonical" href="http://localhost:3456/new-page">
  <meta name="robots" content="index, follow">
</head>
<body>
  <h1>Main Heading</h1>
  <h2>Subheading One</h2>
  <p>Content paragraph.</p>
</body>
</html>`;

export const SEO_ROBOTS_CHANGED = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Test Page Title</title>
  <meta name="description" content="Test description">
  <link rel="canonical" href="http://localhost:3456/page">
  <meta name="robots" content="noindex, nofollow">
</head>
<body>
  <h1>Main Heading</h1>
  <h2>Subheading One</h2>
  <p>Content paragraph.</p>
</body>
</html>`;

export const SEO_H1_CHANGED = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Test Page Title</title>
  <meta name="description" content="Test description">
  <link rel="canonical" href="http://localhost:3456/page">
  <meta name="robots" content="index, follow">
</head>
<body>
  <h1>Changed Main Heading</h1>
  <h2>Subheading One</h2>
  <p>Content paragraph.</p>
</body>
</html>`;

export const SEO_H1_MISSING = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Test Page Title</title>
  <meta name="description" content="Test description">
  <link rel="canonical" href="http://localhost:3456/page">
  <meta name="robots" content="index, follow">
</head>
<body>
  <h2>Subheading One</h2>
  <p>Content paragraph without H1.</p>
</body>
</html>`;

export const SEO_LANG_CHANGED = `<!DOCTYPE html>
<html lang="de">
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

export const SEO_TITLE_MISSING = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
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
