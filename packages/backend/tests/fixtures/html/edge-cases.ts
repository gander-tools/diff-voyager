/**
 * Edge case HTML fixtures for testing
 */

export const EMPTY_DOCUMENT = "";

export const MALFORMED_HTML = "<html><head><title>Broken";

export const UNICODE_CONTENT = `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Strona z polskimi znakami: ąęółśżźćń</title>
  <meta name="description" content="Opis ze specjalnymi znakami 🎉">
</head>
<body>
  <h1>Nagłówek z émojis 🚀</h1>
  <p>Treść ze spëcial characters.</p>
</body>
</html>`;

export const LARGE_DOCUMENT = generateLargeHtml(500);

function generateLargeHtml(paragraphs: number): string {
	const content = Array.from(
		{ length: paragraphs },
		(_, i) =>
			`<p>Paragraph ${i + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>`,
	).join("\n");

	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Large Document</title>
</head>
<body>
  <h1>Large Document</h1>
  ${content}
</body>
</html>`;
}

export const NO_META_TAGS = `<!DOCTYPE html>
<html>
<head>
  <title>No Meta Tags</title>
</head>
<body>
  <h1>Page without meta tags</h1>
</body>
</html>`;

export const MULTIPLE_H1 = `<!DOCTYPE html>
<html lang="en">
<head>
  <title>Multiple H1</title>
</head>
<body>
  <h1>First H1</h1>
  <h1>Second H1</h1>
  <h1>Third H1</h1>
</body>
</html>`;
