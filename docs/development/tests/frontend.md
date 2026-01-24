# Frontend Tests

This file is part of the test documentation. See [../tests.md](../tests.md) for the overview.

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
