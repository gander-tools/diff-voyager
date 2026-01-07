/**
 * Artifact API routes (GET /artifacts/:pageId/*)
 */

import { readFile, realpath, stat } from "node:fs/promises";
import { resolve, sep } from "node:path";
import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import {
	FILE_SYSTEM_RATE_LIMIT,
	LARGE_FILE_RATE_LIMIT,
} from "../middleware/rate-limiting.js";

interface ArtifactRoutesOptions extends FastifyPluginOptions {
	artifactsDir: string;
}

/**
 * Sends an error response with standardized format.
 *
 * @param reply - Fastify reply object
 * @param status - HTTP status code
 * @param code - Error code
 * @param message - Error message
 */
function sendErrorResponse(
	reply: any,
	status: number,
	code: string,
	message: string,
): void {
	reply.status(status).send({
		error: {
			code,
			message,
		},
	});
}

/**
 * Validates and securely accesses a file within the artifacts directory.
 * Prevents path traversal attacks, symlink attacks, and directory traversal.
 *
 * @param artifactsDir - The base artifacts directory
 * @param pageId - The page ID from the request (user input)
 * @param filename - The filename to access
 * @returns Object with validated file path and file content
 * @throws Error if validation fails or file doesn't exist
 */
async function getSecureFile(
	artifactsDir: string,
	pageId: string,
	filename: string,
): Promise<{ path: string; content: Buffer | string; isText: boolean }> {
	// Validate inputs are not empty and don't contain null bytes
	if (!pageId || pageId.trim() === "" || pageId.includes("\0")) {
		throw new Error("Invalid path: pageId is invalid");
	}
	if (!filename || filename.trim() === "" || filename.includes("\0")) {
		throw new Error("Invalid path: filename is invalid");
	}

	// Resolve base directory
	const baseDir = resolve(artifactsDir);
	const requestedPath = resolve(baseDir, pageId, filename);

	// FIRST CHECK: Ensure requested path is within base directory (before resolving symlinks)
	if (!requestedPath.startsWith(baseDir + sep)) {
		throw new Error("Invalid path: Path traversal attempt detected");
	}

	// Check if file exists
	let fileStat: Awaited<ReturnType<typeof stat>>;
	try {
		fileStat = await stat(requestedPath);
	} catch (error) {
		throw new Error("File not found");
	}

	// Ensure it's a regular file (not directory, socket, etc.)
	if (!fileStat.isFile()) {
		throw new Error("Invalid path: Not a regular file");
	}

	// CRITICAL: Resolve symlinks and verify real path is still within baseDir
	// This prevents symlink attacks where someone creates a symlink to /etc/passwd
	let realPath: string;
	try {
		realPath = await realpath(requestedPath);
	} catch (error) {
		throw new Error("Invalid path: Cannot resolve file path");
	}

	// SECOND CHECK: Ensure the real path (after resolving symlinks) is within baseDir
	if (!realPath.startsWith(baseDir + sep)) {
		throw new Error("Invalid path: Symlink points outside artifacts directory");
	}

	// Determine if file should be read as text or binary
	const isTextFile = filename.endsWith(".html") || filename.endsWith(".har");

	// Read file content
	const content = await readFile(realPath, isTextFile ? "utf-8" : undefined);

	return { path: realPath, content, isText: isTextFile };
}

export async function registerArtifactRoutes(
	app: FastifyInstance,
	options: ArtifactRoutesOptions,
): Promise<void> {
	const { artifactsDir } = options;

	// Screenshot
	app.get<{ Params: { pageId: string } }>(
		"/artifacts/:pageId/screenshot",
		{
			config: FILE_SYSTEM_RATE_LIMIT,
			schema: {
				tags: ["artifacts"],
				description: "Get page screenshot (PNG)",
				params: {
					type: "object",
					required: ["pageId"],
					properties: {
						pageId: {
							type: "string",
							description: "Page ID",
						},
					},
				},
				response: {
					200: {
						description: "Screenshot image",
						type: "string",
						format: "binary",
					},
					404: {
						description: "Screenshot not found",
						type: "object",
						properties: {
							error: {
								type: "object",
								properties: {
									code: { type: "string" },
									message: { type: "string" },
								},
							},
						},
					},
				},
			},
		},
		async (request, reply) => {
			const { pageId } = request.params;

			try {
				const file = await getSecureFile(
					artifactsDir,
					pageId,
					"screenshot.png",
				);
				return reply
					.header("Content-Type", "image/png")
					.header("Content-Disposition", 'inline; filename="screenshot.png"')
					.send(file.content);
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "Unknown error";
				if (message.includes("not found")) {
					return sendErrorResponse(
						reply,
						404,
						"NOT_FOUND",
						"Screenshot not found",
					);
				}
				return sendErrorResponse(
					reply,
					400,
					"INVALID_REQUEST",
					"Invalid request",
				);
			}
		},
	);

	// Baseline screenshot
	app.get<{ Params: { pageId: string } }>(
		"/artifacts/:pageId/baseline-screenshot",
		{
			config: FILE_SYSTEM_RATE_LIMIT,
			schema: {
				tags: ["artifacts"],
				description: "Get baseline screenshot (PNG)",
				params: {
					type: "object",
					required: ["pageId"],
					properties: {
						pageId: {
							type: "string",
							description: "Page ID",
						},
					},
				},
				response: {
					200: {
						description: "Baseline screenshot image",
						type: "string",
						format: "binary",
					},
					404: {
						description: "Baseline screenshot not found",
						type: "object",
						properties: {
							error: {
								type: "object",
								properties: {
									code: { type: "string" },
									message: { type: "string" },
								},
							},
						},
					},
				},
			},
		},
		async (request, reply) => {
			const { pageId } = request.params;

			try {
				const file = await getSecureFile(
					artifactsDir,
					pageId,
					"baseline-screenshot.png",
				);
				return reply.header("Content-Type", "image/png").send(file.content);
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "Unknown error";
				if (message.includes("not found")) {
					return sendErrorResponse(
						reply,
						404,
						"NOT_FOUND",
						"Baseline screenshot not found",
					);
				}
				return sendErrorResponse(
					reply,
					400,
					"INVALID_REQUEST",
					"Invalid request",
				);
			}
		},
	);

	// Diff image
	app.get<{ Params: { pageId: string } }>(
		"/artifacts/:pageId/diff",
		{
			config: FILE_SYSTEM_RATE_LIMIT,
			schema: {
				tags: ["artifacts"],
				description: "Get visual diff image (PNG)",
				params: {
					type: "object",
					required: ["pageId"],
					properties: {
						pageId: {
							type: "string",
							description: "Page ID",
						},
					},
				},
				response: {
					200: {
						description: "Diff image",
						type: "string",
						format: "binary",
					},
					404: {
						description: "Diff image not found",
						type: "object",
						properties: {
							error: {
								type: "object",
								properties: {
									code: { type: "string" },
									message: { type: "string" },
								},
							},
						},
					},
				},
			},
		},
		async (request, reply) => {
			const { pageId } = request.params;

			try {
				const file = await getSecureFile(artifactsDir, pageId, "diff.png");
				return reply
					.header("Content-Type", "image/png")
					.header("Content-Disposition", 'inline; filename="diff.png"')
					.send(file.content);
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "Unknown error";
				if (message.includes("not found")) {
					return sendErrorResponse(
						reply,
						404,
						"NOT_FOUND",
						"Diff image not found",
					);
				}
				return sendErrorResponse(
					reply,
					400,
					"INVALID_REQUEST",
					"Invalid request",
				);
			}
		},
	);

	// HAR file
	app.get<{ Params: { pageId: string } }>(
		"/artifacts/:pageId/har",
		{
			config: LARGE_FILE_RATE_LIMIT,
			schema: {
				tags: ["artifacts"],
				description: "Get HAR (HTTP Archive) file for performance analysis",
				params: {
					type: "object",
					required: ["pageId"],
					properties: {
						pageId: {
							type: "string",
							description: "Page ID",
						},
					},
				},
				response: {
					200: {
						description: "HAR file (JSON)",
						type: "object",
					},
					404: {
						description: "HAR file not found",
						type: "object",
						properties: {
							error: {
								type: "object",
								properties: {
									code: { type: "string" },
									message: { type: "string" },
								},
							},
						},
					},
				},
			},
		},
		async (request, reply) => {
			const { pageId } = request.params;

			try {
				const file = await getSecureFile(artifactsDir, pageId, "page.har");
				return reply
					.header("Content-Type", "application/json")
					.header("Content-Disposition", 'attachment; filename="page.har"')
					.send(file.content);
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "Unknown error";
				if (message.includes("not found")) {
					return sendErrorResponse(
						reply,
						404,
						"NOT_FOUND",
						"HAR file not found",
					);
				}
				return sendErrorResponse(
					reply,
					400,
					"INVALID_REQUEST",
					"Invalid request",
				);
			}
		},
	);

	// HTML
	app.get<{ Params: { pageId: string } }>(
		"/artifacts/:pageId/html",
		{
			config: LARGE_FILE_RATE_LIMIT,
			schema: {
				tags: ["artifacts"],
				description: "Get captured HTML content",
				params: {
					type: "object",
					required: ["pageId"],
					properties: {
						pageId: {
							type: "string",
							description: "Page ID",
						},
					},
				},
				response: {
					200: {
						description: "HTML content",
						type: "string",
					},
					404: {
						description: "HTML file not found",
						type: "object",
						properties: {
							error: {
								type: "object",
								properties: {
									code: { type: "string" },
									message: { type: "string" },
								},
							},
						},
					},
				},
			},
		},
		async (request, reply) => {
			const { pageId } = request.params;

			try {
				const file = await getSecureFile(artifactsDir, pageId, "page.html");
				return reply
					.header("Content-Type", "text/html; charset=utf-8")
					.send(file.content);
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "Unknown error";
				if (message.includes("not found")) {
					return sendErrorResponse(
						reply,
						404,
						"NOT_FOUND",
						"HTML file not found",
					);
				}
				return sendErrorResponse(
					reply,
					400,
					"INVALID_REQUEST",
					"Invalid request",
				);
			}
		},
	);
}
