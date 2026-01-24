# Backend Unit Tests

This file is part of the test documentation. See [../tests.md](../tests.md) for the overview.

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
