# Backend Integration Tests

This file is part of the test documentation. See [../tests.md](../tests.md) for the overview.

## integration

### storage

#### Project Repository Comparison (SQL vs Drizzle)

##### create()

- should produce identical results

    when creating projects with SQL and Drizzle implementations, both return the same structure with valid UUID, matching names, status set to NEW, and Date objects for timestamps

- should handle description field identically

    when creating projects with or without descriptions, both implementations store descriptions correctly when provided and leave as undefined when omitted

- should serialize JSON config identically

    when creating projects with complex config objects including nested viewport and multiple settings, both implementations serialize and deserialize JSON config identically

##### findById()

- should return same result for existing project

    when finding a project by ID, both SQL and Drizzle implementations return identical project objects with matching IDs, names, and configurations

- should both return null for non-existent project

    when finding a project with a non-existent ID, both implementations return null

- should properly deserialize JSON config

    when retrieving a project with complex nested config, both implementations correctly deserialize all config properties from JSON

##### findAll()

- should return same projects in same order

    when retrieving all projects, both implementations return the same projects in the same order (DESC by created_at with newest first) with matching IDs and names

- should handle pagination identically

    when using limit and offset parameters, both implementations return the same subset of projects for each page with accurate total counts across all pages

- should both return empty array when no projects

    when finding projects in an empty database, both implementations return empty array with zero total count

##### updateStatus()

- should update status identically

    when updating a project's status, both implementations change the status value to the new status

- should update updatedAt timestamp

    when updating a project's status, both implementations set the updatedAt timestamp to a value greater than the original

##### Edge cases

- should handle special characters in names identically

    when creating projects with special characters in names (quotes, apostrophes, ampersands), both implementations store and retrieve the names correctly without corruption

- should handle concurrent operations consistently

    when creating multiple projects concurrently using SQL and retrieving with Drizzle, all projects are present with matching IDs

#### Run Repository Comparison (SQL vs Drizzle)

##### create()

- should produce identical results

    when creating runs with SQL and Drizzle implementations, both return the same structure with valid UUID, matching project IDs, status set to NEW, correct isBaseline flag, and Date for createdAt

- should handle baseline flag identically

    when creating baseline and comparison runs with different isBaseline values, both implementations correctly store and distinguish between baseline (true) and comparison (false) runs

- should serialize JSON config identically

    when creating runs with config objects, both implementations serialize and deserialize the config identically

##### findById()

- should return same result for existing run

    when finding a run by ID, both SQL and Drizzle implementations return identical run objects with matching IDs

- should both return null for non-existent run

    when finding a run with a non-existent ID, both implementations return null

- should properly deserialize JSON config and statistics

    when retrieving a run with config and statistics, both implementations correctly deserialize all JSON fields identically

##### findByProjectId()

- should return same runs in same order

    when retrieving runs for a project, both implementations return the same runs in the same order (DESC by created_at with newest first) with matching IDs and isBaseline flags

- should both return empty array for non-existent project

    when finding runs for a non-existent project, both implementations return empty array

##### updateStatus()

- should update status identically

    when updating a run's status, both implementations change the status value to the new status

- should set started_at for IN_PROGRESS status

    when updating status to IN_PROGRESS, both implementations set the startedAt timestamp to a Date object and leave completedAt undefined

- should set completed_at for COMPLETED status

    when updating status to COMPLETED, both implementations set the completedAt timestamp to a Date object

- should not set timestamps for other statuses

    when updating status to values other than IN_PROGRESS or COMPLETED, both implementations do not modify startedAt or completedAt timestamps

##### updateStatistics()

- should update statistics identically

    when updating run statistics with counts for various page states, both implementations store all statistics values correctly

- should overwrite existing statistics

    when updating statistics multiple times, both implementations replace the previous statistics object with new values

##### Edge cases

- should handle concurrent operations consistently

    when creating multiple runs concurrently using SQL and retrieving with Drizzle, all runs are present with matching IDs

#### Diff Repository Comparison (SQL vs Drizzle)

##### create

- should create identical diff records

    when creating diffs with SQL repo and reading back with both repos, all implementations return the same UUID ID with matching pageId, runId, snapshot IDs, summary, and changes

- should handle empty changes array identically

    when creating a diff with no changes and hasChanges set to false, both implementations correctly store an empty changes array and zero change counts

- should serialize complex nested JSON identically

    when creating a diff with deeply nested JSON structures in summary and changes including custom metrics and metadata, both implementations correctly serialize and store all nested data

##### findByPageAndRun

- should return identical results

    when finding a diff by page ID and run ID after creation, both SQL and Drizzle implementations return the same diff with matching ID, summary, and changes

- should both return null when not exists

    when finding a diff with non-existent page ID, both implementations return null

- should deserialize JSON identically

    when retrieving a diff with multiple changes of different types, both implementations correctly deserialize all JSON fields, preserve change types, and maintain correct array length

##### findByRun

- should return identical results for multiple diffs

    when finding diffs by run ID with multiple pages, both implementations return all diffs associated with that run ID with matching IDs and page IDs

- should both return empty array when no diffs

    when finding diffs for a non-existent run, both implementations return empty array

- should order by created_at DESC identically

    when multiple diffs exist for a run, both implementations return them ordered by creation time with the most recently created diff first

#### Page Repository Comparison (SQL vs Drizzle)

##### create()

- should produce identical results

    when creating pages with SQL and Drizzle implementations, both return the same structure with valid UUID, matching project IDs, and Date objects for createdAt

##### findById()

- should return same result for existing page

    when finding a page by ID, both SQL and Drizzle implementations return identical page objects with matching IDs

- should both return null for non-existent page

    when finding a page with a non-existent ID, both implementations return null

##### findByProjectId()

- should return same pages in same order

    when retrieving pages for a project, both implementations return the same pages with matching IDs and normalized URLs

- should both return empty array for non-existent project

    when finding pages for a non-existent project, both implementations return empty array

##### findByNormalizedUrl()

- should return same page

    when finding a page by project ID and normalized URL, both implementations return the page with matching normalized URL, project ID, and ID

- should both return null when not found

    when finding a page by normalized URL that doesn't exist, both implementations return null

##### findOrCreate()

- should both find existing page

    when calling findOrCreate with a normalized URL that already exists, both implementations return the existing page with the same ID instead of creating a new one

- should both create when not found

    when calling findOrCreate with a normalized URL that doesn't exist, both implementations create a new page record with valid UUID and store it in the database

##### Edge cases

- should handle special characters identically

    when creating pages with special characters in URLs, both implementations store and retrieve URLs correctly without corruption

- should handle concurrent operations consistently

    when creating multiple pages concurrently using SQL and retrieving with Drizzle, all pages are present with matching IDs

### security

#### Advanced Path Traversal Security

##### Classic Path Traversal Attacks

- should block double dot traversal (../)

    when attempting path traversal using ../ sequences, returns 400 or 404 status and does not expose system files

- should block URL-encoded double dots (%2e%2e%2f)

    when attempting path traversal with URL-encoded dots, returns 400 status

- should block double URL-encoded dots (%252e)

    when attempting path traversal with double URL encoding, returns 400 or 404 status

- should block Unicode encoding of dots (U+002E)

    when attempting path traversal with Unicode-encoded dots, returns 400 or 404 status

- should block backslash path separators (Windows)

    when attempting path traversal using Windows-style backslash separators, returns 400 or 404 status

##### Absolute Path Attacks

- should block absolute Unix paths

    when attempting to access absolute Unix paths like /etc/passwd, returns 400 or 404 status

- should block absolute Windows paths (C:\)

    when attempting to access Windows system paths, returns 400 or 404 status

- should block UNC paths (\\server\share)

    when attempting to access UNC network paths, returns 400 or 404 status

- should block file:// protocol

    when attempting to use file:// protocol in paths, returns 400 or 404 status

##### Null Byte Injection

- should block null bytes in path

    when path contains null bytes attempting traversal, returns 400 status

- should block null bytes in filename

    when filename contains null bytes, returns 400 or 404 status

- should block multiple null bytes

    when path contains multiple null bytes, returns 400 status

##### Symlink Attack Prevention

- should reject symlinks pointing outside artifacts directory

    when symlink points to sensitive files outside artifacts directory, returns 400 status and does not expose file contents

- should reject symlinked directories

    when directory symlink points outside artifacts, returns 400 or 404 status

- should reject chained symlinks

    when multiple symlinks chain to sensitive locations, returns 400 or 404 status

##### Directory Listing Prevention

- should not allow directory listing via artifacts endpoint

    when attempting directory listing, returns 400, 404, or 405 status

- should not expose directory contents in error messages

    when requesting non-existent file, error message does not reveal other file names in directory

- should not allow parent directory access

    when attempting parent directory access, returns 400 or 404 status

##### Filesystem Operation Verification

- should verify that traversal attempts do not access filesystem

    when path traversal is attempted, all filesystem access attempts remain within artifacts directory

- should verify that valid requests only access artifacts directory

    when valid request is made, resolved file path starts with artifacts directory path

##### Special Character Handling

- should block paths with spaces

    when path contains spaces, returns 400 or 404 status

- should block paths with semicolons

    when path contains semicolons, returns 400 or 404 status

- should block paths with pipe characters

    when path contains pipe characters, returns 400 or 404 status

- should block paths with ampersands

    when path contains ampersands, returns 400 or 404 status

- should block paths with dollar signs

    when path contains dollar signs, returns 400 or 404 status

##### Case Sensitivity Attacks

- should handle case variations in path traversal attempts

    when path traversal uses uppercase variations like ETC/PASSWD, returns 400 or 404 status

- should handle mixed case in encoded characters

    when percent-encoded characters use mixed case, returns 400 status

##### Long Path Attacks

- should reject extremely long paths

    when path contains 1000+ repeated segments, returns 400, 404, or 414 status

- should reject paths with extremely long segments

    when single path segment is 10000+ characters, returns 400, 404, or 414 status

##### Empty and Whitespace Paths

- should reject empty pageId

    when pageId is empty, returns 400 or 404 status

- should reject whitespace-only pageId

    when pageId contains only whitespace, returns 400 or 404 status

- should reject tab characters in pageId

    when pageId contains tab characters, returns 400 or 404 status

- should reject newline characters in pageId

    when pageId contains newline characters, returns 400 or 404 status

##### Race Condition Prevention

- should prevent TOCTOU attacks via concurrent requests

    when multiple concurrent path traversal requests are made, all return 400 or 404 status

- should handle rapid switching between valid and invalid paths

    when alternating between valid and invalid paths rapidly, valid requests return 200 and invalid return 400/404

### concurrency

#### Queue Concurrency

##### Concurrent Enqueue Operations

- should handle concurrent task enqueueing

    when 100 tasks are enqueued concurrently, all tasks receive unique IDs and all are stored in database

- should maintain task order under concurrent enqueue

    when tasks are enqueued sequentially, database order matches insertion order by created_at ASC

- should handle concurrent enqueue with different priorities

    when tasks are enqueued with high/normal/low priorities concurrently, all priorities are stored correctly with 10 tasks per priority level

##### Concurrent Dequeue Operations

- should prevent double-dequeue of same task

    when single task is dequeued by 10 concurrent operations, only one operation receives the task

- should handle concurrent dequeue from empty queue

    when 20 concurrent dequeue operations run on empty queue, all return null

- should distribute tasks across concurrent dequeues

    when 10 tasks are available and 10 concurrent dequeues occur, all tasks are distributed with unique IDs

##### Concurrent Status Updates

- should handle concurrent task completions

    when 20 tasks are completed concurrently, all tasks have completed status

- should handle concurrent failures and retries

    when tasks are concurrently completed and failed, all status updates are recorded correctly

- should maintain status consistency under race conditions

    when task receives concurrent complete/fail/retry operations, final status is one of pending/completed/failed

##### Mixed Concurrent Operations

- should handle concurrent enqueue, dequeue, and status updates

    when mix of 20 enqueues, 10 dequeues, and 5 status updates occur concurrently, all operations complete successfully

- should maintain queue integrity under heavy load

    when 100 enqueues and 50 dequeues occur concurrently, pending + processing tasks equal 100

##### Transaction Isolation

- should isolate concurrent transactions

    when two transactions each enqueue 10 tasks, both complete successfully with 20 total tasks

- should rollback failed transactions

    when transaction fails mid-execution, no partial data is committed to database

##### Priority Queue Race Conditions

- should respect priority under concurrent operations

    when tasks with different priorities are enqueued concurrently, first dequeued task has high priority

- should handle priority changes under concurrent updates

    when task priority is updated concurrently to different values, final priority is one of high/normal/low

##### Queue Statistics Under Concurrency

- should maintain accurate counts under concurrent operations

    when 50 tasks are enqueued concurrently, total count equals 50

- should track status transitions correctly

    when 10 tasks are completed out of 20, completed count is 10 and pending count is 10

#### Storage Concurrency

##### Concurrent Project Operations

- should handle concurrent project creation

    when 20 projects are created concurrently, all receive unique IDs and all are stored

- should handle concurrent project updates

    when project is updated 10 times concurrently, final name contains "Updated Project"

- should handle concurrent project reads

    when project is read 50 times concurrently, all reads return correct project with matching ID

- should maintain consistency during concurrent create and read

    when 10 concurrent creates and 10 concurrent reads occur, final database contains 10 projects

##### Concurrent Run Operations

- should handle concurrent run creation for same project

    when 15 runs are created concurrently for same project, all receive unique IDs with 15 total runs

- should handle concurrent run status updates

    when run status is updated concurrently to different values, final status is one of processing/completed/failed

- should isolate runs across concurrent transactions

    when two transactions each create 5 runs, both complete with 10 total runs

##### Concurrent Page Operations

- should handle concurrent page creation

    when 25 pages are created concurrently, all receive unique IDs and all are stored

- should handle concurrent page updates

    when page is updated 10 times concurrently with different status codes, final status is between 200-209

- should maintain consistency across concurrent page operations

    when 20 pages are created and 10 reads occur concurrently, final database contains 20 pages

##### Cross-Entity Concurrent Operations

- should handle concurrent operations across projects, runs, and pages

    when 5 projects with runs are created concurrently, then pages are added, database contains 5 projects, 5 runs, and 25 pages

- should maintain referential integrity under concurrent operations

    when 10 runs with 3 pages each are created concurrently, all pages correctly reference their parent runs

##### Cascade Delete Under Concurrency

- should handle concurrent deletes with cascade

    when 5 projects are created and 3 are deleted concurrently, 2 projects remain

- should maintain consistency when deleting parent during child creation

    when project is deleted while pages are being created, project deletion succeeds

##### Deadlock Prevention

- should prevent deadlocks on concurrent updates

    when two projects are updated concurrently 10 times each, all updates complete successfully

- should handle circular dependency updates

    when runs are updated and their parent project is updated concurrently, all updates complete

##### Data Consistency Under Load

- should maintain data consistency under heavy concurrent load

    when 50 projects with runs are created concurrently, all projects have at least one run

- should handle mixed read/write operations correctly

    when project is read and updated 25 times concurrently, final project has updated name

### api

#### Multiple Runs Integration

##### Multiple runs scenario

- should create baseline run on first scan (async)

    when posting a scan request, returns 202 status with project ID and PENDING status, creates a project and baseline run in the database with isBaseline true and NEW status

- should create comparison run on second request to same project

    when posting a second scan to the same project, returns 202 status with run ID and PENDING status, creates a second run with isBaseline false while preserving the baseline run

- should support multiple sequential comparison runs

    when creating multiple comparison runs for the same project, all runs are created successfully resulting in 1 baseline plus N comparison runs

#### Page Details Endpoint

##### GET /api/v1/pages/:pageId

- should return 404 for non-existent page

    when requesting a non-existent page ID, returns 404 status with NOT_FOUND error code and appropriate error message

- should return page details with latest snapshot

    when requesting an existing page, returns 200 status with page ID, URL, original URL, project ID, and data from the latest snapshot

- should include artifact URLs

    when requesting a page with artifacts, returns artifact URLs for screenshot, HAR, and HTML files

- should validate UUID format for pageId

    when requesting a page with invalid UUID format, returns 400 status with validation error

#### Project List Endpoint

##### GET /api/v1/projects

- should return empty list when no projects exist

    when requesting projects from an empty database, returns 200 status with empty projects array, zero total count, default limit of 50, offset of 0, and hasMore false

- should return all projects with default pagination

    when requesting projects after creating multiple projects, returns 200 status with all projects sorted by createdAt DESC (newest first) and accurate pagination metadata

- should support limit parameter

    when requesting projects with limit parameter, returns 200 status with the specified number of projects and hasMore true if more projects exist

- should support offset parameter

    when requesting projects with offset parameter, returns 200 status with projects starting from the offset position

- should support both limit and offset parameters

    when requesting projects with both limit and offset, returns 200 status with the correct subset of projects

- should validate limit parameter

    when requesting projects with invalid limit value, returns 400 status with validation error

- should validate offset parameter

    when requesting projects with negative offset, returns 400 status with validation error

- should include project details

    when requesting projects, each project includes ID, name, baseUrl, and createdAt timestamp

#### Artifacts Endpoint

##### GET /api/v1/artifacts/:pageId/screenshot

- should return screenshot image

    when requesting a screenshot for a page with artifacts, returns 200 status with image/png content type, content-disposition header, and valid PNG image data

- should return 404 for non-existent page

    when requesting a screenshot for non-existent page, returns 404 status with NOT_FOUND error code

- should return error for path traversal attempt

    when attempting path traversal in pageId, returns 400 or 404 status preventing unauthorized file access

##### GET /api/v1/artifacts/:pageId/baseline-screenshot

- should return baseline screenshot image

    when requesting a baseline screenshot, returns 200 status with image/png content type and valid PNG image data

- should return 404 for non-existent baseline

    when requesting a baseline screenshot for non-existent page, returns 404 status with NOT_FOUND error code

##### GET /api/v1/artifacts/:pageId/diff

- should return diff image

    when requesting a diff image, returns 200 status with image/png content type, content-disposition header, and valid PNG image data

- should return 404 for non-existent diff

    when requesting a diff for non-existent page, returns 404 status with NOT_FOUND error code

##### GET /api/v1/artifacts/:pageId/har

- should return HAR file as JSON

    when requesting a HAR file, returns 200 status with application/json content type, content-disposition header, and valid HAR JSON data

- should return 404 for non-existent HAR

    when requesting a HAR file for non-existent page, returns 404 status with NOT_FOUND error code

##### GET /api/v1/artifacts/:pageId/html

- should return HTML content

    when requesting HTML content, returns 200 status with text/html content type and the captured HTML page content

- should return 404 for non-existent HTML

    when requesting HTML for non-existent page, returns 404 status with NOT_FOUND error code

##### Security: Path Traversal Prevention

- should reject pageId with null bytes

    when attempting to inject null bytes in pageId, returns 400 status preventing path traversal attacks

- should reject empty pageId

    when providing empty pageId, returns 400 or 404 status preventing unauthorized access

- should reject path with double dots

    when attempting to use encoded double dots in pageId, returns 400 status preventing directory traversal

##### Security: Symlink Attack Prevention

- should reject symlinks pointing outside artifacts directory

    when attempting to access a symlink pointing to system files, returns 400 status preventing symlink attacks

#### Project Details Endpoint

##### GET /api/v1/projects/:projectId - Project Details

- should return 404 for non-existent project

    when requesting a non-existent project, returns 404 status with NOT_FOUND error code and "Project not found" message

- should return project with no runs

    when requesting a project without runs, returns 200 status with project details, empty pages array, and statistics with zero counts

- should return project with run but no pages

    when requesting a project with a run but no pages, returns 200 status with project details, empty pages array, and statistics with zero total pages

- should return project with pages and snapshots

    when requesting a project with pages and snapshots, returns 200 status with project details, pages array containing page data with status, HTTP status, SEO data, and HTTP headers, and accurate statistics

- should include artifact URLs when artifacts exist

    when requesting a project with artifacts, returns artifact URLs for screenshots, HAR files, and HTML for each page

- should respect includePages=false query parameter

    when requesting a project with includePages=false, returns 200 status with empty pages array but still includes accurate statistics with total pages count

- should handle pagination with pageLimit

    when requesting a project with pageLimit parameter, returns 200 status with limited number of pages and pagination metadata including hasMore flag

- should handle pagination with pageOffset

    when requesting a project with pageLimit and pageOffset, returns 200 status with correct subset of pages and pagination metadata

- should count error pages correctly in statistics

    when requesting a project with completed and error pages, returns accurate statistics with separate counts for total, completed, and error pages

- should handle pages with no snapshot gracefully

    when requesting a project with pages that have no snapshots, returns pages with PENDING status and undefined HTTP status and capturedAt

- should include full project configuration in response

    when requesting a project, returns complete project details including ID, name, description, baseUrl, status, config with all settings, createdAt, and updatedAt timestamps

#### Task Status Endpoint

##### GET /api/v1/tasks/:taskId

- should return 404 for non-existent task

    when requesting a non-existent task, returns 404 status with NOT_FOUND error code and appropriate error message

- should return task status for pending task

    when requesting a pending task, returns 200 status with task ID, type, pending status, createdAt timestamp, and payload object

- should return task status for processing task

    when requesting a processing task, returns 200 status with task ID, processing status, startedAt timestamp, and attempts count of 1

- should return task status for completed task

    when requesting a completed task, returns 200 status with task ID, completed status, and completedAt timestamp

- should return task status for failed task with error message

    when requesting a failed task, returns 200 status with task ID, failed status, error message, and completedAt timestamp

- should validate UUID format for taskId

    when requesting a task with invalid UUID format, returns 400 status with validation error

#### Run Details Endpoint

##### GET /api/v1/runs/:runId

- should return 404 for non-existent run

    when requesting a non-existent run, returns 404 status with NOT_FOUND error code and appropriate error message

- should return run details for existing run

    when requesting an existing run, returns 200 status with run ID, project ID, isBaseline flag, status, createdAt timestamp, and config object

- should include run statistics

    when requesting a run with pages and snapshots, returns run details with statistics including total pages, completed pages, and error pages counts

- should validate UUID format for runId

    when requesting a run with invalid UUID format, returns 400 status with validation error

#### Run Pages List Endpoint

##### GET /api/v1/runs/:runId/pages

- should return 404 for non-existent run

    when requesting pages for a non-existent run, returns 404 status with NOT_FOUND error code and appropriate error message

- should return empty list when run has no pages

    when requesting pages for a run without pages, returns 200 status with empty pages array and zero total count

- should return all pages for a run with snapshot data

    when requesting pages for a run with snapshots, returns 200 status with pages array containing URL, status, and HTTP status for each page

- should support pagination with limit parameter

    when requesting pages with limit parameter, returns 200 status with limited number of pages, correct limit in pagination metadata, and hasMore true if more pages exist

- should filter by status

    when requesting pages with status filter, returns 200 status with only pages matching the specified status

- should validate UUID format for runId

    when requesting pages with invalid UUID format for runId, returns 400 status with Zod validation error in pathParameterErrors

#### Page Diff Endpoint

##### GET /api/v1/pages/:pageId/diff

- should return 404 for non-existent page

    when requesting a diff for non-existent page, returns 404 status with NOT_FOUND error code and appropriate error message

- should return 404 if no comparison exists (baseline only)

    when requesting a diff for a page with only baseline snapshot, returns 404 status with "No comparison run found" message

- should return null diff when no changes detected

    when requesting a diff for identical snapshots, returns 200 status with hasChanges false and empty arrays for seoChanges, headerChanges, and performanceChanges

- should return SEO changes when title changed

    when requesting a diff with changed title, returns 200 status with hasChanges true, seoChanges array containing field name, baseline value, and current value

- should return header changes when headers modified

    when requesting a diff with changed headers, returns 200 status with hasChanges true, headerChanges array containing header name, baseline value, and current value

- should return performance changes when metrics differ

    when requesting a diff with changed performance metrics, returns 200 status with hasChanges true, performanceChanges array containing metric name, baseline value, and current value

- should validate UUID format for pageId

    when requesting a diff with invalid UUID format, returns 400 status with validation error

#### Scan Endpoints

##### POST /api/v1/scans

- should return 400 when URL is missing

    when posting a scan request without URL, returns 400 status with validation error

- should return 400 for invalid URL format

    when posting a scan request with invalid URL format, returns 400 status with validation error

- should return 202 for async scan request

    when posting a scan request without sync flag, returns 202 status with project ID, PENDING status, and project URL

- should return 200 with full result for sync scan

    when posting a scan request with sync true, returns 200 status with complete project details including ID, completed status, pages array with page status and SEO data

- should accept optional configuration

    when posting a scan request with optional name, description, and viewport configuration, returns completed project with custom name, description, and viewport settings

- should return 202 for async crawl scan request

    when posting a scan request with crawl enabled, returns 202 status with project ID, PENDING status, and project URL

##### GET /api/v1/projects/:projectId

- should return 404 for non-existent project

    when requesting a non-existent project, returns 404 status with NOT_FOUND error code

- should return project details after scan

    when requesting a project after creating a sync scan, returns 200 status with project ID, pages array with one page, and statistics showing 1 total page and 1 completed page

#### Project Runs List Endpoint

##### GET /api/v1/projects/:projectId/runs

- should return 404 for non-existent project

    when requesting runs for a non-existent project, returns 404 status with NOT_FOUND error code and appropriate error message

- should return empty list when project has no runs

    when requesting runs for a project without runs, returns 200 status with empty runs array and zero total count

- should return all runs for a project sorted by createdAt DESC

    when requesting runs for a project with multiple runs, returns 200 status with all runs sorted by creation time (newest first) and includes both baseline and comparison runs

- should support pagination with limit parameter

    when requesting runs with limit parameter, returns 200 status with limited number of runs, correct limit in pagination metadata, and hasMore true if more runs exist

- should support pagination with offset parameter

    when requesting runs with offset parameter, returns 200 status with runs starting from the offset position

- should include run details

    when requesting runs, each run includes ID, project ID, isBaseline flag, status, and createdAt timestamp

- should validate UUID format for projectId

    when requesting runs with invalid UUID format, returns 400 status with validation error

#### @ts-rest API Routes

##### POST /api/v1/scans (@ts-rest createScan)

- should create async scan and return 202

    when posting async scan via @ts-rest endpoint, returns 202 status with projectId, PENDING status, and projectUrl

- should create sync scan and return 200 with full project details

    when posting sync scan via @ts-rest endpoint with name and description, returns 200 status with complete project details including ID, name, description, baseUrl, config, statistics, and pages

- should validate required URL field

    when posting scan without URL, returns 400 status with @ts-rest validation error in bodyErrors

- should validate URL format

    when posting scan with invalid URL format, returns 400 status with @ts-rest validation error in bodyErrors

##### GET /api/v1/projects (@ts-rest listProjects)

- should return empty projects list initially

    when requesting projects via @ts-rest endpoint, returns 200 status with projects array and pagination object

- should return projects after creating scans

    when requesting projects after creating scans, returns 200 status with projects array containing projects with ID, name, and baseUrl

- should support pagination with limit and offset

    when requesting projects with limit and offset parameters, returns 200 status with pagination object containing limit, offset, total, and hasMore

##### GET /api/v1/projects/:projectId (@ts-rest getProject)

- should return project details by ID

    when requesting project via @ts-rest endpoint, returns 200 status with complete project details including ID, name, baseUrl, config, and statistics

- should support includePages query parameter

    when requesting project with includePages true, returns 200 status with pages array containing page data

- should support page pagination parameters

    when requesting project with pageLimit and pageOffset, returns 200 status with pagination object containing limit and offset

- should return 404 for non-existent project

    when requesting non-existent project, returns 404 status

- should return 400 for invalid UUID format

    when requesting project with invalid UUID, returns 400 status

##### GET /api/v1/projects/:projectId/runs (@ts-rest listProjectRuns)

- should return runs list for project

    when requesting runs via @ts-rest endpoint, returns 200 status with runs array and pagination object

- should support pagination parameters

    when requesting runs with limit and offset, returns 200 status with pagination object containing limit and offset

##### POST /api/v1/projects/:projectId/runs (@ts-rest createProjectRun)

- should create a new run for project

    when posting new run via @ts-rest endpoint, returns 202 status with runId, PENDING status, and runUrl

- should validate required URL field

    when posting run without URL, returns 400 status

##### GET /api/v1/runs/:runId (@ts-rest getRunDetails)

- should return run details by ID

    when requesting run via @ts-rest endpoint, returns 200 status with run ID, project ID, status, and createdAt

- should return 404 for non-existent run

    when requesting non-existent run, returns 404 status

##### GET /api/v1/pages/:pageId (@ts-rest getPageDetails)

- should return page details by ID

    when requesting page via @ts-rest endpoint, returns 200 status with page ID, URL, and status

- should return 404 for non-existent page

    when requesting non-existent page, returns 404 status

##### DELETE /api/v1/projects/:projectId (@ts-rest deleteProject)

- should delete a project and return 204

    when deleting a project via @ts-rest endpoint, returns 204 status with empty body, and subsequent GET request returns 404 confirming deletion

- should return 404 when deleting non-existent project

    when deleting non-existent project, returns 404 status with error object

- should return 400 for invalid UUID format

    when deleting project with invalid UUID, returns 400 status

- should cascade delete all related data (pages, snapshots)

    when deleting a project with pages and snapshots, returns 204 status, and subsequent GET requests for pages return 404 confirming cascade deletion

#### API Security

##### SQL Injection Prevention

- should sanitize SQL injection in project ID parameter

    when requesting project with SQL injection in ID parameter using DROP TABLE, returns 400 status

- should sanitize SQL injection in search query

    when using SQL injection attempt in search query parameter, returns 200 or 400 status without exposing database

- should prevent SQL injection in limit parameter

    when limit parameter contains SQL injection attempt, returns 200 or 400 status without database compromise

- should prevent SQL injection in offset parameter

    when offset parameter contains SQL injection attempt with OR clause, returns 200 or 400 status

##### XSS Prevention

- should validate URL schemes to prevent javascript: URLs

    when submitting scan with javascript: URL scheme, returns 400 status with bodyErrors field

##### Malformed JSON Handling

- should reject malformed JSON

    when POSTing malformed JSON with invalid syntax, returns 400 status

- should reject JSON with invalid UTF-8

    when POSTing invalid UTF-8 bytes, returns 400 status

- should reject JSON with null bytes

    when POSTing JSON containing null bytes in string values, returns 400 status

- should handle deeply nested JSON gracefully

    when POSTing JSON with 1000+ levels of nesting, returns 400 or 413 status

##### CORS Validation

- should include CORS headers in preflight request

    when sending OPTIONS preflight with origin header, returns 200 or 204 status with access-control-allow-origin header

- should include CORS headers in actual request

    when sending GET with origin header, returns 200 status with access-control-allow-origin header

- should handle CORS for POST requests

    when POSTing with origin header, returns 200 or 202 status with access-control-allow-origin header

##### Error Information Disclosure

- should not leak database path in error messages

    when requesting invalid UUID causing error, error response does not contain "sqlite" or ".db" strings

- should not leak system paths in error messages

    when requesting non-existent artifact, error response does not contain /home/, /tmp/, or C:\ paths

- should not leak stack traces in production mode

    when request causes error, response does not contain "at " or file:line references

##### Input Validation

- should validate UUID format strictly

    when requesting with invalid UUIDs (not-a-uuid, wrong length, etc.), returns 400 status

- should validate integer parameters

    when requesting with non-numeric limit parameter, returns 400 status

- should enforce minimum and maximum for pagination

    when limit is too large (10000) or negative (-1), returns 200 or 400 status with appropriate handling

##### Request Header Validation

- should reject requests with invalid Content-Type

    when POSTing with text/plain Content-Type, returns 400 or 415 status

- should handle missing Content-Type gracefully

    when POSTing without Content-Type header, returns 200, 202, 400, or 415 status

- should reject extremely long headers

    when sending header with 100000+ character value, returns 200, 400, 413, or 431 status

##### HTTP Method Validation

- should reject unsupported HTTP methods

    when using TRACE method, returns 404 or 405 status

- should reject CONNECT method

    when using CONNECT method, returns 404 or 405 status

### services

#### Scan Processor Integration

##### processScan - single page mode

- should process single page successfully

    when processing a single page scan, completes successfully with COMPLETED status, creates page with status COMPLETED and HTTP status 200, captures SEO data including title, generates screenshot and HTML artifacts, updates statistics with correct counts (1 total, 1 completed, 0 errors), and updates project and run status to COMPLETED

- should capture full SEO data

    when processing a page with full SEO metadata, captures and stores title, meta description, canonical URL, H1 headings, and robots directive correctly

- should collect HAR file when collectHar is true

    when processing a scan with collectHar enabled, creates HAR file artifact and includes performance data in the page result

- should handle page errors gracefully

    when processing a scan for a page returning HTTP 500, completes with COMPLETED status and marks the page as completed with HTTP status 500

- should update project and run status to IN_PROGRESS during processing

    when processing a scan, updates both project and run status from NEW to IN_PROGRESS during execution and then to COMPLETED upon successful completion

##### processScan - duplicate URL handling

- should handle duplicate normalized URLs gracefully

    when processing the same URL in different runs for the same project, successfully processes both scans without UNIQUE constraint violations, creates separate snapshots with different IDs for each run, and completes both scans with COMPLETED status

##### processScan - crawl mode

- should discover and process multiple pages

    when processing a scan with crawl enabled, discovers and processes multiple linked pages, returns more than one page in results, and completes with COMPLETED status

- should respect maxPages limit (100) during crawl

    when processing a scan with maxPages limit, does not exceed the maximum page limit of 100

##### processScan - error handling

- should handle page errors gracefully

    when processing a scan for an invalid domain that cannot be reached, completes with COMPLETED status, creates page with ERROR status, includes error in statistics (1 error page, 0 completed), and updates project and run status to COMPLETED

##### processScan - viewport and configuration

- should respect custom viewport settings

    when processing a scan with custom viewport dimensions, uses the specified viewport width and height in the result configuration

- should include pagination metadata

    when processing a scan, includes pagination object in result with totalPages, limit, offset, and hasMore properties
