# Shared Tests

This file is part of the test documentation. See [../tests.md](../tests.md) for the overview.

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
