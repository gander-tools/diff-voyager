/**
 * Mock HTTP server for integration tests
 * Serves controlled HTML documents for testing diff detection
 */

import {
	createServer,
	type IncomingMessage,
	type Server,
	type ServerResponse,
} from "node:http";

export interface MockRoute {
	path: string;
	method?: "GET" | "POST";
	status?: number;
	headers?: Record<string, string>;
	body: string | (() => string);
	delay?: number;
}

export interface MockServerConfig {
	port?: number;
	routes: MockRoute[];
}

export interface RequestLogEntry {
	method: string;
	path: string;
	timestamp: Date;
}

export class MockServer {
	private server: Server | null = null;
	private routes: Map<string, MockRoute> = new Map();
	private requestLog: RequestLogEntry[] = [];
	private port: number;

	constructor(private config: MockServerConfig) {
		this.port = config.port || 0; // 0 = random available port
		for (const route of config.routes) {
			const key = `${route.method || "GET"}:${route.path}`;
			this.routes.set(key, route);
		}
	}

	async start(): Promise<string> {
		return new Promise((resolve, reject) => {
			this.server = createServer(
				(req: IncomingMessage, res: ServerResponse) => {
					this.handleRequest(req, res);
				},
			);

			this.server.on("error", reject);
			this.server.listen(this.port, "127.0.0.1", () => {
				const address = this.server?.address();
				if (address && typeof address === "object") {
					this.port = address.port;
					resolve(`http://127.0.0.1:${this.port}`);
				} else {
					reject(new Error("Failed to get server address"));
				}
			});
		});
	}

	async stop(): Promise<void> {
		return new Promise((resolve, reject) => {
			if (!this.server) {
				resolve();
				return;
			}
			this.server.close((err) => {
				if (err) reject(err);
				else resolve();
			});
		});
	}

	private handleRequest(req: IncomingMessage, res: ServerResponse): void {
		const method = req.method || "GET";
		const path = req.url || "/";

		this.requestLog.push({
			method,
			path,
			timestamp: new Date(),
		});

		const key = `${method}:${path}`;
		const route = this.routes.get(key);

		if (!route) {
			res.writeHead(404, { "Content-Type": "text/plain" });
			res.end("Not Found");
			return;
		}

		const respond = () => {
			const status = route.status || 200;
			const headers = {
				"Content-Type": "text/html; charset=utf-8",
				...route.headers,
			};

			res.writeHead(status, headers);
			const body = typeof route.body === "function" ? route.body() : route.body;
			res.end(body);
		};

		if (route.delay) {
			setTimeout(respond, route.delay);
		} else {
			respond();
		}
	}

	getRequestLog(): RequestLogEntry[] {
		return [...this.requestLog];
	}

	clearRequestLog(): void {
		this.requestLog = [];
	}

	updateRoute(path: string, update: Partial<MockRoute>): void {
		const key = `GET:${path}`;
		const existing = this.routes.get(key);
		if (existing) {
			this.routes.set(key, { ...existing, ...update });
		} else {
			this.routes.set(key, {
				path,
				body: "",
				...update,
			});
		}
	}

	setRoute(path: string, body: string): void {
		this.updateRoute(path, { body });
	}
}
