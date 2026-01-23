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

##### Internationalized Domain Names (IDN)

- should handle punycode encoded domains

    when normalizing URL with punycode domain (xn--n3h.com), returns normalized path /page

- should handle unicode domains

    when normalizing URL with unicode domain (münchen.de), returns string starting with /

- should handle emoji domains

    when normalizing URL with emoji in domain (i❤.ws), returns valid string

- should handle mixed ASCII and unicode in path

    when URL path contains unicode characters like café, returns string containing "caf"

- should handle Japanese characters in path

    when URL path contains Japanese characters, returns string starting with /

- should handle Chinese characters in path

    when URL path contains Chinese characters, returns string starting with /

##### IPv6 URLs

- should handle IPv6 loopback address

    when normalizing http://[::1]/page, returns /page

- should handle full IPv6 address

    when normalizing URL with full IPv6 address [2001:0db8:85a3:0000:0000:8a2e:0370:7334], returns /page

- should handle compressed IPv6 address

    when normalizing URL with compressed IPv6 [2001:db8::1], returns /page

- should handle IPv6 with port

    when normalizing http://[::1]:8080/page, returns /page

- should extract origin from IPv6 URL

    when getting origin from IPv6 URL with port, origin contains [::1] and port 8080

##### Special Characters in URLs

- should handle percent-encoded characters

    when URL contains %20 for spaces, returns string containing "path"

- should handle multiple consecutive slashes

    when URL contains ///page///path, returns valid string

- should handle backslashes in path

    when URL path contains backslashes, returns valid string

- should handle semicolons in path

    when URL contains session ID with semicolon, returns valid string

- should handle pipe characters

    when URL contains pipe character, returns valid string

- should handle curly braces in path

    when URL contains {id} template syntax, normalized path matches pattern with braces or percent-encoding

##### Very Long URLs

- should handle URL with 2000 character path

    when path is 2000+ characters long, returns string longer than 1000 characters

- should handle URL with 100 query parameters

    when URL has 100 query parameters, returns valid string

- should handle URL with very long query parameter value

    when single query parameter value is 5000 characters, returns valid string

- should handle deeply nested path

    when path has 50 nested levels, result has 40+ path segments

##### Unicode and Emoji in URLs

- should handle emoji in path

    when URL path contains 👍 emoji, returns valid string

- should handle multiple emojis

    when URL path contains multiple emojis 🔥💯✨, returns valid string

- should handle zero-width characters

    when URL contains zero-width characters, returns valid string

- should handle right-to-left characters

    when URL contains Arabic RTL characters, returns valid string

##### Percent-Encoded Edge Cases

- should handle double percent-encoding

    when URL contains %2520 (double-encoded space), returns valid string

- should handle uppercase vs lowercase percent-encoding

    when URL contains %2f vs %2F, both return valid strings

- should handle invalid percent-encoding

    when URL contains invalid %ZZ encoding, returns valid string

- should handle incomplete percent-encoding

    when URL contains incomplete %2 encoding, returns valid string

##### Port Numbers

- should handle non-standard HTTP port

    when getting origin from http://example.com:8080, returns http://example.com:8080

- should omit default HTTP port 80

    when getting origin from http://example.com:80, may return with or without :80

- should omit default HTTPS port 443

    when getting origin from https://example.com:443, may return with or without :443

- should handle very high port numbers

    when port is 65535, origin contains port number

- should handle port 0

    when port is 0, returns valid origin string

##### Subdomain Variations

- should differentiate www and non-www

    when comparing example.com and www.example.com, isSameDomain returns false

- should handle multiple subdomains

    when comparing api.example.com and api.v2.example.com, isSameDomain returns false

- should handle deeply nested subdomains

    when comparing a.b.c.d.e.example.com with itself, isSameDomain returns true

##### Query Parameter Edge Cases

- should handle empty query parameter values

    when query params have empty values (param1=&param2=), result contains param names

- should handle query parameters without values

    when query has flags without values (?flag1&flag2), returns valid string

- should handle duplicate query parameters

    when query has multiple values for same parameter (?id=1&id=2&id=3), result contains "id"

- should handle query parameters with special characters

    when query contains + and , characters, returns valid string

- should handle query string with only ampersands

    when query is just ?&&&, returns valid string

##### Fragment Handling

- should remove simple fragment

    when URL has #section fragment, normalized result does not contain #

- should remove fragment with slashes

    when URL has #/virtual/route fragment, result does not contain #

- should remove fragment with query-like syntax

    when URL has #?param=value fragment, result does not contain #

- should remove fragment with special characters

    when URL has #section!@$% fragment, result does not contain #

##### Case Sensitivity

- should lowercase simple paths

    when URL path is /PAGE, returns /page

- should lowercase mixed-case paths

    when URL is /MyPage/SubPath, result is all lowercase

- should handle uppercase query parameters

    when query has uppercase ?PARAM=VALUE, returns valid string

##### Data URLs and Special Schemes

- should handle blob URLs

    when normalizing blob: URL, does not throw error

- should handle data URLs

    when normalizing data: URL, does not throw error

- should handle mailto URLs

    when normalizing mailto: URL, does not throw error

- should handle tel URLs

    when normalizing tel: URL, does not throw error

##### Whitespace and Control Characters

- should handle leading whitespace

    when URL has leading spaces, does not throw error

- should handle trailing whitespace

    when URL has trailing spaces, does not throw error

- should handle tabs in URL

    when URL contains tab character, does not throw error

- should handle newlines in URL

    when URL contains newline character, does not throw error

- should handle carriage returns

    when URL contains carriage return, does not throw error

##### Boundary Conditions

- should handle empty path

    when URL is just https://example.com, returns /

- should handle URL with only protocol and domain

    when URL is https://example.com/, returns /

- should handle single character path

    when URL is https://example.com/a, returns /a

- should handle path with only dot

    when URL contains /./page, returns valid string

- should handle path with double dots

    when URL contains /path/../page, returns valid string

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

##### Corrupted Images

- should handle truncated PNG data

    when baseline is truncated PNG, compare returns error

- should handle invalid PNG header

    when PNG has invalid header bytes, compare returns error

- should handle empty buffer

    when buffer is empty, compare returns error

- should handle null bytes

    when buffer contains only null bytes, compare returns error

- should handle corrupted image data section

    when PNG data section is corrupted, compare returns error

##### Zero and Minimal Size Images

- should handle 1x1 pixel images

    when comparing 1x1 pixel images (white vs black), diffPixels is 1 and diffPercentage is 100

- should handle 1x1 identical pixels

    when comparing identical 1x1 images, diffPixels is 0 and diffPercentage is 0

- should handle 1-pixel wide images

    when comparing 1x100 pixel images, diffPixels is 0 for identical images

- should handle 1-pixel tall images

    when comparing 100x1 pixel images, diffPixels is 0 for identical images

##### Large Images

- should handle HD resolution images (1920x1080)

    when comparing HD resolution images, diffPixels is 0 for identical images with correct width and height

- should handle tall images (100x2000)

    when comparing tall images, diffPixels is 0 for identical images

- should handle wide images (2000x100)

    when comparing wide images, diffPixels is 0 for identical images

##### Transparency and Alpha Channel

- should compare fully transparent images

    when comparing images with alpha 0, diffPixels is 0 for identical transparency

- should detect differences in alpha channel only

    when RGB is identical but alpha differs (255 vs 128), diffPixels is greater than 0

- should handle gradient transparency

    when comparing gradient alpha vs flat alpha, diffPixels is greater than 0

- should compare images with partial transparency

    when both images have alpha 200, diffPixels is 0

- should handle checkerboard transparency pattern

    when both images have same checkerboard alpha pattern, diffPixels is 0

##### Aspect Ratio Mismatches

- should detect portrait vs landscape mismatch

    when comparing 100x200 portrait with 200x100 landscape, returns error containing "size"

- should detect square vs rectangle mismatch

    when comparing 100x100 square with 100x150 rectangle, returns error

- should detect extreme aspect ratio mismatch

    when comparing 1000x10 wide with 10x1000 tall, returns error

##### Color Depth and Variations

- should compare pure black and pure white

    when comparing black (0,0,0) with white (255,255,255), diffPixels is 10000 and diffPercentage is 100

- should detect subtle grayscale differences

    when comparing gray (127,127,127) with gray (128,128,128), diffPixels is numeric

- should handle images with single color channel active

    when comparing pure red with pure green, diffPixels is greater than 0

- should compare monochrome images

    when comparing black with white, diffPercentage is 100

##### Diff Image Generation Edge Cases

- should generate diff image for 1x1 images

    when generateDiffImage is true for 1x1 images, diffImage is defined with 1x1 dimensions

- should generate diff image for large images

    when generateDiffImage is true for 800x600 images, diffImage is defined with 800x600 dimensions

- should not generate diff image when images are identical

    when generateDiffImage is false and images identical, diffImage is undefined

##### Threshold Boundary Conditions

- should handle threshold of 0%

    when threshold is 0 and any pixel differs, thresholdExceeded is true

- should handle threshold of 100%

    when threshold is 100 and all pixels differ, thresholdExceeded is false

- should handle very small threshold (0.001%)

    when threshold is 0.001 and images identical, thresholdExceeded is false

- should handle threshold exactly at diff percentage

    when threshold equals actual diff percentage, thresholdExceeded is false

##### Pixel Format Edge Cases

- should handle images with odd dimensions

    when comparing 101x99 images, diffPixels is 0 with correct width and height

- should handle images with prime number dimensions

    when comparing 97x89 images, diffPixels is 0

- should handle images with power-of-2 dimensions

    when comparing 512x512 black with white, diffPixels is 262144

##### Real-World Scenarios

- should handle antialiasing differences

    when comparing sharp (0,0,0) with blurred (1,1,1), diffPixels is numeric

- should handle subpixel rendering differences

    when comparing (100,100,100) with (101,100,100), diffPercentage is numeric

- should handle JPEG-like compression artifacts

    when comparing clean (128,128,128) with noisy (129,127,128), diffPixels is numeric

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

##### Browser Launch Failures

- should handle browser launch with custom timeout

    when BrowserManager is configured with custom 30000ms launch timeout, successfully launches browser within timeout

- should handle multiple concurrent launch attempts

    when 10 concurrent getBrowser() calls are made, all resolve to same browser instance with only 1 unique browser created

##### Browser Crash Scenarios

- should detect when browser is closed

    when browser is running and then closed, isConnected() changes from true to false

- should handle multiple crash recovery attempts

    when browser is launched, closed, and relaunched 3 times, each cycle completes successfully

- should cleanup resources after browser close

    when browser is closed, isActive() returns false indicating proper cleanup

##### Memory Management

- should handle creation of many browser contexts

    when 10 browser contexts are created concurrently, all contexts are created successfully and close without errors

- should handle creation of many pages

    when 20 pages are created in single context, all pages are created successfully

- should cleanup pages after context close

    when context with 2 pages is closed, both pages have isClosed() as true

- should handle rapid browser creation and destruction

    when browser is created and destroyed 5 times rapidly, all cycles complete without memory leaks

##### Network Failure Scenarios

- should handle offline network mode

    when context is set to offline mode, page navigation throws error and navigation succeeds after going back online

- should handle DNS resolution failure

    when navigating to non-existent domain, page.goto() rejects with error

- should handle connection timeout

    when page navigation times out after 1ms, page.goto() rejects with timeout error

- should handle slow network conditions

    when network responses are delayed by 100ms and timeout is 50ms, page.goto() rejects with timeout error

##### CSP Violations

- should handle pages with strict CSP

    when page has Content-Security-Policy with default-src 'none', page content loads successfully

- should detect CSP violations in console

    when page has CSP blocking scripts, console messages can be captured for monitoring

- should handle CSP blocking external resources

    when page has CSP blocking external images, failed resource requests are tracked

##### Resource Loading Errors

- should handle 404 errors for resources

    when page references non-existent resources, failed requests are tracked and page loads

- should handle mixed content blocking

    when page tries to load external scripts blocked by CSP, blocked requests are tracked

- should handle CORS errors

    when page makes cross-origin fetch request, CORS error is handled gracefully

##### JavaScript Runtime Errors

- should handle uncaught JavaScript exceptions

    when page throws JavaScript error, pageerror event captures the error

- should handle evaluate timeout

    when page.evaluate() runs longer than timeout, rejects with timeout error

- should handle promise rejections

    when page.evaluate() returns rejected promise, rejects with error

##### Browser State Management

- should handle browser disconnection gracefully

    when browser is manually closed, isConnected() becomes false and isActive() becomes false

- should prevent operations on closed browser

    when attempting newContext() on closed browser, throws error

- should handle rapid open/close cycles

    when browser is opened and closed 10 times rapidly, all cycles complete successfully

##### Concurrent Browser Operations

- should handle concurrent page navigations

    when 3 pages navigate to content concurrently, all pages load content successfully

- should handle concurrent context creation

    when 3 contexts are created concurrently, all contexts are created successfully

- should isolate errors between concurrent operations

    when one page navigation fails while another succeeds, successful page loads correctly

##### Configuration Edge Cases

- should handle invalid browser args

    when BrowserManager is configured with invalid flags, browser still launches successfully

- should handle extremely high timeout values

    when defaultTimeout is set to Number.MAX_SAFE_INTEGER, browser launches successfully

- should handle zero timeout

    when defaultTimeout is set to 0, browser launches successfully

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

    when processing a scan with crawl enabled and maxPages limit, does not exceed the maximum page limit of 100

##### processScan - error handling

- should handle page errors gracefully

    when processing a scan for an invalid domain that cannot be reached, completes with COMPLETED status, creates page with ERROR status, includes error in statistics (1 error page, 0 completed), and updates project and run status to COMPLETED

##### processScan - viewport and configuration

- should respect custom viewport settings

    when processing a scan with custom viewport dimensions, uses the specified viewport width and height in the result configuration

- should include pagination metadata

    when processing a scan, includes pagination object in result with totalPages, limit, offset, and hasMore properties

---

# shared

## api-contract

### Diff Schemas

#### pageDiffSchema

##### valid data

- should accept valid page diff with no changes

    when parsing a page diff with hasChanges false and empty arrays, accepts the data and returns pageId and hasChanges flag

- should accept page diff with SEO changes

    when parsing a page diff with SEO changes array containing field names and baseline/current values, accepts the data, returns correct array length, and preserves field names

- should accept SEO change with only baseline (deletion)

    when parsing a page diff with SEO change containing only baseline value (current is optional), accepts the data as a valid deletion scenario

- should accept SEO change with only current (addition)

    when parsing a page diff with SEO change containing only current value (baseline is optional), accepts the data as a valid addition scenario

- should accept header changes

    when parsing a page diff with header changes array containing header name and baseline/current values, accepts the data as valid

- should accept performance changes

    when parsing a page diff with performance changes array containing metric names and numeric values, accepts the data and returns correct array length

- should accept all types of changes together

    when parsing a page diff with SEO, header, and performance changes combined, accepts the data as valid

##### invalid data

- should reject missing pageId

    when parsing a page diff without pageId field, rejects the data as invalid

- should reject invalid UUID for pageId

    when parsing a page diff with non-UUID string for pageId, rejects the data as invalid

- should reject missing required arrays

    when parsing a page diff without seoChanges, headerChanges, or performanceChanges arrays, rejects the data as invalid

- should reject SEO change without field

    when parsing a page diff with SEO change missing the field name, rejects the data as invalid

- should reject header change without header name

    when parsing a page diff with header change missing the header field, rejects the data as invalid

- should reject performance change without metric

    when parsing a page diff with performance change missing the metric field, rejects the data as invalid

#### taskStatusSchema

##### valid data

- should accept valid task with pending status

    when parsing a task with id, type, pending status, and createdAt timestamp, accepts the data and returns correct status value

- should accept all valid status values

    when parsing tasks with each valid status (pending, processing, completed, failed), accepts all as valid

- should accept task with all optional fields

    when parsing a task with optional fields including startedAt, completedAt, attempts, and payload object, accepts the data and preserves all field values

- should accept task with error message

    when parsing a failed task with error field, accepts the data as valid

- should accept attempts as integer

    when parsing a task with integer attempts value, accepts the data as valid

- should accept payload as any object

    when parsing a task with complex nested payload object, accepts the data as valid

##### invalid data

- should reject missing required fields

    when parsing a task without type or createdAt, rejects the data as invalid

- should reject invalid status enum value

    when parsing a task with status value not in enum (pending, processing, completed, failed), rejects the data and includes status in error path

- should reject invalid UUID

    when parsing a task with non-UUID string for id, rejects the data as invalid

- should reject invalid timestamp

    when parsing a task with non-timestamp string for createdAt, rejects the data as invalid

- should reject float for attempts (requires integer)

    when parsing a task with float value for attempts field, rejects the data as invalid integer type

- should reject invalid timestamp for optional timestamp fields

    when parsing a task with invalid timestamp string for completedAt, rejects the data as invalid

### Nested Schemas

#### viewportSchema (in nested context)

- should validate nested viewport in projectConfig

    when parsing project config with nested viewport object, accepts the data and preserves width and height values

- should validate nested viewport in runConfig

    when parsing run config with nested viewport object, accepts the data as valid

#### projectConfigSchema (composition)

- should enforce all required fields

    when parsing project config missing visualDiffThreshold, rejects the data and includes visualDiffThreshold in error path

- should validate visualDiffThreshold range (0-1)

    when parsing project config with visualDiffThreshold outside 0-1 range (negative or >1), rejects the data as invalid

- should accept boundary values for visualDiffThreshold

    when parsing project config with visualDiffThreshold at boundary values (0 or 1), accepts both as valid

#### runConfigSchema (composition)

- should require all three fields

    when parsing run config missing captureHar field, rejects the data as invalid

- should validate boolean types for flags

    when parsing run config with string "true" instead of boolean for captureScreenshots, rejects the data as invalid type

#### statisticsSchema (all integer fields)

- should accept valid integer statistics

    when parsing statistics with all valid integer fields, accepts the data as valid

- should accept zero for all fields

    when parsing statistics with all fields set to zero, accepts the data as valid

- should reject float values for any field

    when parsing statistics with float values for any of the 9 fields, rejects all as invalid integer type

- should require all 9 fields

    when parsing statistics missing any of the 9 required fields (totalPages, completedPages, errorPages, changedPages, unchangedPages, totalDifferences, criticalDifferences, acceptedDifferences, mutedDifferences), rejects as invalid

#### runStatisticsSchema (subset of statistics)

- should accept valid run statistics

    when parsing run statistics with totalPages, completedPages, and errorPages, accepts the data as valid

- should accept zero for all fields

    when parsing run statistics with all fields set to zero, accepts the data as valid

- should require exactly 3 fields

    when parsing run statistics missing any of the 3 required fields (totalPages, completedPages, errorPages), rejects as invalid

- should reject float values

    when parsing run statistics with float value for totalPages, rejects the data as invalid integer type

- should not accept extra fields from full statistics

    when parsing run statistics with extra fields from full statistics schema, accepts the data (Zod strips unknown keys by default)

#### nested validation cascading

- should cascade validation errors from nested viewport

    when parsing project config with invalid nested viewport (width too small), rejects the data and includes viewport in error path

- should validate multiple nested fields independently

    when parsing project config with multiple invalid fields (viewport width/height and visualDiffThreshold), rejects with multiple error issues

### Path Parameters

#### projectIdParamSchema

- should accept valid project ID

    when parsing path params with valid UUID projectId, accepts the data and returns projectId value

- should reject invalid UUID for projectId

    when parsing path params with non-UUID projectId, rejects the data and includes projectId in error path

- should reject missing projectId

    when parsing empty path params object, rejects the data as invalid

- should reject all invalid UUIDs

    when parsing path params with various invalid UUID formats, rejects all as invalid

#### runIdParamSchema

- should accept valid run ID

    when parsing path params with valid UUID runId, accepts the data and returns runId value

- should reject invalid UUID for runId

    when parsing path params with non-UUID runId, rejects the data and includes runId in error path

- should reject missing runId

    when parsing empty path params object, rejects the data as invalid

#### pageIdParamSchema

- should accept valid page ID

    when parsing path params with valid UUID pageId, accepts the data and returns pageId value

- should reject invalid UUID for pageId

    when parsing path params with non-UUID pageId, rejects the data and includes pageId in error path

- should reject missing pageId

    when parsing empty path params object, rejects the data as invalid

#### taskIdParamSchema

- should accept valid task ID

    when parsing path params with valid UUID taskId, accepts the data and returns taskId value

- should reject invalid UUID for taskId

    when parsing path params with non-UUID taskId, rejects the data and includes taskId in error path

- should reject missing taskId

    when parsing empty path params object, rejects the data as invalid

### Request Schemas

#### viewportSchema

##### valid data

- should accept valid viewport dimensions

    when parsing viewport with width 1920 and height 1080, accepts the data and returns width and height values

- should accept minimum viewport dimensions (320x240)

    when parsing viewport with minimum dimensions, accepts the data as valid

- should accept 4K viewport (3840x2160)

    when parsing viewport with 4K dimensions, accepts the data as valid

- should accept all valid viewport configurations

    when parsing multiple valid viewport configurations from fixtures, accepts all as valid

##### invalid data

- should reject width less than 320

    when parsing viewport with width 319, rejects the data and includes width in error path

- should reject height less than 240

    when parsing viewport with height 239, rejects the data and includes height in error path

- should reject negative width

    when parsing viewport with negative width, rejects the data as invalid

- should reject negative height

    when parsing viewport with negative height, rejects the data as invalid

- should reject float width (requires integer)

    when parsing viewport with float width value, rejects the data as invalid integer type

- should reject float height (requires integer)

    when parsing viewport with float height value, rejects the data as invalid integer type

- should reject missing width

    when parsing viewport without width field, rejects the data as invalid

- should reject missing height

    when parsing viewport without height field, rejects the data as invalid

- should reject all invalid viewport configurations

    when parsing multiple invalid viewport configurations from fixtures, rejects all as invalid

#### createScanBodySchema

##### valid data

- should accept minimal valid scan request (only url)

    when parsing request body with only url field, accepts the data and returns url value

- should accept all optional fields

    when parsing request body with all optional fields (sync, name, description, crawl, maxPages, viewport, collectHar, waitAfterLoad, visualDiffThreshold), accepts the data and preserves all field values

- should accept sync: false

    when parsing request body with sync set to false, accepts the data as valid

- should accept crawl: false

    when parsing request body with crawl set to false, accepts the data as valid

- should accept maxPages as positive integer

    when parsing request body with maxPages as positive integer, accepts the data as valid

- should accept waitAfterLoad: 0 (minimum)

    when parsing request body with waitAfterLoad set to 0, accepts the data as valid

- should accept visualDiffThreshold: 0 (minimum)

    when parsing request body with visualDiffThreshold at minimum boundary (0), accepts the data as valid

- should accept visualDiffThreshold: 1 (maximum)

    when parsing request body with visualDiffThreshold at maximum boundary (1), accepts the data as valid

- should accept nested viewport

    when parsing request body with nested viewport object, accepts the data and preserves viewport width value

##### invalid data

- should reject missing url

    when parsing request body without url field, rejects the data and includes url in error path

- should reject invalid URL

    when parsing request body with various invalid URL formats, rejects all as invalid

- should reject maxPages: 0 (must be positive)

    when parsing request body with maxPages set to 0, rejects the data and includes maxPages in error path

- should reject negative maxPages

    when parsing request body with negative maxPages, rejects the data as invalid

- should reject float maxPages (requires integer)

    when parsing request body with float maxPages value, rejects the data as invalid integer type

- should reject negative waitAfterLoad

    when parsing request body with negative waitAfterLoad, rejects the data and includes waitAfterLoad in error path

- should reject float waitAfterLoad (requires integer)

    when parsing request body with float waitAfterLoad value, rejects the data as invalid integer type

- should reject visualDiffThreshold less than 0

    when parsing request body with visualDiffThreshold below minimum (negative), rejects the data and includes visualDiffThreshold in error path

- should reject visualDiffThreshold greater than 1

    when parsing request body with visualDiffThreshold above maximum (>1), rejects the data and includes visualDiffThreshold in error path

- should reject invalid nested viewport

    when parsing request body with invalid nested viewport (width too small), rejects the data as invalid

#### createRunBodySchema

##### valid data

- should accept minimal valid run request (only url)

    when parsing request body with only url field, accepts the data and returns url value

- should accept all optional fields

    when parsing request body with all optional fields (viewport, collectHar, waitAfterLoad), accepts the data and preserves all field values

- should accept collectHar: false

    when parsing request body with collectHar set to false, accepts the data as valid

- should accept waitAfterLoad: 0

    when parsing request body with waitAfterLoad set to 0, accepts the data as valid

- should accept nested viewport

    when parsing request body with nested viewport at minimum dimensions (320x240), accepts the data as valid

##### invalid data

- should reject missing url

    when parsing request body without url field, rejects the data and includes url in error path

- should reject invalid URL

    when parsing request body with various invalid URL formats, rejects all as invalid

- should reject negative waitAfterLoad

    when parsing request body with negative waitAfterLoad, rejects the data as invalid

- should reject float waitAfterLoad

    when parsing request body with float waitAfterLoad value, rejects the data as invalid integer type

- should reject invalid nested viewport

    when parsing request body with invalid nested viewport (height too small), rejects the data as invalid

### Query Schemas

#### getProjectQuerySchema

##### valid data

- should accept empty query (all optional)

    when parsing empty query params object, accepts the data as valid since all fields are optional

- should accept includePages as boolean true

    when parsing query params with includePages set to boolean true, accepts the data and returns true

- should accept includePages as boolean false

    when parsing query params with includePages set to boolean false, accepts the data and returns false

- should coerce string "true" to boolean true

    when parsing query params with includePages as string "true", accepts and coerces to boolean true

- should transform string "false" to boolean false (explicit string parsing)

    when parsing query params with includePages as string "false", accepts and transforms to boolean false using explicit string parsing (z.enum and transform)

- should accept pageLimit as number

    when parsing query params with pageLimit as number, accepts the data and returns number value

- should coerce string "50" to number 50

    when parsing query params with pageLimit as string "50", accepts and coerces to number 50

- should accept pageOffset as number

    when parsing query params with pageOffset as number, accepts the data and returns number value

- should coerce string "100" to number 100

    when parsing query params with pageOffset as string "100", accepts and coerces to number 100

- should accept all query parameters together

    when parsing query params with includePages, pageLimit, and pageOffset as strings, accepts and coerces all to correct types (boolean true, number 50, number 10)

##### invalid data

- should reject pageLimit less than 1

    when parsing query params with pageLimit 0, rejects the data and includes pageLimit in error path

- should reject negative pageLimit

    when parsing query params with negative pageLimit, rejects the data as invalid

- should reject negative pageOffset

    when parsing query params with negative pageOffset, rejects the data and includes pageOffset in error path

- should reject non-numeric string for pageLimit

    when parsing query params with non-numeric string for pageLimit, rejects the data as invalid

- should reject float for pageLimit (requires int)

    when parsing query params with float pageLimit value, rejects the data as invalid integer type

#### listProjectsQuerySchema

##### valid data

- should accept empty query (all optional)

    when parsing empty query params object, accepts the data as valid since all fields are optional

- should accept limit as number

    when parsing query params with limit as number, accepts the data and returns number value

- should coerce string "50" to number 50

    when parsing query params with limit as string "50", accepts and coerces to number 50

- should accept offset as number

    when parsing query params with offset as number, accepts the data and returns number value

- should coerce string "100" to number 100

    when parsing query params with offset as string "100", accepts and coerces to number 100

- should accept minimum limit (1)

    when parsing query params with limit at minimum boundary (1), accepts the data as valid

- should accept maximum limit (100)

    when parsing query params with limit at maximum boundary (100), accepts the data as valid

- should accept both limit and offset

    when parsing query params with both limit and offset as strings, accepts and coerces both to correct numbers (50 and 10)

##### invalid data

- should reject limit less than 1

    when parsing query params with limit 0, rejects the data and includes limit in error path

- should reject limit greater than 100

    when parsing query params with limit 101, rejects the data and includes limit in error path

- should reject negative limit

    when parsing query params with negative limit, rejects the data as invalid

- should reject negative offset

    when parsing query params with negative offset, rejects the data and includes offset in error path

- should reject float for limit (requires int)

    when parsing query params with float limit value, rejects the data as invalid integer type

- should reject non-numeric string for limit

    when parsing query params with non-numeric string for limit, rejects the data as invalid

#### listRunsQuerySchema

- should have same structure as listProjectsQuerySchema

    when parsing query params with limit and offset strings, accepts and coerces to numbers (50 and 10)

- should reject limit greater than 100

    when parsing query params with limit 101, rejects the data as invalid

- should accept minimum and maximum values

    when parsing query params with minimum (limit 1, offset 0) and maximum (limit 100, offset 1000) values, accepts both as valid

#### listRunPagesQuerySchema

##### valid data

- should accept empty query (all optional)

    when parsing empty query params object, accepts the data as valid since all fields are optional

- should accept limit and offset

    when parsing query params with limit and offset as strings, accepts and coerces to numbers (50 and 10)

- should accept status filter

    when parsing query params with status filter, accepts the data and returns status value

- should accept all parameters together

    when parsing query params with limit, offset, and status together, accepts and coerces all values correctly (20, 5, "error")

##### invalid data

- should reject limit greater than 100

    when parsing query params with limit 101, rejects the data as invalid

- should reject negative offset

    when parsing query params with negative offset, rejects the data as invalid

### Common Schemas

#### uuidSchema

##### valid data

- should accept valid UUID v4 format

    when parsing valid UUID v4 string, accepts the data and returns the UUID value

- should accept multiple valid UUID formats

    when parsing multiple valid UUIDs from fixtures, accepts all as valid

##### invalid data

- should reject non-UUID string

    when parsing non-UUID string, rejects the data with "Invalid uuid" error message

- should reject empty string

    when parsing empty string, rejects the data as invalid UUID

- should reject UUID with wrong format (missing hyphens)

    when parsing UUID string without hyphens, rejects the data as invalid UUID format

- should reject UUID that is too short

    when parsing truncated UUID string, rejects the data as invalid UUID

- should reject all invalid UUID formats

    when parsing multiple invalid UUID formats from fixtures, rejects all as invalid

#### urlSchema

##### valid data

- should accept valid https URL

    when parsing valid https URL, accepts the data and returns the URL value

- should accept valid http URL

    when parsing valid http URL, accepts the data as valid

- should accept URL with path

    when parsing URL with path component, accepts the data as valid

- should accept URL with query parameters

    when parsing URL with query string, accepts the data as valid

- should accept URL with subdomain

    when parsing URL with subdomain, accepts the data as valid

- should accept URL with port

    when parsing URL with port number, accepts the data as valid

- should accept all valid URL formats

    when parsing multiple valid URLs from fixtures, accepts all as valid

##### invalid data

- should reject non-URL string

    when parsing non-URL string, rejects the data with "Invalid url" error message

- should reject empty string

    when parsing empty string, rejects the data as invalid URL

- should reject relative path

    when parsing relative path without protocol or domain, rejects the data as invalid URL

- should reject URL without protocol

    when parsing domain without protocol scheme, rejects the data as invalid URL

- should reject protocol-relative URL

    when parsing protocol-relative URL (//example.com), rejects the data as invalid URL

- should reject all invalid URL formats

    when parsing multiple invalid URLs from fixtures, rejects all as invalid

#### timestampSchema

##### valid data

- should accept valid ISO 8601 timestamp

    when parsing valid ISO 8601 timestamp string, accepts the data and returns the timestamp value

- should accept timestamp with milliseconds

    when parsing timestamp with millisecond precision, accepts the data as valid

- should accept timestamp without milliseconds

    when parsing timestamp without millisecond precision, accepts the data as valid

- should accept all valid timestamp formats

    when parsing multiple valid timestamps from fixtures, accepts all as valid

##### invalid data

- should reject non-datetime string

    when parsing non-datetime string, rejects the data with "Invalid datetime" error message

- should reject empty string

    when parsing empty string, rejects the data as invalid timestamp

- should reject date without time

    when parsing date-only string without time component, rejects the data as invalid timestamp

- should reject US date format

    when parsing US date format (MM/DD/YYYY), rejects the data as invalid timestamp

- should reject invalid month

    when parsing timestamp with month value 13, rejects the data as invalid datetime

- should reject invalid day

    when parsing timestamp with day value 32, rejects the data as invalid datetime

- should reject all invalid timestamp formats

    when parsing multiple invalid timestamps from fixtures, rejects all as invalid

### Response Schemas

#### paginationSchema

- should accept valid pagination

    when parsing pagination object with total, limit, offset, and hasMore, accepts the data and returns all values (total 100, limit 50, offset 0, hasMore true)

- should accept zero values

    when parsing pagination with all fields set to zero and hasMore false, accepts the data as valid

- should reject missing required fields

    when parsing pagination with only total field, rejects the data as invalid

- should reject non-integer total

    when parsing pagination with float total value, rejects the data as invalid integer type

#### errorResponseSchema

- should accept valid error response

    when parsing error response with error object containing code and message, accepts the data and returns error code and message

- should reject missing error object

    when parsing empty response object, rejects the data as invalid

- should reject missing code

    when parsing error object without code field, rejects the data as invalid

- should reject missing message

    when parsing error object without message field, rejects the data as invalid

#### projectConfigSchema

- should accept valid project config

    when parsing project config with crawl, viewport, and visualDiffThreshold, accepts the data and returns all values (crawl true, viewport width 1920, visualDiffThreshold 0.01)

- should accept config without maxPages (optional)

    when parsing project config without maxPages field, accepts the data as valid

- should reject missing required fields

    when parsing project config with only crawl field, rejects the data as invalid

- should reject invalid viewport

    when parsing project config with invalid nested viewport (width too small), rejects the data as invalid

- should reject non-integer maxPages

    when parsing project config with float maxPages value, rejects the data as invalid integer type

#### statisticsSchema

- should accept valid statistics

    when parsing statistics with all 9 integer fields, accepts the data and returns values (totalPages 100, completedPages 95, errorPages 5)

- should accept zero statistics

    when parsing statistics with all fields set to zero, accepts the data as valid

- should reject missing required fields

    when parsing statistics with only totalPages field, rejects the data as invalid

- should reject non-integer values

    when parsing statistics with float totalPages value, rejects the data as invalid integer type

#### projectListItemSchema

- should accept valid project list item

    when parsing project list item with id, name, description, baseUrl, status, and timestamps, accepts the data and returns all values

- should reject invalid UUID

    when parsing project list item with non-UUID id, rejects the data as invalid

- should reject invalid URL

    when parsing project list item with non-URL baseUrl, rejects the data as invalid

- should reject invalid timestamp

    when parsing project list item with non-timestamp createdAt, rejects the data as invalid

#### projectDetailsSchema

- should accept valid project details

    when parsing project details with all required fields including nested config, statistics, and pagination, accepts the data and returns all values

- should reject invalid nested config

    when parsing project details with incomplete nested config (missing viewport), rejects the data as invalid

- should reject invalid nested statistics

    when parsing project details with incomplete nested statistics (missing required fields), rejects the data as invalid

#### runConfigSchema

- should accept valid run config

    when parsing run config with viewport, captureScreenshots, and captureHar, accepts the data and returns all values (viewport width 1920, both flags true)

- should accept false for capture flags

    when parsing run config with capture flags set to false, accepts the data as valid

- should reject missing required fields

    when parsing run config with only viewport field, rejects the data as invalid

- should reject invalid viewport

    when parsing run config with invalid nested viewport (width too small), rejects the data as invalid

#### runStatisticsSchema

- should accept valid run statistics

    when parsing run statistics with totalPages, completedPages, and errorPages, accepts the data and returns all values (50, 48, 2)

- should accept zero statistics

    when parsing run statistics with all fields set to zero, accepts the data as valid

- should reject non-integer values

    when parsing run statistics with float totalPages value, rejects the data as invalid integer type

#### runResponseSchema

- should accept valid run response

    when parsing run response with id, projectId, isBaseline, status, and createdAt, accepts the data and returns all values (id matches, isBaseline true)

- should accept isBaseline: false

    when parsing run response with isBaseline false and in_progress status, accepts the data as valid

- should reject invalid UUID

    when parsing run response with non-UUID id, rejects the data as invalid

#### runDetailsSchema

- should accept valid run details

    when parsing run details with all fields including nested config and statistics, accepts the data and returns values (config captureScreenshots true, statistics totalPages 50)

- should reject invalid nested config

    when parsing run details with incomplete nested config (missing capture flags), rejects the data as invalid

#### createScanAsyncResponseSchema

- should accept valid async scan response

    when parsing async scan response with projectId, status PENDING, and projectUrl, accepts the data and returns all values

- should reject invalid UUID

    when parsing async scan response with non-UUID projectId, rejects the data as invalid

#### createRunResponseSchema

- should accept valid run response

    when parsing run response with runId, status PENDING, and runUrl, accepts the data and returns all values

- should reject invalid UUID

    when parsing run response with non-UUID runId, rejects the data as invalid

#### runPagesListSchema

- should accept valid run pages list

    when parsing run pages list with empty pages array and pagination object, accepts the data and returns pagination total (100)

- should reject missing required fields

    when parsing run pages list with only pages array, rejects the data as invalid

- should reject invalid pagination

    when parsing run pages list with incomplete pagination object (missing required fields), rejects the data as invalid

---

# frontend

## unit

### views

#### DashboardView

- should render welcome message

    verifies component displays "Diff Voyager" welcome message on mount

- should fetch recent projects on mount

    verifies store fetch is triggered on mount and projects are loaded into projectsStore with correct count (1 project)

- should display statistics

    verifies component displays project count statistics correctly with 2 projects showing "2" in the text

- should show empty state when no projects

    verifies component displays "No projects" message when API returns empty projects array

- should navigate to new project on button click

    verifies clicking new project button navigates to '/projects/new' route

- should navigate to projects list on view all button

    verifies clicking view all button navigates to '/projects' route

- should display loading state

    verifies component shows "Loading" text while async projects fetch is in progress

- should display error state

    verifies store error property is set when API returns 500 server error

#### SettingsView

- should render settings form

    verifies form renders with language select, viewport preset select, and theme select inputs

- should load current settings on mount

    verifies settings store values are loaded into form fields on component mount with language 'en', theme 'dark', and viewport 1920x1080

- should render save button

    verifies save button exists with text containing 'common.save' i18n key

- should reset to defaults when reset button is clicked

    verifies clicking reset button restores default settings (language 'en', theme 'auto') and shows success message

- should integrate with ui store for theme management

    verifies ui store is accessible with setTheme and setLanguage methods defined

- should render viewport preset options

    verifies viewport preset select dropdown exists in the form

- should render viewport width and height inputs

    verifies both viewport width and height input fields exist in the form

- should render visual threshold input

    verifies visual diff threshold input field exists in the form

- should render max pages input

    verifies max pages limit input field exists in the form

- should render collect HAR switch

    verifies collect HAR toggle switch exists in the form

- should render wait after load input

    verifies wait after load delay input field exists in the form

- should render compact mode switch

    verifies compact mode toggle switch exists in the form

- should persist settings to localStorage

    verifies settings are saved to localStorage after update with language 'pl', theme 'dark', and viewport 1366x768

#### PageDetailView

- should render page details

    verifies component displays page URL 'https://example.com/test-page' and HTTP status '200' after loading

- should display change summary

    verifies component displays diff summary with counts '1 critical', '1 warnings', and '1 info'

- should display diff actions when changes exist

    verifies component shows 'Accept Changes', 'Mute', and 'Create Rule' buttons when diffs are present

- should not display diff actions when no changes

    verifies component hides action buttons when diff summary shows 0 total changes

- should render all four tabs

    verifies component displays tabs for 'SEO & Content', 'Visual Diff', 'Performance', and 'Headers'

- should handle navigation back

    verifies clicking back button calls router.back() method

- should handle error when loading page fails

    verifies component displays 'Failed to get page' error message when API returns 404 page not found

- should handle missing diff gracefully

    verifies component still displays page details (URL) when diff API returns 404 error

- should eventually load and display page details

    verifies component shows page URL 'https://example.com/test-page' after async loading completes

#### RunDetailView

- should render run details

    verifies component displays run ID text 'Run #run-123' after loading

- should display run statistics

    verifies component shows statistics with values '10', '8', and '2' for totalPages, completedPages, and errorPages

- should display run configuration

    verifies component shows config values '1920 × 1080' viewport, 'Enabled' screenshots, and 'Disabled' HAR

- should display pages list

    verifies component renders all three page URLs from mockPages array

- should show progress bar for in-progress runs

    verifies component displays 'Progress' text and '50%' completion when run status is 'in_progress'

- should show retry button when errors exist

    verifies retry button exists when run has errorPages count of 2

- should not show retry button when no errors

    verifies retry button does not exist when errorPages count is 0

- should call retry API when retry button clicked

    verifies clicking retry button triggers POST to retry endpoint and retryCalled flag is set to true

- should navigate to runs list on back button click

    verifies clicking back to runs button navigates to 'runs' route with projectId 'proj-123'

- should navigate to project on back button click

    verifies clicking back to project button navigates to 'project-detail' route with projectId 'proj-123'

- should show loading state

    verifies component displays 'Loading run details' text while async API calls are in progress

- should show error state on API failure

    verifies component shows 'Retry' text when API returns 500 server error

- should show empty state when no pages

    verifies component displays 'No pages found' message when pages array is empty

- should display status badge

    verifies RunStatusBadge component exists in the rendered output

- should start polling for in-progress runs

    verifies store isPolling flag is true when run status is 'in_progress'

- should stop polling on unmount

    verifies store isPolling flag is false after component is unmounted

#### RuleCreateView

- should render page header with title

    verifies component displays 'Create New Rule' title text

- should render page header with subtitle

    verifies component displays 'Define conditions to mute or accept differences' subtitle text

- should render RuleForm component

    verifies RuleForm child component exists in the rendered output

- should render back button

    verifies back button exists with text 'Cancel'

- should navigate back to rules list when back button clicked

    verifies clicking back button calls router.push with route name 'rules'

- should pass projectId to RuleForm when provided in query

    verifies RuleForm receives projectId prop 'test-project-123' when present in route query params

- should not pass projectId to RuleForm when not in query

    verifies RuleForm projectId prop is undefined when route query params are empty

- should handle form submission

    verifies form submit event calls rulesStore.createRule with form data containing name, scope, active, description, and conditions

- should navigate to rules list after successful creation

    verifies router.push is called with route name 'rules' after successful rule creation with ID 'rule-123'

- should handle form cancellation

    verifies RuleForm cancel event calls router.push with route name 'rules'

- should pass loading state to RuleForm during creation

    verifies RuleForm loading prop is true during async createRule operation and false after completion

- should display error message on creation failure

    verifies RuleForm submitError prop contains 'Failed to create rule' message when createRule rejects

#### ProjectListView

- should render title

    verifies component displays 'Projects' title text

- should fetch projects on mount

    verifies store fetch is triggered on mount and projectList contains 1 project

- should display project cards

    verifies component renders text 'Test Project' from project data

- should show empty state when no projects

    verifies component displays 'No projects' message when API returns empty array

- should navigate to new project on button click

    verifies clicking new project button calls router.push with path '/projects/new'

- should support pagination

    verifies store pagination reflects API response with total 25, hasMore true based on offset calculation

#### ProjectDetailView

- should render project name

    verifies component displays 'Test Project' name after loading

- should render project description

    verifies component displays 'Test description' text after loading

- should render base URL

    verifies component displays 'https://example.com' base URL after loading

- should render status badge

    verifies ProjectStatusBadge component exists in the rendered output

- should render statistics component

    verifies component displays 'Statistics' and 'Total Pages' text after loading

- should show loading state on mount

    verifies component displays 'Loading' text before async API call completes

- should handle project not found

    verifies component displays 'not found' error message when API returns 404 error

- should navigate back to projects list

    verifies clicking back button calls router.push with route name 'projects'

- should navigate to create run view

    verifies clicking create run button calls router.push with route name 'run-create' and projectId 'proj-123'

- should handle delete project

    verifies delete button exists and is clickable (dialog interaction not fully testable in unit tests)

#### ProjectCreateView

- should render ProjectForm component

    verifies component displays 'Create Project' text and contains ProjectForm

- should handle successful project creation

    verifies form submit triggers API POST, receives project ID 'proj-123', and navigates to 'project-detail' route

- should display error on failed project creation

    verifies form submit with invalid data shows error and does not navigate (router.push not called)

- should show loading state during project creation

    verifies component displays 'Creating' text while async API call is in progress

- should allow navigation back to projects list

    verifies clicking back button calls router.push with route name 'projects'

#### RunListView

- should render title

    verifies component displays 'Runs' title text

- should fetch runs on mount

    verifies store fetch is triggered on mount and runs for projectId 'proj-123' contains 2 runs

- should display run cards

    verifies component renders text 'Run #run-1' and 'Run #run-2' from runs data

- should show empty state when no runs

    verifies component displays 'No runs yet' message when API returns empty runs array

- should show project name in subtitle

    verifies component displays 'Test Project' name after loading project data

- should navigate to new run on button click

    verifies clicking new run button calls router.push with route name 'run-create' and projectId 'proj-123'

- should navigate to project on back button click

    verifies clicking back button calls router.push with route name 'project-detail' and projectId 'proj-123'

- should show loading state

    verifies component displays 'Loading' text while async API calls are in progress

- should show error state on API failure

    verifies back button exists after API returns 500 server error (error state rendered)

#### RunCreateView

- should render title

    verifies component displays 'Create New Run' title text after loading

- should display project name in subtitle

    verifies component displays 'Test Project' name in subtitle after loading

- should fetch project data on mount

    verifies RunForm component with url-input exists after project data is loaded

- should pre-fill URL with project baseUrl

    verifies RunForm receives projectUrl prop 'https://example.com' from loaded project data

- should create run on form submission

    verifies clicking submit button triggers API POST and navigates to 'run-detail' route with runId 'run-123'

- should navigate back on cancel button click

    verifies clicking back button calls router.push with route name 'runs' and projectId 'proj-123'

- should navigate back on cancel form button click

    verifies clicking form cancel button calls router.push with route name 'runs' and projectId 'proj-123'

- should show loading state while fetching project

    verifies component displays 'Loading' text while async project API call is in progress

- should show creating state during submission

    verifies submit button exists during async run creation (loading state handled by RunForm component)

- should display form fields correctly

    verifies all form fields exist: url-input, viewport-preset-select, viewport-width-input, viewport-height-input, collect-har-switch, wait-after-load-input

#### RulesListView

- should render title

    verifies component displays 'Mute Rules' title text

- should render subtitle

    verifies component displays 'Manage rules for ignoring specific differences' subtitle text

- should fetch rules on mount

    verifies store loading is false after onMounted completes, indicating API was called

- should display new rule button

    verifies button exists with text 'Create Rule' and data-test attribute

- should navigate to new rule on button click

    verifies clicking create rule button calls router.push with path '/rules/new'

- should show empty state when no rules

    verifies component displays 'Create your first mute rule' message when rules array is empty

- should display scope filter with all options

    verifies filter container exists with buttons for 'All', 'Global', and 'Project' scopes

- should display rules when store has rules

    verifies component displays 'Test Rule' text when rules array contains one rule

- should filter global rules when global filter is selected

    verifies clicking global filter button shows only 'Global Rule' text in the output

- should filter project rules when project filter is selected

    verifies clicking project filter button shows only 'Project Rule' text in the output

- should display correct counts in filter buttons

    verifies filter buttons display correct counts: 'All (2)', 'Global (1)', 'Project (1)'

- should show appropriate empty state for global filter

    verifies component displays 'No global rules' message when only project rules exist and global filter is active

- should show appropriate empty state for project filter

    verifies component displays 'No project-specific rules' message when only global rules exist and project filter is active

### components

#### RuleScopeBadge

- should render Global scope

    verifies badge displays 'Global' text for RuleScope.GLOBAL

- should render Project scope

    verifies badge displays 'Project' text for RuleScope.PROJECT

- should apply correct type for Global scope

    verifies badge element exists with data-test attribute for global scope

- should apply correct type for Project scope

    verifies badge element exists with data-test attribute for project scope

- should support different sizes

    verifies badge renders with size prop 'small' without errors

- should use medium size by default

    verifies badge renders with default size (no size prop) and has data-test attribute

#### RunStatistics

- should render all statistics

    verifies component displays values '150', '145', '5', and '25' from statistics object

- should display page statistics

    verifies component displays labels 'Total Pages', 'Completed', and 'Errors'

- should display diff statistics

    verifies component displays labels 'Critical', 'Accepted', and 'Muted'

- should display changed and unchanged page statistics

    verifies component displays labels 'Changed' and 'Unchanged' with values '25' and '120'

- should handle zero values

    verifies component displays '0' for all statistics when all values are zero

- should render in a grid layout

    verifies component contains grid element with data-test attribute 'statistics-grid'

- should support compact mode

    verifies component renders without errors when compact prop is true

#### RunStatusBadge

- should render NEW status as Pending with gray badge

    verifies badge displays 'Pending' text and has no animation class for RunStatus.NEW

- should render IN_PROGRESS status as Processing with blue badge and animation

    verifies badge displays 'Processing' text and has animated class for RunStatus.IN_PROGRESS

- should render COMPLETED status as Completed with green badge

    verifies badge displays 'Completed' text and has no animation class for RunStatus.COMPLETED

- should render INTERRUPTED status as Failed with red badge

    verifies badge displays 'Failed' text and has no animation class for RunStatus.INTERRUPTED

- should support different sizes

    verifies badge renders without errors when size prop is 'small'

- should have data-test attribute

    verifies badge element has data-test attribute 'run-status-badge'

#### RuleCard

- should render rule name

    verifies card displays 'Ignore dynamic timestamps' rule name

- should render rule description

    verifies card displays 'Ignore changes in timestamp fields' description text

- should render scope badge

    verifies RuleScopeBadge component exists in the rendered output

- should render active/inactive toggle

    verifies toggle element exists with data-test attribute 'rule-active-toggle'

- should render conditions summary with count

    verifies card displays '2 conditions' text for rule with 2 conditions

- should render "1 condition" for single condition

    verifies card displays '1 condition' (singular) for rule with 1 condition

- should render "No conditions defined" for empty conditions

    verifies card displays 'No conditions defined' text when conditions array is empty

- should render created date

    verifies card displays '2024' year from createdAt timestamp

- should emit click event when card is clicked

    verifies click event is emitted when card element is clicked

- should emit edit event when edit button is clicked

    verifies edit event is emitted with rule ID 'rule-123' when edit button is clicked

- should emit delete event when delete button is clicked

    verifies delete event is emitted with rule ID 'rule-123' when delete button is clicked

- should prevent click propagation when edit button is clicked

    verifies edit event is emitted but click event is not when edit button is clicked

- should prevent click propagation when delete button is clicked

    verifies delete event is emitted but click event is not when delete button is clicked

- should emit toggleActive event when toggle is changed

    verifies toggleActive event is emitted with rule ID and new value (false) when NSwitch emits update:value

- should handle rule without description

    verifies card renders without errors when description is undefined

- should handle global scope rule

    verifies RuleScopeBadge component exists when rule scope is 'global'

- should handle inactive rule

    verifies toggle element exists when rule active property is false

- should apply hover styling

    verifies card element exists with data-test attribute for hover effects

#### ProjectStatistics

- should render all statistics

    verifies component displays values '150', '145', '5', and '20' from statistics object

- should display page statistics

    verifies component displays labels 'Total Pages', 'Completed', and 'Errors'

- should display diff statistics

    verifies component displays labels 'Accepted', 'Muted', 'Total Differences', and 'Critical Differences'

- should display changed and unchanged page statistics

    verifies component displays labels 'Changed' and 'Unchanged' with values '20' and '125'

- should handle zero values

    verifies component displays '0' for all statistics when all values are zero

- should render in a grid layout

    verifies component contains grid element with data-test attribute 'statistics-grid'

- should support compact mode

    verifies component renders without errors when compact prop is true

#### SeoDiffView

- should render empty state when no changes

    verifies component displays 'No SEO changes detected' message when seoChanges array is empty

- should render SEO changes with card title by default

    verifies component displays 'SEO Changes' title and renders 3 change elements

- should render SEO changes without card title when showTitle is false

    verifies component does not display 'SEO Changes' title but renders 3 change elements when showTitle prop is false

- should display field labels correctly

    verifies component displays formatted labels 'Page Title', 'Meta Description', and 'Canonical URL'

- should display severity badges correctly

    verifies component displays 'Critical', 'Warning', and 'Info' severity badges for 3 changes

- should display baseline and current values

    verifies component displays both baseline ('Old Title', 'Old description') and current ('New Title', 'New description') values

- should format null values as "(not set)"

    verifies component displays '(not set)' text for null baseline value in canonical field

- should format empty string values as "(empty)"

    verifies component displays '(empty)' text for empty string baseline value

- should truncate long values

    verifies component truncates values longer than 150 characters and adds '...' ellipsis

- should have data-test attribute

    verifies component has data-test attribute 'seo-diff-view'

- should render Open Graph field labels correctly

    verifies component displays 'OG: Title' label for 'openGraph.title' field

- should render Twitter Card field labels correctly

    verifies component displays 'Twitter: Card Type' label for 'twitterCard.card' field

- should handle unknown field names gracefully

    verifies component displays raw field name 'unknownField' when no label mapping exists

#### PageList

- should render empty state when no pages

    verifies component displays 'No pages found' message when pages array is empty

- should render pages table when pages exist

    verifies table element exists with data-test attribute 'pages-table' when pages array has items

- should render page URLs

    verifies component displays 'example.com' and '/about' from page URLs

- should render page status badges

    verifies PageStatusBadge component exists in the rendered output

- should render HTTP status codes

    verifies component displays '200' and '500' HTTP status codes

- should show total changes count

    verifies component displays '5' for totalChanges from page diff summary

- should show "No changes" for pages without diffs

    verifies component displays 'No changes' text for page with null diff property

- should show diff type badges for SEO changes

    verifies component displays 'SEO' badge with count '(2)' for SEO changes

- should show diff type badges for header changes

    verifies component displays 'Headers' badge with count '(1)' for header changes

- should show diff type badges for performance changes

    verifies component displays 'Performance' badge with count '(1)' for performance changes

- should show diff type badge for visual diff

    verifies component displays 'Visual' badge when visualDiff is present

- should emit pageClick event when URL is clicked

    verifies pageClick event is emitted with page ID 'page-123' when URL link is clicked

- should show loading spinner when loading

    verifies component renders without errors when loading prop is true

- should handle pages with no HTTP status

    verifies component displays '-' for undefined HTTP status value

- should handle pages without visual diff

    verifies component does not display 'Visual' badge when visualDiff is undefined

- should highlight error HTTP status

    verifies component displays '500' error status code in the output

#### RunProgress

- should render progress bar

    verifies progress bar element exists with data-test attribute 'progress-bar'

- should calculate progress correctly

    verifies progress computed property returns 45% (40 completed + 5 errors out of 100 total)

- should display current phase

    verifies phase element displays 'Scanning pages' text for in_progress status

- should display pages processed count

    verifies component displays '45 / 100 pages' text showing processed and total counts

- should show error count when errors present

    verifies error count element displays '5 errors' text when errorPages is 5

- should not show error count when no errors

    verifies error count element does not exist when errorPages is 0

- should show singular "error" for 1 error

    verifies error count displays '1 error' (singular) when errorPages is 1

- should show estimated time remaining when enabled and started

    verifies estimated time element displays 'remaining' text when showEstimatedTime is true and run is started

- should not show estimated time when disabled

    verifies estimated time element does not exist when showEstimatedTime is false

- should not show estimated time when run not started

    verifies estimated time element does not exist when startedAt is undefined

- should not show estimated time when progress < 10%

    verifies estimated time element does not exist when progress is 5% (below 10% threshold)

- should show correct phase for "new" status

    verifies phase text is 'Initializing' for status 'new'

- should show correct phase for "pending" status

    verifies phase text is 'Queued' for status 'pending'

- should show correct phase for "completed" status

    verifies phase text is 'Completed' for status 'completed'

- should show correct phase for "interrupted" status

    verifies phase text is 'Interrupted' for status 'interrupted'

- should show correct phase for "error" status

    verifies phase text is 'Failed' for status 'error'

- should handle 0 total pages

    verifies progress computed property returns 0 when totalPages is 0

- should show 100% progress when all pages complete

    verifies progress computed property returns 100 when all pages are completed or errored

- should have default progress status for in_progress without errors

    verifies progressStatus computed property returns 'default' for in_progress with no errors

- should have warning status for in_progress with errors

    verifies progressStatus computed property returns 'warning' for in_progress with 5 errors

- should have error status for error status

    verifies progressStatus computed property returns 'error' for status 'error'

- should have success status for completed status

    verifies progressStatus computed property returns 'success' for completed status with no errors

- should have warning status for interrupted status

    verifies progressStatus computed property returns 'warning' for status 'interrupted'

- should format duration in seconds

    verifies formatDuration method returns '~5s' for 5000ms duration

- should format duration in minutes

    verifies formatDuration method returns '~2m' for 125000ms duration (2 minutes 5 seconds)

- should format duration in hours and minutes

    verifies formatDuration method returns '~2h 2m' for 7325000ms duration (2 hours 2 minutes)

#### RunForm

- should render form fields

    verifies all form elements exist: url-input, viewport-preset-select, viewport dimensions, collect-har-switch, wait-after-load-input, submit and cancel buttons

- should pre-fill URL from projectUrl prop

    verifies component receives and stores projectUrl prop 'https://example.com'

- should have default viewport values

    verifies viewport width and height input elements exist in the form

- should emit submit event with form data on submit

    verifies submit event is emitted when form is valid and submit button is clicked

- should emit cancel event on cancel button click

    verifies cancel event is emitted when cancel button is clicked

- should show validation error for invalid URL

    verifies submit event is not emitted when URL is invalid or empty

- should show validation error for empty URL

    verifies submit event is not emitted when URL is empty (default state)

- should disable all form fields when loading

    verifies all form input elements exist when loading prop is true

- should disable buttons when loading

    verifies submit and cancel button elements exist when loading prop is true

- should show loading state on submit button when loading

    verifies submit button exists when loading prop is true

- should display submit error when provided

    verifies error alert displays 'Failed to create run' message when submitError prop is set

- should not display error alert when no submitError prop

    verifies error alert does not exist when submitError prop is not provided

- should update viewport dimensions when preset is changed

    verifies viewport preset select and dimension inputs exist for preset interaction

- should have correct viewport preset options

    verifies viewport preset select element exists in the form

- should validate viewport width bounds

    verifies viewport width input exists for validation testing

- should validate viewport height bounds

    verifies viewport height input exists for validation testing

- should allow toggling collectHar switch

    verifies collect HAR switch element exists for interaction

- should allow changing waitAfterLoad value

    verifies wait after load input element exists for value changes

- should not submit when validation fails

    verifies submit event is not emitted when form validation fails

- should submit when all fields are valid

    verifies submit button exists and can be clicked when form has valid data from projectUrl prop

#### ProjectStatusBadge

- should render "new" status badge

    verifies badge displays 'New' text for status 'new' and has data-test attribute

- should render "in_progress" status badge

    verifies badge displays 'In Progress' text for status 'in_progress'

- should render "completed" status badge

    verifies badge displays 'Completed' text for status 'completed'

- should render "failed" status badge

    verifies badge displays 'Failed' text for status 'failed'

- should render "interrupted" status badge

    verifies badge displays 'Interrupted' text for status 'interrupted'

- should handle unknown status

    verifies badge displays 'Unknown' text for unrecognized status value

- should use different badge types for different statuses

    verifies both 'completed' and 'failed' badges render with data-test attributes

- should be able to render with size prop

    verifies badge renders without errors when size prop is 'small'

#### RunCard

- should render run ID (truncated)

    verifies card displays 'Run #run-1234' truncated ID text

- should render status badge

    verifies RunStatusBadge component exists in the rendered output

- should render page count

    verifies card displays '10' and 'pages' text from statistics

- should render diffs count when present

    verifies card displays '3' and 'diffs' text from statistics

- should render error count when present

    verifies card displays '2' and 'errors' text from statistics

- should render created date

    verifies card displays '2024' year from createdAt timestamp

- should render completed date when present

    verifies card displays 'Completed:' label when completedAt is present

- should emit click event when card is clicked

    verifies click event is emitted when card element is clicked

- should emit click event when view button is clicked

    verifies click event is emitted when view button is clicked

- should show progress bar for in-progress runs

    verifies card displays 'Progress:' text when status is 'in_progress'

- should show progress bar for pending runs

    verifies card displays 'Progress:' text when status is 'pending'

- should handle run with no diffs

    verifies card does not display 'diffs' text when diffsCount is 0

- should handle run with no errors

    verifies card does not display 'errors' text when errorPages is 0

- should apply hover styling

    verifies card element exists with data-test attribute for hover effects

#### ProjectForm

- should render step 1 by default

    verifies form displays 'Project Name' label text on initial render

- should validate required URL field in step 1

    verifies form displays 'Invalid URL format' error when submit is clicked with empty URL

- should allow proceeding to step 2 with empty name field

    verifies form moves to step 2 showing 'Crawl' text when URL is valid but name is empty

- should move to step 2 after valid step 1

    verifies form displays 'Crawl' text after valid name and URL are entered and next button is clicked

- should emit submit event with form data

    verifies submit event is emitted with form object containing name 'Test Project' and url 'https://example.com'

- should allow going back to previous step

    verifies form returns to step 1 showing 'Project Name' when back button is clicked from step 2

- should validate URL format

    verifies form displays 'invalid' error text when URL format is incorrect

#### RuleConditionBuilder

- should render operator select and initial condition

    verifies component displays operator select, first condition card, and add condition button

- should render with default values

    verifies component displays operator select and all condition field inputs for first condition

- should add new condition when add button is clicked

    verifies second condition element exists after add button is clicked

- should remove condition when remove button is clicked

    verifies second condition element no longer exists after remove button is clicked

- should not show remove button when only one condition exists

    verifies remove button does not exist when there is only one condition

- should show remove buttons for multiple conditions

    verifies all three remove buttons exist when component has three conditions

- should render with provided modelValue

    verifies both condition elements exist when modelValue prop contains 2 conditions

- should disable all inputs when disabled prop is true

    verifies all input elements exist when disabled prop is true (Naive UI handles disabled state internally)

- should render all condition field inputs

    verifies all field inputs exist: diffType select, cssSelector, xpathSelector, fieldPattern, headerName, and valuePattern

- should have correct diff type options

    verifies diffType select element exists for option selection

- should have AND and OR operator options

    verifies operator select element exists for AND/OR selection

- should render multiple conditions correctly

    verifies all condition elements and field inputs exist for three conditions

- should maintain condition count after removing middle condition

    verifies two condition elements remain (indexes 0 and 1) after removing middle condition

- should render with modelValue containing multiple conditions

    verifies all three condition elements exist when modelValue has 3 conditions

- should use default operator AND when not specified

    verifies operator select element exists with default value

- should render condition cards with proper structure

    verifies both condition cards and their remove buttons exist when component has two conditions

- should prevent removing the last remaining condition

    verifies remove button does not exist for single condition (cannot remove last condition)

#### DiffActions

##### NEW status

- should render accept, mute, and create rule buttons

    verifies accept, mute, and create rule buttons exist but undo button does not for NEW status

- should display button labels

    verifies buttons display 'Accept', 'Mute', and 'Create Rule' text for NEW status

##### ACCEPTED status

- should render only undo button

    verifies only undo button exists (accept, mute, create rule buttons do not) for ACCEPTED status

- should display undo button label

    verifies button displays 'Undo' text for ACCEPTED status

##### MUTED status

- should render only undo button

    verifies only undo button exists (accept, mute, create rule buttons do not) for MUTED status

- should display undo button for muted status

    verifies button displays 'Undo' text for MUTED status

##### Disabled state

- should disable all buttons when disabled prop is true

    verifies accept, mute, and create rule buttons have disabled attribute for NEW status

- should not disable buttons when disabled prop is false

    verifies accept, mute, and create rule buttons do not have disabled attribute for NEW status

- should disable undo button when disabled prop is true for accepted status

    verifies undo button has disabled attribute for ACCEPTED status

##### Data attributes

- should have data-test attribute on container

    verifies container element has data-test attribute 'diff-actions'

- should have data-test attributes on all buttons for NEW status

    verifies accept, mute, and create rule buttons have data-test attributes for NEW status

- should have data-test attribute on undo button for ACCEPTED status

    verifies undo button has data-test attribute 'undo-button' for ACCEPTED status

##### Button visibility based on status

- should only show action buttons for NEW status

    verifies HTML contains 'Accept', 'Mute', 'Create Rule' text but undo button does not exist for NEW status

- should only show undo button for ACCEPTED status

    verifies HTML contains 'Undo' text but accept, mute, create rule buttons do not exist for ACCEPTED status

- should only show undo button for MUTED status

    verifies HTML contains 'Undo' text but accept, mute, create rule buttons do not exist for MUTED status

#### RuleForm

- should render form fields

    verifies form displays name input, description textarea, scope select, active switch, submit and cancel buttons

- should render RuleConditionBuilder component

    verifies RuleConditionBuilder child component exists in the form

- should have default values for new rule

    verifies all form field elements exist with default initial state

- should pre-fill form with modelValue prop

    verifies component receives modelValue prop with name, description, scope, active, and conditions

- should lock scope to "project" when projectId is provided

    verifies projectId prop is set to 'test-project-id' and scope select exists

- should allow both global and project scope when no projectId

    verifies scope select element exists when projectId prop is not provided

- should emit submit event with form data on submit

    verifies name input and scope select exist for form submission testing

- should emit cancel event on cancel button click

    verifies cancel event is emitted when cancel button is clicked

- should show validation error for empty name

    verifies submit event is not emitted when name field is empty (default state)

- should show validation error for name exceeding max length

    verifies submit event is not emitted when name exceeds 100 character limit

- should show validation error for description exceeding max length

    verifies submit event is not emitted when description exceeds 500 character limit

- should disable all form fields when loading

    verifies all form input elements exist when loading prop is true

- should disable buttons when loading

    verifies submit and cancel button elements exist when loading prop is true

- should show loading state on submit button when loading

    verifies submit button element exists when loading prop is true

- should display submit error when provided

    verifies error alert displays 'Failed to create rule' message when submitError prop is set

- should not display error alert when no submitError prop

    verifies error alert does not exist when submitError prop is not provided

- should show "Create Rule" button text for new rule

    verifies submit button displays 'Create Rule' text when modelValue is not provided

- should show "Update Rule" button text when editing

    verifies submit button displays 'Update Rule' text when modelValue prop is provided

- should have active toggle enabled by default

    verifies active switch element exists in the form

- should pass disabled prop to RuleConditionBuilder when loading

    verifies RuleConditionBuilder component receives disabled prop true when loading is true

- should not pass disabled prop to RuleConditionBuilder when not loading

    verifies RuleConditionBuilder component receives disabled prop false when loading is false

- should have textarea for description field

    verifies description textarea element exists in the form

- should require name and scope fields

    verifies submit event is not emitted when required name and scope fields are empty

- should allow optional description field

    verifies description input exists but is optional (no validation error)

- should validate scope field selection

    verifies scope select element exists for validation testing

- should integrate with RuleConditionBuilder for conditions

    verifies RuleConditionBuilder component exists in the form

- should maintain form state when switching between scopes

    verifies scope select element exists and can be interacted with

- should prevent scope change when projectId is provided

    verifies scope select exists but is disabled when projectId prop is provided

- should have correct initial conditions structure

    verifies RuleConditionBuilder component has modelValue prop defined

#### PageStatusBadge

- should render PENDING status as Pending with default badge

    verifies badge displays 'Pending' text and has no animation class for PageStatus.PENDING

- should render IN_PROGRESS status as Processing with blue badge and animation

    verifies badge displays 'Processing' text and has animated class for PageStatus.IN_PROGRESS

- should render COMPLETED status as Completed with green badge

    verifies badge displays 'Completed' text and has no animation class for PageStatus.COMPLETED

- should render PARTIAL status as Partial with yellow badge

    verifies badge displays 'Partial' text and has no animation class for PageStatus.PARTIAL

- should render ERROR status as Error with red badge

    verifies badge displays 'Error' text and has no animation class for PageStatus.ERROR

- should support different sizes

    verifies badge renders without errors when size prop is 'small'

- should have data-test attribute

    verifies badge element has data-test attribute 'page-status-badge'

#### ProjectCard

- should render project name

    verifies card displays 'Test Project' name text

- should render project description

    verifies card displays 'Test description' text

- should render base URL

    verifies card displays 'https://example.com' base URL

- should render status badge

    verifies ProjectStatusBadge component exists in the rendered output

- should render created date

    verifies card displays '2024' year from createdAt timestamp

- should emit click event when card is clicked

    verifies click event is emitted when card element is clicked

- should emit delete event when delete button is clicked

    verifies delete event is emitted with project ID 'proj-123' when delete button is clicked

- should prevent click propagation when delete button is clicked

    verifies delete event is emitted but click event is not when delete button is clicked

- should handle project without description

    verifies card renders without errors when description is empty string

- should apply hover styling

    verifies card element exists with data-test attribute for hover effects

#### PageFilters

- should render filter card with title

    verifies component displays 'Filters' title text

- should render all filter inputs

    verifies all filter elements exist: change-type-select, status-select, url-pattern-input, and show-muted-checkbox

- should emit change event when change type filter changes

    verifies change event is emitted at least once after component mounts

- should emit change event when status filter changes

    verifies change event is emitted after component updates

- should emit change event when URL pattern changes

    verifies change event is emitted with filter values containing urlPattern 'test-pattern' when input value changes

- should emit change event when show muted checkbox changes

    verifies change event is emitted when checkbox is clicked

- should show reset button when filters are active

    verifies reset button appears after URL pattern is set to 'test' (filters become active)

- should reset all filters when reset button is clicked

    verifies change event is emitted with empty filter values (empty arrays, empty string, false) when reset button is clicked

- should have correct filter labels

    verifies component displays labels 'Change Type', 'Status', 'URL Pattern', and 'Show muted items'

- should initialize with empty filters

    verifies initial change event contains empty filter values (empty arrays, empty string, showMuted false)

- should emit filter values with correct structure

    verifies emitted filter object has properties changeTypes, statuses, urlPattern, and showMuted with correct types

#### DiffBadge

##### Type variant

- should render SEO type with info badge

    verifies badge displays 'SEO' text for DiffType.SEO

- should render VISUAL type with warning badge

    verifies badge displays 'Visual' text for DiffType.VISUAL

- should render CONTENT type with info badge

    verifies badge displays 'Content' text for DiffType.CONTENT

- should render PERFORMANCE type with warning badge

    verifies badge displays 'Performance' text for DiffType.PERFORMANCE

- should render HTTP_STATUS type with error badge

    verifies badge displays 'HTTP Status' text for DiffType.HTTP_STATUS

- should render HEADERS type with info badge

    verifies badge displays 'Headers' text for DiffType.HEADERS

##### Severity variant

- should render CRITICAL severity with error badge

    verifies badge displays 'Critical' text for DiffSeverity.CRITICAL

- should render WARNING severity with warning badge

    verifies badge displays 'Warning' text for DiffSeverity.WARNING

- should render INFO severity with info badge

    verifies badge displays 'Info' text for DiffSeverity.INFO

##### Status variant

- should render NEW status with warning badge

    verifies badge displays 'New' text for DiffStatus.NEW

- should render ACCEPTED status with success badge

    verifies badge displays 'Accepted' text for DiffStatus.ACCEPTED

- should render MUTED status with default badge

    verifies badge displays 'Muted' text for DiffStatus.MUTED

##### Size prop

- should support small size

    verifies badge renders without errors for size 'small' with CRITICAL severity

- should support medium size (default)

    verifies badge renders without errors for default size with CRITICAL severity

- should support large size

    verifies badge renders without errors for size 'large' with CRITICAL severity

##### Data attributes

- should have data-test attribute

    verifies badge element has data-test attribute 'diff-badge'

##### Edge cases

- should handle missing type in type variant

    verifies badge displays 'Unknown' text when type prop is missing for type variant

- should handle missing severity in severity variant

    verifies badge displays 'Unknown' text when severity prop is missing for severity variant

- should handle missing status in status variant

    verifies badge displays 'Unknown' text when status prop is missing for status variant

### stores

#### projects

##### fetchProjects

- should fetch projects list with pagination

    verifies store loads 2 projects with correct names and pagination (total 2, loading false, error null)

- should handle pagination parameters

    verifies store respects query params limit 10 and offset 5, updates pagination with hasMore true

- should handle fetch errors

    verifies store sets loading false and error truthy when API returns 500 server error

- should set loading state during fetch

    verifies store loading is true during async fetch and false after completion

##### fetchProjectById

- should fetch single project by ID

    verifies store sets currentProject with name 'Test Project' and config crawl true for project-1

- should handle 404 for non-existent project

    verifies store sets error truthy when API returns 404 for non-existent project ID

##### createProject

- should create new project

    verifies store calls API with sync mode true and returns created project with ID 'new-project-id' and name 'New Project'

- should handle validation errors

    verifies store rejects promise when API returns 400 with body errors for invalid URL

##### deleteProject

- should delete project successfully

    verifies store removes project from items map and list array after successful 204 delete

- should handle delete errors

    verifies store rejects promise when API returns 404 for non-existent project deletion

##### getters

- should return project list in order

    verifies projectList getter returns array with 2 projects in correct list order

- should return current project

    verifies currentProject getter returns project object when currentId is set

- should return null for current project if not set

    verifies currentProject getter returns null when currentId is not set

- should return recent projects with limit

    verifies recentProjects getter returns 5 projects when limit is 5 and 10 projects exist

- should return all projects if limit exceeds count

    verifies recentProjects getter returns 1 project when limit is 10 but only 1 project exists

##### state management

- should initialize with correct default state

    verifies store initializes with empty items map, empty list array, loading false, error null, currentId null, and default pagination

- should clear error on successful operation

    verifies store sets error null after successful fetchProjects when previous error was set

### utils

#### validators

##### createProjectSchema

###### required fields

- should validate valid project data

    verifies schema accepts complete valid project data with all fields

- should allow missing name field (optional)

    verifies schema accepts data with only url field when name is missing

- should require url field

    verifies schema rejects data without url field and error path contains 'url'

- should allow empty name (optional field)

    verifies schema accepts data with empty string name and valid url

###### url validation

- should accept valid HTTP URL

    verifies schema accepts 'http://example.com' as valid url

- should accept valid HTTPS URL

    verifies schema accepts 'https://example.com' as valid url

- should reject invalid URL format

    verifies schema rejects 'not-a-valid-url' string as invalid

- should reject relative URLs

    verifies schema rejects '/relative/path' as invalid url

###### name validation

- should accept name within length limits

    verifies schema accepts name with 100 characters (at max limit)

- should reject name exceeding max length

    verifies schema rejects name with 101 characters as invalid

- should trim whitespace from name

    verifies schema transforms '  Test Project  ' to 'Test Project' by trimming

###### description validation

- should accept optional description

    verifies schema accepts data with description field included

- should allow missing description

    verifies schema accepts data without description field

- should reject description exceeding max length

    verifies schema rejects description with 501 characters as invalid

###### viewport validation

- should use default viewport when not provided

    verifies schema provides default viewport {width: 1920, height: 1080} when not specified

- should accept valid viewport dimensions

    verifies schema accepts viewport with width 1920 and height 1080

- should reject viewport width below minimum

    verifies schema rejects viewport with width 319 (below 320 minimum) as invalid

- should reject viewport width above maximum

    verifies schema rejects viewport with width 3841 (above 3840 maximum) as invalid

- should reject viewport height below minimum

    verifies schema rejects viewport with height 239 (below 240 minimum) as invalid

- should reject viewport height above maximum

    verifies schema rejects viewport with height 2161 (above 2160 maximum) as invalid

###### boolean fields with defaults

- should default crawl to false

    verifies schema provides default crawl false when not specified

- should default collectHar to false

    verifies schema provides default collectHar false when not specified

- should accept crawl as true

    verifies schema accepts crawl true when explicitly provided

###### numeric fields

- should default waitAfterLoad to 1000

    verifies schema provides default waitAfterLoad 1000 when not specified

- should default visualDiffThreshold to 0.01

    verifies schema provides default visualDiffThreshold 0.01 when not specified

- should reject waitAfterLoad below minimum

    verifies schema rejects waitAfterLoad -1 (below 0 minimum) as invalid

- should reject waitAfterLoad above maximum

    verifies schema rejects waitAfterLoad 30001 (above 30000 maximum) as invalid

- should reject visualDiffThreshold below minimum

    verifies schema rejects visualDiffThreshold -0.01 (below 0 minimum) as invalid

- should reject visualDiffThreshold above maximum

    verifies schema rejects visualDiffThreshold 1.01 (above 1.0 maximum) as invalid

- should accept maxPages as undefined

    verifies schema allows maxPages to be undefined when not specified

- should accept valid maxPages value

    verifies schema accepts maxPages 100 as valid

- should reject maxPages below minimum

    verifies schema rejects maxPages 0 (below 1 minimum) as invalid

### accessibility

#### Keyboard Navigation

##### Tab Navigation

- should allow tab navigation through interactive elements in ProjectCard

    when ProjectCard is rendered, all buttons and links have tabindex not equal to -1

- should maintain logical tab order in forms

    when ProjectForm is rendered, all input, textarea, select, and button elements maintain proper tab order

- should have focusable elements in RunCard

    when RunCard is rendered, contains at least one focusable element (a, button, input, etc.)

##### Keyboard Shortcuts

- should respond to Enter key on clickable elements

    when Enter key is pressed on clickable element in ProjectCard, element responds to keydown event

- should support Space key on buttons

    when Space key is pressed on button in ProjectCard, button responds to keydown event

##### Focus Management

- should have visible focus indicators on ProjectCard

    when ProjectCard is rendered, all focusable elements exist and can receive focus

- should focus first input on ProjectForm mount

    when ProjectForm is mounted, first input/textarea/select element exists in DOM

##### ARIA Attributes

- should have aria-label on icon-only buttons in ProjectCard

    when ProjectCard contains buttons without text, each has aria-label or aria-labelledby attribute

- should have proper status indicators in RunCard

    when RunCard is rendered with status, status information is present in text content

##### Screen Reader Support

- should have descriptive labels for form inputs

    when ProjectForm is rendered, each input has associated label via for/id, aria-label, or aria-labelledby

- should have alt text or aria-label for icons

    when ProjectCard contains images, each has alt attribute, aria-label, or role="presentation"

##### Color and Contrast

- should not rely solely on color for status in RunCard

    when RunCard shows status, status is conveyed through text, icon, or aria-label in addition to color

##### Form Validation Accessibility

- should mark required fields appropriately

    when ProjectForm has required inputs, each has aria-required="true" or required attribute

- should provide error messages for invalid inputs

    when ProjectForm input has aria-invalid="true", it has aria-describedby or aria-errormessage

##### Interactive Element Accessibility

- should have proper button roles in ProjectCard

    when ProjectCard contains button elements, each has no role or role="button"

- should have proper link roles in RunCard

    when RunCard contains link elements, each has defined href attribute

