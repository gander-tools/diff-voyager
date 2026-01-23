# Test Documentation

This document provides a comprehensive overview of all tests in the Diff Voyager codebase.

**Note:** This file is read-only and should not be manually edited unless explicitly requested by the user. It will be updated manually or on explicit user request.

---

# backend

## unit

### domain

#### Header Comparator

##### compare

- should return empty array for identical headers

    when both baseline and current headers have the same set of key-value pairs, the function returns an empty array indicating no changes

- should detect header value change

    when a header's value differs between baseline and current, returns an array with one element containing the diff type, header name, baseline value, and current value

- should detect header removed

    when a header exists in baseline but not in current, returns a diff indicating the header was removed with baseline value and null current value

- should detect header added

    when a header exists in current but not in baseline, returns a diff indicating the header was added with null baseline value and the new current value

- should detect multiple changes

    when multiple headers are added, removed, or changed simultaneously, returns all detected changes in the array

- should be case-insensitive for header names

    when headers have different casing (e.g., 'Content-Type' vs 'content-type') but same values, no diff is detected

- should handle empty baseline headers

    when baseline has no headers but current has headers, all current headers are detected as added

- should handle empty current headers

    when current has no headers but baseline has headers, all baseline headers are detected as removed

- should handle both empty

    when both baseline and current have no headers, returns an empty array

- should ignore specified headers

    when headers are listed in the ignoreHeaders option, changes to those headers are not reported

- should ignore common volatile headers by default

    when headers like 'date' and 'x-request-id' change, they are ignored by default as they are volatile

##### getSeverity

- should return CRITICAL for security headers removed

    when security headers like 'x-frame-options', 'content-security-policy', or 'strict-transport-security' are removed, severity is CRITICAL

- should return WARNING for content-type changes

    when the 'content-type' header value changes, severity is WARNING

- should return WARNING for cache control changes

    when the 'cache-control' header value changes, severity is WARNING

- should return INFO for custom header changes

    when a custom header (not security or critical) changes, severity is INFO

##### createDescription

- should create description for changed header

    when a header value changes, description contains the header name and indicates it was "changed"

- should create description for removed header

    when a header is removed, description contains the header name and indicates it was "removed"

- should create description for added header

    when a header is added, description contains the header name and indicates it was "added"

#### Page Comparator

##### compare

- should return empty changes for identical snapshots

    when both snapshots have identical SEO data and other properties, returns empty changes array and zero total changes in summary

- should detect SEO changes

    when SEO data differs (e.g., title changed), detects the change and includes it in the changes array with correct type

- should detect header changes

    when HTTP headers differ between snapshots, detects the change and includes HEADERS type diff

- should detect performance changes

    when performance metrics differ between snapshots, detects the change and includes PERFORMANCE type diff

- should detect HTTP status change

    when HTTP status code changes, detects it and marks critical status changes (like 200 to 404) with CRITICAL severity

- should calculate summary correctly

    when multiple changes occur, summary correctly counts total changes and critical changes

- should include all change types in summary

    when creating a summary, all diff types (SEO, HEADERS, PERFORMANCE, HTTP_STATUS, VISUAL) are present in the changesByType object

- should set all changes to NEW status

    when changes are detected, all changes have their status set to NEW by default

##### compareHttpStatus

- should return null for same status

    when both baseline and current have the same HTTP status code, returns null (no change)

- should detect status change

    when HTTP status codes differ, returns a change object with old and new values and HTTP_STATUS type

- should return CRITICAL for change to error status

    when status changes to an error code (404, 500), the severity is CRITICAL

- should return WARNING for redirect changes

    when status changes to a redirect code (301, 302), the severity is WARNING

- should return INFO for 200 to 200-range changes

    when status changes within the 2xx range (e.g., 200 to 201), the severity is INFO

##### createDiffSummary

- should count changes correctly

    when given an array of changes, correctly counts total changes, critical changes, muted changes, and groups by type

- should set thresholdExceeded based on visual diff

    when visual diff information is provided with threshold exceeded, the summary reflects this

- should count accepted changes correctly

    when changes have ACCEPTED status, they are counted separately in the summary

- should set thresholdExceeded to false when no visual info provided

    when no visual diff information is provided, thresholdExceeded is false and visual metrics are undefined

##### compareWithVisual

- should combine non-visual and visual comparison results

    when both non-visual and visual comparisons are performed, results are combined into a single comparison result

- should detect visual differences and add visual change

    when screenshots differ significantly, a VISUAL type change is added with CRITICAL severity

- should generate diff image when requested

    when generateDiffImage option is true, a diff image buffer is included in the result

- should not generate diff image by default

    when generateDiffImage option is not specified, no diff image is generated

- should update summary with visual diff info

    when visual differences are detected, summary includes visual diff percentage and pixel count

- should respect custom visual threshold

    when a custom threshold is provided, it is used to determine if the diff exceeds the threshold

- should include visual change metadata

    when a visual change is detected, the change includes metadata with diff pixels, percentage, threshold status, and dimensions

#### Performance Comparator

##### compare

- should return empty array for identical performance data

    when baseline and current performance data have the same metrics, returns an empty array

- should detect load time increase

    when load time increases, returns a diff with the metric name, values, and percentage change

- should detect load time decrease

    when load time decreases, returns a diff with negative percentage change

- should detect request count change

    when request count changes, returns a diff with the metric, values, and percentage

- should detect total size change

    when total size in bytes changes, returns a diff with the metric, values, and percentage

- should detect multiple metric changes

    when multiple metrics change simultaneously, all changes are detected and returned

- should ignore small changes below threshold

    when changes are below the default 10% threshold, they are not reported

- should respect custom threshold

    when a custom threshold is provided, it is used to determine if changes should be reported

- should handle zero baseline value

    when baseline value is zero and current is non-zero, the change is still detected with appropriate percentage

- should handle undefined baseline

    when baseline is undefined but current exists, all current metrics are reported as added

- should handle undefined current

    when current is undefined but baseline exists, all baseline metrics are reported as removed

- should handle both undefined

    when both baseline and current are undefined, returns an empty array

##### getSeverity

- should return CRITICAL for large load time increase

    when load time increases by more than 100% (e.g., 200%), severity is CRITICAL

- should return WARNING for moderate load time increase

    when load time increases moderately (e.g., 50%), severity is WARNING

- should return INFO for load time decrease

    when load time decreases (negative percentage), severity is INFO as it's an improvement

- should return WARNING for significant size increase

    when total size increases significantly (e.g., 75%), severity is WARNING

- should return INFO for small size increase

    when total size increases slightly (e.g., 15%), severity is INFO

##### formatMetricValue

- should format load time as seconds

    when formatting loadTimeMs metric, value is converted to seconds with 2 decimal places

- should format size as human readable

    when formatting totalSizeBytes, value is converted to human-readable format (KB, MB, etc.)

- should format request count as number

    when formatting requestCount, value is returned as a plain number string

##### createDescription

- should create description for increased metric

    when a metric increases, description includes the metric name, "increased", and the percentage change

- should create description for decreased metric

    when a metric decreases, description includes "decreased" and the percentage change

#### SEO Comparator

##### compare

- should return empty array when SEO data is identical

    when baseline and current SEO data have the same values for all fields, returns an empty array

- should detect title change

    when page title changes, returns a diff with CRITICAL severity, field name, and both values

- should detect title removed

    when page title is removed (becomes undefined), returns a CRITICAL diff with null current value

- should detect title added

    when page title is added (was undefined), returns an INFO diff with null baseline value

- should detect meta description change

    when meta description changes, returns a WARNING severity diff

- should detect canonical URL change

    when canonical URL changes, returns a CRITICAL severity diff

- should detect robots directive change

    when robots meta tag changes, returns a CRITICAL severity diff

- should detect H1 change

    when H1 heading text changes, returns a WARNING severity diff

- should detect H1 removed

    when H1 headings are removed (array becomes empty), returns a CRITICAL severity diff

- should detect multiple H1 added

    when additional H1 headings are added, returns a WARNING severity diff

- should detect lang attribute change

    when HTML lang attribute changes, returns a WARNING severity diff

- should detect multiple changes at once

    when multiple SEO fields change simultaneously, all changes are detected and returned

- should handle undefined baseline SEO data

    when baseline is undefined but current exists, all current fields are reported as added

- should handle undefined current SEO data

    when current is undefined but baseline exists, all baseline fields are reported as removed

- should handle both undefined

    when both baseline and current are undefined, returns an empty array

##### getSeverity

- should return CRITICAL for title

    when title field changes, severity is always CRITICAL

- should return CRITICAL for canonical

    when canonical URL changes, severity is always CRITICAL

- should return CRITICAL for robots with noindex

    when robots directive changes to include 'noindex', severity is CRITICAL

- should return WARNING for meta description

    when meta description changes, severity is WARNING

- should return WARNING for h1 change

    when h1 content changes, severity is WARNING

- should return CRITICAL for h1 removal

    when h1 headings are removed completely, severity is CRITICAL

- should return INFO for unknown fields

    when an unknown SEO field changes, severity defaults to INFO

##### createDescription

- should create description for changed value

    when a value changes, description follows format "Field changed from 'old' to 'new'"

- should create description for removed value

    when a value is removed, description follows format "Field removed (was 'value')"

- should create description for added value

    when a value is added, description follows format "Field added: 'value'"

- should create description for H1 array change

    when H1 array changes, description contains the field name "H1"

#### URL Normalizer

##### normalize

- should remove trailing slash

    when URL has trailing slash, it is removed from the normalized path

- should keep root path as is

    when URL is the root path with trailing slash, it remains as "/"

- should lowercase path

    when path contains uppercase characters, they are converted to lowercase

- should sort query parameters

    when query string has parameters in random order, they are sorted alphabetically

- should remove tracking parameters

    when URL contains tracking parameters like utm_source, they are removed from the normalized URL

- should remove fragment

    when URL contains a fragment/hash, it is removed from the normalized URL

- should handle multiple tracking params

    when URL has multiple tracking parameters, all are removed while preserving real parameters

- should handle path without query

    when URL has no query string, the path is returned normalized without modification

##### getOrigin

- should extract origin from URL

    when given a full URL, returns the protocol and hostname (origin)

- should include port if non-standard

    when URL has a non-standard port, it is included in the returned origin

##### isSameDomain

- should return true for same domain

    when two URLs share the same domain, returns true

- should return false for different domain

    when two URLs have different domains, returns false

- should handle subdomains as different

    when one URL is a subdomain of another, returns false (treats subdomains as different)

#### Visual Comparator

##### compare

- should return no diff for identical images

    when both images are identical, returns zero diff pixels, zero percentage, and threshold not exceeded

- should detect completely different images

    when images are completely different (e.g., white vs black), returns 100% diff with threshold exceeded

- should calculate correct diff percentage for partial difference

    when images have a small region that differs, calculates the correct percentage based on pixel count

- should respect custom threshold

    when a custom threshold is provided, it is used to determine if the diff exceeds the threshold

- should generate diff image when requested

    when generateDiffImage option is true, returns a valid PNG buffer showing the differences

- should not generate diff image by default

    when generateDiffImage option is not specified, no diff image buffer is included in the result

- should handle images of different sizes

    when comparing images with different dimensions, returns an error indicating size mismatch

- should use default threshold of 0.01%

    when no threshold is specified, uses 0.01% as the default threshold value

- should handle antialiasing tolerance in pixelmatch

    when images have very minor color variations, pixelmatch's default settings may ignore them

##### createVisualChange

- should create change object with correct type

    when creating a visual change from comparison result, the type is set to VISUAL

- should return CRITICAL severity when threshold exceeded

    when the diff percentage exceeds the threshold, severity is set to CRITICAL

- should return WARNING severity when threshold not exceeded but has diff

    when there is a diff but it doesn't exceed the threshold, severity is WARNING

- should return INFO severity when no diff

    when there are no differences detected, severity is INFO

- should include percentage in description

    when creating description, it includes the diff percentage and pixel count

### crawler

#### Browser Manager

##### getBrowser

- should create browser instance on first call

    when getBrowser is called for the first time, creates a new browser instance and sets active state to true

- should reuse browser instance on subsequent calls

    when getBrowser is called multiple times, returns the same browser instance without creating a new one

- should handle concurrent getBrowser calls safely

    when multiple getBrowser calls are made simultaneously, all receive the same browser instance without creating duplicates

- should throw error when manager is closing

    when getBrowser is called while the manager is in the process of closing, throws an error indicating the manager is closing

- should launch browser in headless mode when configured

    when headless option is set to true, browser launches in headless mode and connects successfully

- should respect maxBrowsers configuration

    when maxBrowsers configuration is provided, the manager respects the limit

##### close

- should close browser and clear instance

    when close is called, closes the active browser, clears the instance, and sets active state to false

- should be safe to call multiple times

    when close is called multiple times consecutively, it handles all calls safely without errors

- should be safe to call without browser

    when close is called without an active browser instance, it completes safely without errors

- should allow getting new browser after close

    when getBrowser is called after closing a previous browser, creates a new browser instance (not the old one)

##### isActive

- should return false when no browser exists

    when no browser has been created yet, isActive returns false

- should return true when browser exists

    when a browser instance exists, isActive returns true

- should return false after close

    when close is called on an active browser, isActive returns false

##### configuration

- should use default configuration when none provided

    when BrowserManager is created without configuration, uses default settings and initializes properly

- should merge provided config with defaults

    when partial configuration is provided, merges it with default configuration and initializes successfully

##### error handling

- should handle browser launch errors gracefully

    when browser launch encounters errors, the error is propagated properly to the caller

- should prevent new browsers during close

    when a browser creation is attempted during the close process, throws an error indicating the manager is closing

#### Page Capturer

##### capture - basic functionality

- should capture HTML content with correct hash

    when capturing a page, saves HTML content and generates a valid SHA256 hash for the content

- should extract HTTP status correctly

    when capturing a page, extracts and returns the HTTP status code from the response

- should capture HTTP headers

    when capturing a page, extracts and returns all HTTP response headers with correct values

##### capture - 404 pages

- should handle 404 pages correctly

    when capturing a 404 page, successfully captures the page with 404 status, creates hash and screenshot without errors

##### capture - redirects

- should follow redirects and capture final page

    when capturing a URL that redirects, follows the redirect chain and captures the final destination page

- should capture redirect chain

    when a page redirects, captures the redirect chain as an array structure

##### capture - screenshots

- should capture full-page screenshot

    when capturing a page, generates a full-page screenshot and saves it as a valid PNG file

- should respect viewport configuration

    when a custom viewport is specified, uses those dimensions when capturing the screenshot

##### capture - HAR collection

- should collect HAR file when collectHar is true

    when collectHar option is true, generates and saves a valid HAR file with log entries and correct JSON structure

- should not collect HAR file when collectHar is false

    when collectHar option is false, does not create a HAR file for the page

- should collect HAR file for pages with multiple resources

    when capturing a page with multiple resources and collectHar is true, HAR file contains entries for all requests

##### capture - SEO data extraction

- should extract title from HTML

    when capturing a page, extracts the title tag content from the HTML

- should extract meta description

    when capturing a page with meta description, extracts the description content correctly

- should extract canonical URL

    when capturing a page with canonical link, extracts the canonical URL value

- should extract robots directive

    when capturing a page with robots meta tag, extracts the robots directive value

- should extract H1 headings

    when capturing a page, extracts all H1 heading texts as an array

- should extract H2 headings

    when capturing a page, extracts all H2 heading texts as an array

- should extract language attribute

    when capturing a page with lang attribute on html element, extracts the language code

- should handle pages without meta tags

    when capturing a page without SEO meta tags, returns undefined for missing tags without errors

- should handle multiple H1 headings

    when a page has multiple H1 headings, extracts all of them into the array

##### capture - performance metrics

- should collect performance metrics

    when capturing a page, collects performance data including load time, request count, and total size

##### capture - waitAfterLoad

- should wait specified time after page load

    when waitAfterLoad is set to a value, waits at least that many milliseconds after page load completes

- should not wait when waitAfterLoad is 0

    when waitAfterLoad is 0, completes the capture quickly without additional waiting

##### capture - error handling

- should handle invalid URLs gracefully

    when capturing an invalid or unreachable URL, returns result with status 0 and error message containing network error details

- should handle timeout scenarios

    when a page takes too long to load and times out, returns result with status 0 and error information

##### capture - Unicode content

- should handle Unicode content correctly

    when capturing a page with Unicode characters, preserves all Unicode content in the saved HTML file

##### close

- should close browser and allow reuse

    when close is called, closes the browser and allows creating a new browser instance for subsequent captures

#### Single Page Processor

##### processPage

- should capture and store a page snapshot

    when processing a page, captures the page data, creates both page and snapshot records in the database with correct associations

- should extract SEO data during capture

    when processing a page, extracts and stores SEO data including title, meta description, and headings in the snapshot

- should handle 404 pages gracefully

    when processing a 404 page, successfully creates page and snapshot records with 404 status without errors

- should reuse existing page for same normalized URL

    when the same normalized URL is processed in different runs, reuses the existing page record but creates separate snapshots

- should handle capture errors and return error info

    when page capture fails (e.g., invalid domain), returns success=false with error message describing the failure

- should respect viewport configuration

    when a custom viewport is specified, uses it during the capture process and creates the snapshot successfully

### queue

#### Task Queue

##### enqueue

- should insert task with generated UUID

    when a task is enqueued, generates a valid UUID string identifier and successfully inserts the task record into the database

- should insert task with pending status

    when a task is enqueued, the task status is set to 'pending' in the database

- should insert task with default normal priority

    when a task is enqueued without specifying priority, the task priority defaults to 'normal'

- should insert task with custom priority

    when a task is enqueued with a specified priority, the task is created with that custom priority value

- should store payload as JSON

    when a task with complex payload including config objects is enqueued, the payload is serialized and stored as JSON, then correctly deserialized when retrieved

- should set attempts to 0

    when a task is newly enqueued, the attempts counter is initialized to 0

- should set default max_attempts to 3

    when a task is enqueued without specifying max attempts, max_attempts defaults to 3

- should set custom max_attempts

    when a task is enqueued with a specified maxAttempts value, the task is created with that custom max_attempts value

- should set created_at timestamp

    when a task is enqueued, the created_at timestamp is set to the current time within a reasonable tolerance

- should allow multiple tasks to be enqueued

    when multiple tasks are enqueued, each receives a unique ID and all tasks are successfully stored in the database

##### dequeue

- should return null when no pending tasks

    when dequeue is called on an empty queue, returns null

- should return and lock oldest pending task

    when dequeue is called with pending tasks, returns the oldest pending task, changes its status to 'processing', and includes the correct task ID, type, and status

- should set started_at timestamp when dequeuing

    when a task is dequeued, the started_at timestamp is set to the current time within a reasonable tolerance

- should increment attempts counter

    when a task is dequeued, the attempts counter is incremented from 0 to 1

- should deserialize payload from JSON

    when a task with complex JSON payload is dequeued, the payload is correctly deserialized and matches the original enqueued payload

- should respect priority order (high > normal > low)

    when tasks with different priorities are enqueued, dequeue returns them in priority order: high priority first, then normal, then low

- should return oldest task when priority is equal

    when multiple tasks have the same priority, dequeue returns them in FIFO order based on creation time

- should not dequeue tasks that are already processing

    when a task is already dequeued and in processing status, subsequent dequeue calls do not return that task and return null if no other pending tasks exist

- should not dequeue completed tasks

    when a task has completed status, dequeue does not return that task

- should not dequeue failed tasks

    when a task has failed status, dequeue does not return that task

##### complete

- should mark task as completed

    when complete is called with a task ID, the task status is updated to 'completed' in the database

- should set completed_at timestamp

    when a task is marked complete, the completed_at timestamp is set to the current time within a reasonable tolerance

- should not affect other tasks

    when one task is completed, other tasks remain in their original status and are not affected

##### fail

- should mark task as failed

    when fail is called with a task ID and error message, the task status is updated to 'failed' in the database

- should store error message

    when fail is called with an error message, the error message is stored in the error_message field

- should set completed_at timestamp

    when a task is marked failed, the completed_at timestamp is set to the current time within a reasonable tolerance

- should handle long error messages

    when fail is called with a very long error message including stack traces, the full error message is stored without truncation

##### retry

- should reset failed task to pending

    when retry is called on a failed task, the task status is reset to 'pending' allowing it to be processed again

- should not reset attempts counter

    when retry is called, the attempts counter is preserved at its current value and not reset to 0

- should clear completed_at timestamp

    when retry is called on a failed task, the completed_at timestamp is cleared (set to null)

- should allow task to be dequeued again after retry

    when a failed task is retried, it can be dequeued again, moves to processing status, and increments the attempts counter

- should handle task that has not reached max attempts

    when a task is retried and has not yet reached max_attempts, the attempts count remains less than max_attempts

##### requeueStaleProcessingTasks

- should requeue processing tasks that started more than timeout ago

    when processing tasks have been running longer than the specified timeout, they are reset to pending status and the count of requeued tasks is returned

- should not requeue recent processing tasks

    when processing tasks started within the timeout period, they remain in processing status and are not requeued

- should not requeue tasks that exceeded max attempts

    when a processing task has already reached its max_attempts limit, it is not requeued even if the timeout has passed

#### Task Processor

##### handler registration

- should register task handler

    when a handler function is registered for a task type, the registration completes successfully without errors

##### start and stop

- should start processor

    when start is called with a registered handler, the processor successfully starts and isRunning returns true

- should stop processor gracefully

    when stop is called on a running processor, it stops gracefully and isRunning returns false

##### task processing

- should process task and mark as completed

    when a task is enqueued and the processor is started, the task handler is executed with the correct task, and the task is marked as completed in the database

- should handle task errors and mark as failed

    when a task handler throws an error, the task is marked as failed with the error message stored in the database

##### getProgress

- should return progress statistics

    when tasks are in various states (pending, processing, completed, failed), getProgress returns accurate counts for each status and the total

#### Task Queue Drizzle

##### enqueue

- should create task with pending status

    when a task is enqueued, creates a task with a valid UUID, pending status, zero attempts, and correct task type

- should use default priority and maxAttempts

    when a task is enqueued without specifying priority or maxAttempts, uses default values of 'normal' priority and 3 max attempts

- should accept custom priority and maxAttempts

    when a task is enqueued with custom priority and maxAttempts values, creates the task with those specified values

- should serialize payload JSON

    when a task with complex payload including nested config objects is enqueued, the payload is correctly serialized and can be retrieved with all properties intact

##### dequeue

- should return null when queue is empty

    when dequeue is called on an empty queue, returns null

- should return next pending task

    when dequeue is called with pending tasks, returns the task, updates status to 'processing', increments attempts to 1, and sets startedAt timestamp

- should respect priority order (high > normal > low)

    when tasks with different priorities are enqueued, dequeue returns them in priority order: high, normal, then low

- should respect FIFO order for same priority

    when multiple tasks have the same priority, dequeue returns them in the order they were created (first in, first out)

- should skip processing tasks

    when a task is already in processing status, dequeue skips it and returns the next pending task

##### complete

- should mark task as completed

    when complete is called on a processing task, updates the task status to 'completed' and sets the completedAt timestamp

##### fail

- should mark task as failed with error message

    when fail is called with an error message, updates the task status to 'failed', stores the error message, and sets the completedAt timestamp

##### retry

- should reset failed task to pending

    when retry is called on a failed task, resets the status to 'pending', clears the error message, and clears the completedAt timestamp

##### requeueStaleProcessingTasks

- should requeue tasks exceeding timeout

    when processing tasks have been running longer than the specified timeout, resets them to pending status, clears startedAt, and returns the count of requeued tasks

- should not requeue tasks within timeout

    when processing tasks started within the timeout period, leaves them in processing status and returns zero

- should not requeue tasks that exceeded max attempts

    when a processing task has reached its max_attempts limit, does not requeue it even if the timeout has passed

##### findById

- should return task when exists

    when findById is called with a valid task ID, returns the complete task object with all properties

- should return null when not exists

    when findById is called with a non-existent task ID, returns null

##### getProgress

- should return zero stats when empty

    when no tasks exist in the queue, getProgress returns zero counts for all statuses (pending, processing, completed, failed, total)

- should count tasks by status

    when tasks exist in various states, getProgress accurately counts and returns the number of tasks in each status category

#### Page Task Queue

##### enqueueBatch

- should enqueue multiple page tasks

    when enqueueBatch is called with multiple page payloads, creates tasks for all pages and returns an array of task IDs with correct count

- should return empty array for empty input

    when enqueueBatch is called with an empty array, returns an empty array without creating any tasks

- should apply priority to all tasks

    when enqueueBatch is called with a priority parameter, all created tasks have the specified priority

- should apply maxAttempts to all tasks

    when enqueueBatch is called with a maxAttempts parameter, all created tasks have the specified max_attempts value

### storage

#### Page Repository Drizzle

##### create

- should insert page record

    when creating a page with project ID, normalized URL, and original URL, inserts the record into the database with a valid UUID, stores all URL fields correctly, and sets the createdAt timestamp

- should return created page with UUID

    when creating a page, returns the page object with a valid UUID format, Date object for createdAt, and the correct normalized URL value

##### findById

- should return page when exists

    when finding a page by its ID, returns the complete page object with all properties including ID, project ID, normalized URL, original URL, and createdAt as a Date object

- should return null when not exists

    when finding a page by a non-existent ID, returns null

##### findByProjectId

- should return all pages for project

    when finding pages by project ID, returns all pages associated with that project, each with the correct project ID, and includes all normalized URLs in the result set

- should return empty array when no pages

    when finding pages for a non-existent project, returns an empty array

##### findByNormalizedUrl

- should return page when exists

    when finding a page by project ID and normalized URL, returns the page with matching normalized URL and project ID

- should return null when not exists

    when finding a page by normalized URL that doesn't exist for a project, returns null

- should distinguish between different projects

    when the same normalized URL exists in different projects, correctly returns different page records with different IDs but the same normalized URL, distinguishing by project ID

##### findOrCreate

- should return existing page if found

    when finding or creating a page with a normalized URL that already exists, returns the existing page with the same ID instead of creating a new one

- should create new page if not found

    when finding or creating a page with a normalized URL that doesn't exist, creates a new page record with a valid UUID and stores it in the database

- should be idempotent - multiple calls return same page

    when calling findOrCreate multiple times with the same normalized URL but different original URLs or fragments, returns the same page ID every time and only creates one record in the database

##### date handling

- should correctly convert ISO string timestamps to Date objects

    when creating a page, stores the createdAt timestamp as an ISO string in the database, converts it to a Date object when returned, and the timestamp is within the expected time range

#### Diff Repository

##### create

- should create diff with summary and changes

    when creating a diff with summary statistics and multiple changes, inserts the record with all fields including page ID, run IDs, snapshot IDs, summary data, and changes array, returning a diff with a defined ID

- should generate UUID for new diff

    when creating a diff, generates a valid UUID in the format of 36 characters with hyphens

- should serialize summary_json and changes_json

    when creating a diff with complex summary and changes objects including nested data structures, correctly serializes both to JSON, stores them in the database, and deserializes them correctly when retrieved

- should set created_at timestamp

    when creating a diff, sets the createdAt timestamp to the current time within a reasonable tolerance range

##### findByPageAndRun

- should find diff by pageId and runId

    when finding a diff by page ID and run ID, returns the complete diff object with matching IDs, summary statistics, and changes array

- should return null when diff not found

    when finding a diff with non-existent page and run IDs, returns null

- should deserialize JSON fields correctly

    when retrieving a diff with complex summary and changes including nested objects and metadata, correctly deserializes all JSON fields and preserves the original data structure

##### findByRun

- should find all diffs for a run

    when finding diffs by run ID with multiple pages, returns all diffs associated with that run ID

- should return empty array when no diffs

    when finding diffs for a non-existent run, returns an empty array

- should order by created_at DESC

    when multiple diffs exist for a run, returns them ordered by creation time with the most recent diff first

#### Task Queue Migration

##### tasks table

- should create tasks table

    when running migrations, creates the tasks table in the database

- should have correct columns

    when checking the tasks table schema, contains all required columns including id, type, status, priority, payload_json, attempts, max_attempts, error_message, created_at, started_at, and completed_at

- should have NOT NULL constraints on required columns

    when checking column constraints, id, type, and status columns have NOT NULL constraints enforced

- should have indexes for efficient querying

    when checking table indexes, includes indexes on status column for dequeue operations and created_at column for ordering

- should allow inserting task records

    when inserting a task record with all required fields including UUID, type, status, priority, JSON payload, and attempts, successfully creates the record in the database

#### Project Repository Drizzle

##### create

- should insert project record

    when creating a project with name, base URL, and config, inserts the record with a valid UUID, stores all fields correctly, sets status to NEW, and creates both createdAt and updatedAt timestamps as Date objects

- should return created project with id

    when creating a project with config including maxPages, returns the project with a valid UUID format, Date timestamps, and preserves all config values including nested properties

- should store description when provided

    when creating a project with an optional description field, stores the description value correctly

- should handle optional description

    when creating a project without a description field, leaves description as undefined

##### findById

- should return project when exists

    when finding a project by ID, returns the complete project object with matching ID, name, and correctly deserialized config object

- should return null when not exists

    when finding a project with a non-existent ID, returns null

- should properly deserialize JSON config

    when retrieving a project with complex config including nested viewport object and multiple settings, correctly deserializes all config properties from JSON

##### findAll

- should return all projects

    when finding all projects, returns an object with projects array containing all project records and total count matching the array length

- should support pagination

    when finding projects with limit and offset parameters, returns the correct subset of projects for each page and accurate total count across all pages

- should return projects ordered by created_at DESC

    when retrieving multiple projects, returns them ordered by creation time with the most recently created project first

- should return empty array when no projects

    when finding projects in an empty database, returns an object with empty projects array and total count of zero

##### updateStatus

- should update project status

    when updating a project's status, changes the status value in the database to the new status

- should update updated_at timestamp

    when updating a project's status, sets the updatedAt timestamp to a value greater than the original timestamp

#### Run Repository Drizzle

##### create

- should insert run record

    when creating a run with project ID, baseline flag, and config, inserts the record with a valid UUID, stores all fields, sets status to NEW, initializes statistics as null, creates createdAt timestamp, and leaves startedAt and completedAt undefined

- should return created run with id

    when creating a run, returns the run object with a valid UUID format, Date for createdAt, and correct isBaseline flag value

- should handle baseline flag correctly

    when creating both baseline and comparison runs with different isBaseline values, correctly stores and distinguishes between baseline (true) and comparison (false) runs

##### findById

- should return run when exists

    when finding a run by ID, returns the complete run object with matching ID, project ID, and correctly deserialized config object

- should return null when not exists

    when finding a run with a non-existent ID, returns null

- should properly deserialize JSON columns

    when retrieving a run with config containing nested objects, correctly deserializes the config from JSON and returns null for statistics when not set

- should handle optional timestamps

    when retrieving a newly created run, returns createdAt as a Date object and startedAt and completedAt as undefined

##### findByProjectId

- should return all runs for project

    when finding runs by project ID, returns all run records associated with that project

- should return runs ordered by created_at DESC

    when retrieving multiple runs for a project, returns them ordered by creation time with the most recently created run first

- should return empty array when no runs

    when finding runs for a non-existent project, returns an empty array

##### updateStatus

- should update run status

    when updating a run's status, changes the status value in the database

- should set started_at when status is IN_PROGRESS

    when updating status to IN_PROGRESS, sets the startedAt timestamp to a Date object and leaves completedAt undefined

- should set completed_at when status is COMPLETED

    when updating status to COMPLETED, sets the completedAt timestamp to a Date object

- should not modify timestamps for other statuses

    when updating status to a value other than IN_PROGRESS or COMPLETED (e.g., INTERRUPTED), does not modify startedAt or completedAt timestamps

##### updateStatistics

- should update run statistics

    when updating run statistics with counts for total pages, completed pages, error pages, changed pages, and unchanged pages, stores all statistics values correctly

- should overwrite existing statistics

    when updating statistics multiple times, replaces the previous statistics object with the new values

#### Snapshot Repository Drizzle

##### create

- should insert snapshot record with all fields

    when creating a snapshot with all possible fields including redirect chain, performance data, and file paths, inserts the record with a valid UUID, stores all fields correctly, sets status to PENDING, and generates standard file paths for screenshot and HAR files

- should handle optional fields

    when creating a snapshot with only required fields, correctly handles undefined optional fields like redirectChain, performanceData, screenshotPath, and harPath

- should accept custom ID

    when creating a snapshot with a custom ID provided, uses the provided ID instead of generating a UUID

##### findById

- should return snapshot when exists

    when finding a snapshot by ID, returns the complete snapshot object with all properties and correctly deserialized JSON fields

- should return null when not exists

    when finding a snapshot with a non-existent ID, returns null

- should deserialize all JSON columns

    when retrieving a snapshot with complex data including redirect chain, headers, SEO data, and performance data, correctly deserializes all JSON columns and preserves nested object structures

##### findByPageAndRun

- should return snapshot for page-run combination

    when finding a snapshot by page ID and run ID combination, returns the snapshot with matching IDs

- should return null when combination not exists

    when finding a snapshot with a page-run combination that doesn't exist, returns null

##### findByRunId

- should return all snapshots for run

    when finding snapshots by run ID with multiple pages, returns all snapshot records associated with that run and includes all page IDs

- should return empty array when no snapshots

    when finding snapshots for a non-existent run, returns an empty array

##### findByPageId

- should return all snapshots for page

    when finding snapshots by page ID with multiple runs, returns all snapshot records associated with that page and includes all run IDs

- should return empty array when no snapshots

    when finding snapshots for a non-existent page, returns an empty array

##### update

- should update all fields

    when updating a snapshot with all possible field changes including status, HTTP status, redirect chain, headers, SEO data, performance data, file paths, and error message, updates all fields correctly in the database

- should handle partial updates

    when updating only selected fields like status and error message, updates those fields while preserving all other original field values

#### Diff Repository Drizzle

##### create

- should insert diff record with all fields

    when creating a diff with summary and changes array, inserts the record with a valid UUID, stores all fields including page ID, run IDs, snapshot IDs, summary object, changes array, and sets createdAt timestamp

- should handle empty changes array

    when creating a diff with no changes and hasChanges set to false, correctly stores an empty changes array and zero change counts

- should serialize complex nested JSON

    when creating a diff with deeply nested JSON structures in summary and changes including custom metrics and metadata, correctly serializes and stores all nested data

##### findByPageAndRun

- should return diff for page-run combination

    when finding a diff by page ID and run ID, returns the complete diff object with matching IDs and correctly deserialized summary and changes

- should return null when not exists

    when finding a diff with a non-existent page ID, returns null

- should properly deserialize JSON columns

    when retrieving a diff with multiple changes of different types, correctly deserializes all JSON fields, preserves change types, and maintains the correct array length

##### findByRun

- should return all diffs for run

    when finding diffs by run ID with multiple pages, returns all diff records for that run with correct page IDs

- should return empty array when no diffs

    when finding diffs for a non-existent run, returns an empty array

- should order by created_at DESC

    when multiple diffs exist for a run, returns them ordered by creation time with the most recently created diff first

#### Project Repository

##### create

- should insert project record

    when creating a project, inserts the record with a defined ID, correct name and base URL, and status set to NEW

- should return created project with id

    when creating a project with maxPages config, returns the project with a valid UUID format and Date objects for timestamps

- should store description when provided

    when creating a project with a description, stores the description value in the record

##### findById

- should return project when exists

    when finding a project by ID, returns the project object with matching ID and name

- should return null when not exists

    when finding a project with a non-existent ID, returns null

##### updateStatus

- should update project status

    when updating a project's status, changes the status value to the new status

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

    when processing a scan with crawl enabled and maxPages limit, does not exceed the maximum page limit of 100

##### processScan - error handling

- should handle page errors gracefully

    when processing a scan for an invalid domain that cannot be reached, completes with COMPLETED status, creates page with ERROR status, includes error in statistics (1 error page, 0 completed), and updates project and run status to COMPLETED

##### processScan - viewport and configuration

- should respect custom viewport settings

    when processing a scan with custom viewport dimensions, uses the specified viewport width and height in the result configuration

- should include pagination metadata

    when processing a scan, includes pagination object in result with totalPages, limit, offset, and hasMore properties

