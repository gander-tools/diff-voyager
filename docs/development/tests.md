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

