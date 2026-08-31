# ReconcileX UI

ReconcileX UI is the Angular frontend for the Order & Payment Reconciliation platform. It is responsible for the browser-side experience: signup, login, JWT-based authentication, CSV upload, batch orchestration, reconciliation dashboard, discrepancy investigation, filtering, and AI-assisted business insights.

This project is intentionally built as a thin client that delegates the real financial logic to the backend Spring Boot service. The UI does not calculate reconciliation results itself; it consumes structured JSON from the API, displays it, and allows users to interact with it.

---

## 1. Project purpose

The frontend solves the following business tasks:

- user signup
- user login
- storing the authentication token for the current app session
- attaching the token to protected API calls
- selecting CSV files for orders and payments
- starting the import process
- navigating to a reconciliation batch dashboard
- viewing reconciliation KPI summaries
- inspecting discrepancies and exception details
- running the reconciliation engine again on a batch
- filtering/searching discrepancy rows
- requesting AI-generated business explanations
- handling loading, error, and empty states

The architectural boundary is:

Browser (Angular) -> Spring Boot API -> reconciliation engine -> PostgreSQL / AI service

The browser never talks directly to the database or to the AI provider.

---

## 2. Technology stack

- Angular 17
- TypeScript
- RxJS
- Angular Router
- Angular HttpClient
- standalone components architecture
- localStorage for portfolio token persistence
- SCSS for component styling

The project intentionally avoids a heavy state-management library such as NgRx. The app is designed with small, focused services and feature components instead.

---

## 3. High-level architecture

The frontend follows a simple enterprise pattern:

- core/shared infrastructure
- feature-specific pages
- data contracts defined in TypeScript interfaces
- centralized HTTP access via ApiService
- centralized auth behavior via AuthService and authInterceptor

The general structure is:

```text
src/app
├── core/
│   ├── interceptors/
│   ├── models/
│   └── services/
├── features/
│   ├── login/
│   ├── signup/
│   ├── upload/
│   └── dashboard/
├── app.component.*
├── app.config.ts
├── app.routes.ts
└── ...
```

---

## 4. Routes and navigation

The route configuration is defined in `src/app/app.routes.ts`.

Routes:

- `/` -> redirect to `/login`
- `/login` -> `LoginComponent`
- `/signup` -> `SignupComponent`
- `/upload` -> `UploadComponent`
- `/dashboard/:batchId` -> `DashboardComponent`
- `/**` -> redirect to `/login`

This means the app has a clear entry flow:

```text
Login -> Upload -> Dashboard
Signup -> Login
```

The routes use Angular `loadComponent()` for lazy loading of each feature, which helps keep the initial bundle smaller and improves separation of responsibilities.

---

## 5. Main app bootstrapping

### `src/app/app.config.ts`

This file registers Angular app-level providers:

- router configuration
- HTTP client
- auth interceptor

The relevant setup is:

```ts
provideRouter(routes)
provideHttpClient(withInterceptors([authInterceptor]))
```

This is important because every API call goes through the auth interceptor unless it is explicitly excluded.

### `src/app/app.component.ts`

The root shell simply hosts the router outlet.

```html
<router-outlet></router-outlet>
```

This keeps the application shell minimal and lets feature components handle all business UI.

---

## 6. File-by-file breakdown

### Root application files

#### `src/main.ts`
Bootstraps the Angular application by creating the app and injecting the root configuration.

#### `src/styles.scss`
Global stylesheet for base page styling, fonts, color scheme, spacing, and shared visual design.

#### `src/app/app.config.ts`
Registers routing and the HTTP interceptor pipeline.

#### `src/app/app.routes.ts`
Defines the route structure and lazy-loaded feature modules/components.

#### `src/app/app.component.ts`
Root Angular component; minimal shell for routing.

#### `src/app/app.component.html`
Contains the single router outlet.

---

### Core infrastructure

#### `src/app/core/models/api.models.ts`
This file contains the TypeScript interfaces used to describe the backend contracts.

Key interfaces:

```ts
AuthRequest
AuthResponse
ImportBatchResponse
ReconciliationSummary
Discrepancy
AiAnalysisResponse
```

These interfaces model HTTP JSON payloads. They are not business logic. They are just the typed boundary between the browser and the backend.

Important values in the current implementation:

- `AuthResponse.accessToken`
- `ImportBatchResponse.importBatchId`
- `ReconciliationSummary.totalReferences`
- `Discrepancy.discrepancyType`
- `AiAnalysisResponse.executiveSummary`

#### `src/app/core/services/api.service.ts`
This is the central HTTP client service. It wraps backend calls in typed methods so feature components do not need to construct URLs or manually use HttpClient.

Available methods in this implementation:

- `login(request)`
- `signup(request)`
- `upload(ordersFile, paymentsFile)`
- `reconcile(batchId)`
- `getSummary(batchId)`
- `getDiscrepancies(batchId)`

This service is the frontend access layer for the backend API.

#### `src/app/core/services/auth.service.ts`
Responsible for client-side authentication state and navigation.

It:

- sends login requests to the backend
- stores JWT in localStorage
- stores email in localStorage
- provides `getToken()` to read the current token
- provides `logout()` to clear local state and go back to login
- provides `isAuthenticated()` to check whether a token exists

Important token storage keys in this app:

- `token`
- `reconcilex_email`

#### `src/app/core/interceptors/auth.interceptor.ts`
This functional interceptor automatically attaches the bearer token to outgoing HTTP requests.

Logic:

- read token from `AuthService.getToken()`
- skip token injection for public endpoints such as login/signup
- attach `Authorization: Bearer <token>` for protected endpoints

This is the main mechanism that ensures authenticated API requests do not have to be manually coded in every feature.

#### `src/app/core/services/ai.service.ts`
Handles AI insights requests for a specific batch.

The method `analyze(batchId)` sends a POST to:

```text
/api/ai/analysis/{batchId}
```

This service is separate from the main API service only by domain responsibility; it still uses the same backend structure.

---

### Feature components

#### `src/app/features/login/login.component.ts`
Responsible for the login screen state.

Fields:

- `email`
- `password`
- `errorMessage`

Flow:

1. user enters email + password
2. component validates required fields
3. calls `authService.login({ email, password })`
4. backend validates user credentials
5. JWT is saved to localStorage
6. app redirects to `/upload`

#### `src/app/features/login/login.component.html`
Contains the login form UI, branding, inputs, error message display, and signup navigation.

#### `src/app/features/signup/signup.component.ts`
Creates a new user account.

Flow:

1. validates email/password/confirmPassword
2. ensures both passwords match
3. calls `api.signup()`
4. on success, navigates to `/login`

This screen does not automatically authenticate the user in the current app design.

#### `src/app/features/upload/upload.component.ts`
Handles selecting CSV files and uploading them to the backend.

Responsibilities:

- `ordersFile` selection
- `paymentsFile` selection
- validation before upload
- constructing FormData
- calling `api.upload(ordersFile, paymentsFile)`
- handling success and error states
- navigating to `/dashboard/{importBatchId}` on successful upload

This is the starting point for a reconciliation batch.

#### `src/app/features/upload/upload.component.html`
The form for selecting and submitting the two input CSV files.

#### `src/app/features/dashboard/dashboard.component.ts`
This is the most important business UI component.

It manages:

- batch id extracted from route parameter
- loading initial summary
- loading discrepancy list
- running reconciliation again
- filtering/searching discrepancies
- showing modal detail for a discrepancy
- AI analysis request
- logout and new import navigation

Main state variables:

- `summary`
- `discrepancies`
- `batchId`
- `loading`
- `reconciling`
- `errorMessage`
- `searchTerm`
- `selectedType`
- `selectedDiscrepancy`
- `aiAnalysis`
- `aiLoading`
- `aiError`

Important methods:

- `ngOnInit()`
- `loadDashboard()`
- `loadDiscrepancies()`
- `runReconciliation()`
- `get filteredDiscrepancies()`
- `clearFilters()`
- `openDetails()`
- `closeDetails()`
- `analyzeWithAi()`

The dashboard is the operational investigation and exception-management page.

#### `src/app/features/dashboard/dashboard.component.html`
The main UI for KPI cards, summary values, discrepancy table, filters, modal details, and AI insights section.

#### `src/app/features/dashboard/dashboard.component.scss`
Contains the finance dashboard styling, KPI cards, charts, table layout, responsive design, and modal visuals.

---

## 7. Authentication flow in detail

The auth flow follows the standard JWT-based browser to backend pattern.

### Login flow

```text
User enters email/password
    -> LoginComponent validates fields
    -> AuthService.login()
    -> ApiService.login()
    -> POST /api/auth/login
    -> backend verifies credentials and creates JWT
    -> JWT returned as accessToken
    -> AuthService stores it in localStorage
    -> navigation to /upload
```

The login request body is shaped as:

```ts
{
  email: string;
  password: string;
}
```

The response model is:

```ts
{
  userId: number;
  email: string;
  accessToken: string;
}
```

### Token storage

The app stores the token using localStorage under the key `token`.

This is done in `AuthService.login()`:

```ts
localStorage.setItem('token', response.accessToken);
localStorage.setItem('reconcilex_email', response.email);
```

The app also reads it in `AuthService.getToken()`:

```ts
return localStorage.getItem('token');
```

### Interceptor behavior

The auth interceptor checks every outgoing HTTP request.

If the request is not a public auth endpoint and a token exists, it appends:

```http
Authorization: Bearer <token>
```

The public endpoints excluded from this logic are:

- `/auth/login`
- `/auth/signup`

This ensures the user can authenticate without sending a bearer token before login succeeds.

### Protected endpoints

Once the user is logged in, requests like:

- import
- reconciliation summary
- discrepancy retrieval
- AI analysis

are sent with the bearer token automatically.

The backend is expected to validate the JWT and authorize access to protected resources.

### Logout flow

`AuthService.logout()` removes both the token and email from localStorage and sends the user back to `/login`.

```ts
localStorage.removeItem('token');
localStorage.removeItem('reconcilex_email');
this.router.navigate(['/login']);
```

### Auth state check

`isAuthenticated()` simply checks whether a token is present:

```ts
return !!this.getToken();
```

This is a simple portfolio implementation. It does not verify JWT expiry or decode token contents. The backend remains the source of truth for authentication validity.

---

## 8. API contract model

The frontend relies on a small set of JSON contracts.

### Authentication request

```ts
export interface AuthRequest {
  email: string;
  password: string;
}
```

### Authentication response

```ts
export interface AuthResponse {
  userId: number;
  email: string;
  accessToken: string;
}
```

### Batch import response

```ts
export interface ImportBatchResponse {
  importBatchId: number;
  ordersImported: number;
  paymentsImported: number;
  status: string;
}
```

This is the bridge between the upload page and dashboard route. The returned batch id is used to navigate to:

```text
/dashboard/{importBatchId}
```

### Reconciliation summary

```ts
export interface ReconciliationSummary {
  importBatchId: number;
  totalReferences: number;
  matchedCount: number;
  warningCount: number;
  discrepancyCount: number;
  matchedValue: number;
  discrepancyValue: number;
  moneyAtRisk: number;
}
```

These values are not calculated on the frontend; they are backend-calculated results displayed by Angular.

### Discrepancy row

```ts
export interface Discrepancy {
  id: number;
  orderReference: string;
  transactionRef: string;
  expectedAmount: number;
  actualAmount: number;
  differenceAmount: number;
  currency: string;
  paymentCurrency: string;
  discrepancyType: string;
  riskAmount: number;
  reason: string;
}
```

This is used in the dashboard table and detail modal.

### AI response

```ts
export interface AiAnalysisResponse {
  importBatchId: number;
  executiveSummary: string;
  keyFindings: string[];
  riskAnalysis: string;
  recommendations: string[];
}
```

---

## 9. Upload flow

The upload screen is the entry point for a new batch.

Flow:

```text
UploadComponent
    -> user selects Orders CSV
    -> user selects Payments CSV
    -> validation checks both files exist
    -> ApiService.upload(ordersFile, paymentsFile)
    -> POST /api/import
    -> backend imports records and creates ImportBatch
    -> backend returns importBatchId
    -> router navigates to /dashboard/{batchId}
```

Important design decisions:

- CSV files are stored as browser File objects
- request is sent as multipart/form-data
- the frontend never creates the batch id itself
- navigation depends on the backend response

---

## 10. Dashboard behavior

The dashboard is the core operational page. It presents the summary and the detailed exception list.

### Initial load

`ngOnInit()` reads the route parameter:

```ts
const id = this.route.snapshot.paramMap.get('batchId');
```

If no `batchId` exists, it redirects to `/upload`.

Then it loads:

1. summary via `getSummary(batchId)`
2. discrepancy details via `getDiscrepancies(batchId)`

### Reconciliation action

The dashboard contains the `Run Reconciliation` action. It triggers:

```ts
this.api.reconcile(this.batchId)
```

The backend re-executes the reconciliation logic and returns updated summary data. The UI then fetches discrepancies again so the table remains consistent with the new batch state.

### Search and filter behavior

The dashboard supports:

- case-insensitive text search
- `selectedType` filter based on discrepancy type
- dynamic type list extracted from actual discrepancy data
- clear filters action

The filtered dataset is computed in memory rather than making a backend request for each keystroke.

### Detail modal

When a user clicks a row’s details action, the component stores the selected discrepancy object in `selectedDiscrepancy` and displays a modal/dialog with full details.

This keeps the table concise while making detailed investigation possible.

### AI analysis

The dashboard can request AI-generated business insights for the same batch. The request is handled via `AiService.analyze(batchId)` and the response is bound to `aiAnalysis`.

UI state:

- `aiLoading`
- `aiError`
- `aiPanelOpen`

The AI layer is treated as explanatory and must never override the deterministic reconciliation result.

---

## 11. Environment configuration

The app reads its API base URL from `src/environments/environment.ts`.

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'
};
```

This is the correct separation of concerns: feature code should not hardcode backend URLs. The frontend should use environment configuration for local and production settings.

For production deployment, the url may become:

- `/api` with a reverse proxy, or
- a deployed backend HTTPS URL if frontend and backend are hosted on different origins.

---

## 12. Security and architectural boundaries

The frontend does not contain database credentials, JWT signing secrets, or AI provider keys. These must stay in the backend.

The browser architecture is:

```text
Angular (front end)
   -> Spring Boot API
   -> business/reconciliation logic
   -> database / AI provider
```

The browser should never directly connect to PostgreSQL or DeepSeek. It should only talk to the backend API.

---

## 13. Why the project is designed this way

The main design decisions are:

- thin frontend, backend-owned logic
- typed API contracts
- service-layer abstraction
- interceptor-based auth propagation
- route-based feature loading
- component-level state over global store
- no duplicated financial logic in JavaScript

This is the correct architecture for a reconciliation UI because the financial logic is authoritative in the backend, while Angular is responsible for display and workflow orchestration.

---

## 14. Component responsibilities summary

### `AppComponent`
Provides the app shell and router outlet.

### `LoginComponent`
Handles login, validation, and navigation to upload.

### `SignupComponent`
Handles account creation and navigation to login.

### `UploadComponent`
Handles file selection, validation, import, and batch navigation.

### `DashboardComponent`
Renders KPI summary, discrepancy data, detail modal, filters, and AI insights.

### `AuthService`
Handles JWT persistence and authentication flow.

### `ApiService`
Centers all HTTP calls to the backend.

### `AuthInterceptor`
Adds bearer token to authenticated requests.

---

## 15. Data flow through the app

### User login

```text
Browser -> LoginComponent -> AuthService -> ApiService -> POST /auth/login -> JWT -> localStorage -> /upload
```

### File upload

```text
Browser -> UploadComponent -> ApiService -> POST /import -> ImportBatchResponse -> /dashboard/{batchId}
```

### Dashboard summary

```text
/dashboard/{batchId} -> DashboardComponent -> ApiService.getSummary -> backend summary -> KPI cards
```

### Discrepancy investigation

```text
DashboardComponent -> ApiService.getDiscrepancies -> discrepancy list -> search/filter/table/modal
```

### Reconciliation

```text
Run Reconciliation -> ApiService.reconcile -> backend engine -> refreshed summary + discrepancies
```

### AI analysis

```text
Analyze with AI -> AiService.analyze -> backend AI endpoint -> explanation -> dashboard insight panel
```

---

## 16. Current implementation notes

This repo is a working frontend implementation for the ReconcileX architecture, but there are some important consistency observations based on the project documentation:

- the token key in `AuthService` is `token`, while some older documentation refers to `reconcilex_token`
- the app currently uses `localStorage` instead of secure cookies
- some earlier snapshots may have used different API field names such as `token` vs `accessToken`
- some documentation snapshots describe alternate import contracts; the current app uses a single `upload(ordersFile, paymentsFile)` service method
- the frontend is correctly keeping all financial calculations in the backend, not in Angular

These are not flaws in the architecture; they are implementation-level details that project documentation often documents as consistency notes during iterative development.

---

## 17. How to run the project

### Install dependencies

```bash
npm install
```

### Run the development server

```bash
npm start
```

This starts Angular dev server at:

```text
http://localhost:4200/
```

### Production build

```bash
ng build --configuration production
```

---

## 18. Testing

The project includes Angular spec files such as:

- `src/app/core/interceptors/auth.interceptor.spec.ts`
- component specs under `src/app/features/...`

They use Jasmine and Karma as part of Angular's default testing stack.

Typical test command:

```bash
npm test
```

---

## 19. Best practices and design goals

This frontend follows several good Angular design practices:

- standalone components
- lazy loading routes
- centralized API access
- centralized auth logic
- clear separation between UI and backend contract
- no business logic in templates
- minimal root app shell
- strong use of TypeScript interfaces for API contracts

---

## 20. Summary

ReconcileX UI is a modern Angular frontend that acts as a thin, secure presentation layer over a Spring Boot reconciliation backend. Its main responsibilities are:

- user onboarding and auth
- file import orchestration
- dashboard rendering
- exception investigation
- reconciliation actions
- AI business insight display

The core idea is simple: the backend owns the truth, and the Angular app owns the experience.

---

## 21. Quick reference: all project folders

```text
src/
├── app/
│   ├── app.component.html
│   ├── app.component.scss
│   ├── app.component.spec.ts
│   ├── app.component.ts
│   ├── app.config.ts
│   ├── app.routes.ts
│   ├── core/
│   │   ├── interceptors/
│   │   │   ├── auth.interceptor.spec.ts
│   │   │   └── auth.interceptor.ts
│   │   ├── models/
│   │   │   └── api.models.ts
│   │   └── services/
│   │       ├── ai.service.ts
│   │       ├── api.service.ts
│   │       └── auth.service.ts
│   └── features/
│       ├── dashboard/
│       │   ├── dashboard.component.html
│       │   ├── dashboard.component.scss
│       │   ├── dashboard.component.spec.ts
│       │   └── dashboard.component.ts
│       ├── login/
│       │   ├── login.component.html
│       │   ├── login.component.scss
│       │   ├── login.component.spec.ts
│       │   └── login.component.ts
│       ├── signup/
│       │   ├── signup.component.html
│       │   ├── signup.component.scss
│       │   ├── signup.component.spec.ts
│       │   └── signup.component.ts
│       └── upload/
│           ├── upload.component.html
│           ├── upload.component.scss
│           ├── upload.component.spec.ts
│           └── upload.component.ts
├── assets/
├── environments/
│   ├── environment.prod.ts
│   └── environment.ts
├── index.html
├── main.ts
└── styles.scss
```

This README reflects the currently implemented frontend architecture and the intended project design described in the ReconcileX documentation.
