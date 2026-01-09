#!/usr/bin/env tsx
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const BACKEND_URL = 'http://localhost:3000';
const FRONTEND_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = resolve(process.cwd(), 'docs/screenshots');
const VIEWPORT = { width: 1024, height: 768 };
const SERVER_TIMEOUT = 60000; // 60 seconds
const WAIT_AFTER_LOAD = 500; // 500ms for Vue hydration

interface ProcessInfo {
  process: ReturnType<typeof spawn>;
  name: string;
}

interface Route {
  name: string;
  path: string;
}

/**
 * Wait for a server to be ready by polling its health endpoint
 */
async function waitForServer(url: string, timeout = SERVER_TIMEOUT): Promise<void> {
  const start = Date.now();
  const healthUrl = url.includes('/health') ? url : `${url}/health`;

  while (Date.now() - start < timeout) {
    try {
      const response = await fetch(healthUrl);
      if (response.ok) {
        console.log(`✓ Server ready at ${url}`);
        return;
      }
    } catch {
      // Server not ready yet, continue polling
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`Server at ${url} failed to start within ${timeout}ms`);
}

/**
 * Start a process and return its info
 */
function startProcess(command: string, args: string[], name: string): ProcessInfo {
  console.log(`Starting ${name}...`);
  const proc = spawn(command, args, {
    cwd: process.cwd(),
    stdio: 'pipe',
    shell: true,
  });

  // Log output for debugging
  proc.stdout?.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      console.log(`[${name}] ${output}`);
    }
  });

  proc.stderr?.on('data', (data) => {
    const output = data.toString().trim();
    if (output && !output.includes('DeprecationWarning')) {
      console.error(`[${name}] ${output}`);
    }
  });

  return { process: proc, name };
}

/**
 * Create test data via API
 */
async function createTestData(): Promise<{
  projectId: string;
  pageId: string;
  runId?: string;
}> {
  console.log('\nCreating test data via API...');

  // Create a scan (project + baseline)
  const createScanResponse = await fetch(`${BACKEND_URL}/api/v1/scans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: 'https://example.com',
      name: 'Test Project for Screenshots',
      sync: true,
      crawl: false,
    }),
  });

  if (!createScanResponse.ok) {
    throw new Error(
      `Failed to create scan: ${createScanResponse.status} ${await createScanResponse.text()}`,
    );
  }

  const scanData = await createScanResponse.json();
  console.log(`✓ Created project: ${scanData.id}`);

  // Extract pageId from pages array
  const pageId = scanData.pages?.[0]?.id;
  if (!pageId) {
    throw new Error('No pages found in scan response');
  }
  console.log(`✓ Found page: ${pageId}`);

  // Try to create a run for run-detail screenshot
  let runId: string | undefined;
  try {
    const createRunResponse = await fetch(`${BACKEND_URL}/api/v1/projects/${scanData.id}/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Run for Screenshots',
      }),
    });

    if (createRunResponse.ok) {
      const runData = await createRunResponse.json();
      runId = runData.id;
      console.log(`✓ Created run: ${runId}`);
    }
  } catch (_error) {
    console.warn('Could not create run (might not be implemented yet)');
  }

  return {
    projectId: scanData.id,
    pageId,
    runId,
  };
}

/**
 * Generate screenshots for all routes
 */
async function generateScreenshots(
  projectId: string,
  pageId: string,
  runId?: string,
): Promise<void> {
  console.log('\nGenerating screenshots...');

  // Ensure screenshot directory exists
  await mkdir(SCREENSHOT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();

  const routes: Route[] = [
    { name: '01-dashboard', path: '/' },
    { name: '02-projects-list', path: '/projects' },
    { name: '03-project-create', path: '/projects/new' },
    { name: '04-project-detail', path: `/projects/${projectId}` },
    { name: '05-run-create', path: `/projects/${projectId}/runs/new` },
    { name: '06-run-detail', path: runId ? `/runs/${runId}` : '/runs/placeholder' },
    { name: '07-page-detail', path: `/pages/${pageId}` },
    { name: '08-rules-list', path: '/rules' },
    { name: '09-rule-create', path: '/rules/new' },
    { name: '10-settings', path: '/settings' },
    { name: '11-not-found', path: '/non-existent-route' },
  ];

  for (const route of routes) {
    try {
      const url = `${FRONTEND_URL}${route.path}`;
      console.log(`  Capturing ${route.name}...`);

      await page.goto(url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(WAIT_AFTER_LOAD);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/${route.name}.png`,
        fullPage: false,
      });

      console.log(`  ✓ ${route.name}.png`);
    } catch (error) {
      console.error(`  ✗ Failed to capture ${route.name}:`, error);
    }
  }

  await browser.close();
  console.log(`\n✓ All screenshots saved to ${SCREENSHOT_DIR}`);
}

/**
 * Main execution
 */
async function main() {
  const processes: ProcessInfo[] = [];

  try {
    console.log('=== Screenshot Generation Script ===\n');

    // Start backend
    const backend = startProcess('npm', ['run', 'dev:backend'], 'Backend');
    processes.push(backend);

    // Wait for backend to be ready
    await waitForServer(`${BACKEND_URL}/health`);

    // Start frontend
    const frontend = startProcess('npm', ['run', 'dev:frontend'], 'Frontend');
    processes.push(frontend);

    // Wait for frontend to be ready
    await waitForServer(FRONTEND_URL);

    // Create test data
    const { projectId, pageId, runId } = await createTestData();

    // Generate screenshots
    await generateScreenshots(projectId, pageId, runId);

    console.log('\n=== Screenshot generation completed successfully! ===');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during screenshot generation:', error);
    process.exit(1);
  } finally {
    // Cleanup: kill all spawned processes
    console.log('\nCleaning up processes...');
    for (const { process: proc, name } of processes) {
      try {
        proc.kill('SIGTERM');
        console.log(`✓ Stopped ${name}`);
      } catch (error) {
        console.warn(`Could not stop ${name}:`, error);
      }
    }
  }
}

main();
