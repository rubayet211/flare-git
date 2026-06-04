# Security Review

This document provides a thorough audit of security vulnerabilities, authorization flaws, access token handling risks, and data exposure vulnerabilities in the **FlareGit** codebase.

---

## 1. Vulnerability Catalog

### Critical Severity

#### SEC-01: Missing Repository Ownership Authorization in Push API
* **Location**: [/api/github/repositories/[username]/[repo]/update-readme/route.js](file:///j:/Saas/flaregit/src/app/api/github/repositories/%5Busername%5D/%5Brepo%5D/update-readme/route.js#L15-L35)
* **Vulnerability**: The endpoint retrieves the logged-in session and access token, extracts `username` and `repo` parameters from the URL path, and pushes the README content to GitHub. However, it **never verifies** that the requested `username` matches `session.user.username`.
* **Impact**: If a user is logged in, they can call the API route to write to any repository of another user, provided their access token has collaborator/organizational permissions on that repo, without passing the proper ownership check on the platform. It also exposes the API to parameter mismatch issues.
* **Remediation**: Check that the `username` matches the authenticated user's GitHub username before committing the update:
  ```javascript
  if (session.user.username !== username) {
    return new NextResponse(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }
  ```

---

### High Severity

#### SEC-02: Public Profile Hijacking via Username/Slug Collisions
* **Location**: [/api/profiles/[username]/route.js](file:///j:/Saas/flaregit/src/app/api/profiles/%5Busername%5D/route.js#L8-L21)
* **Vulnerability**: The public profile fetcher queries MongoDB for a profile matching either `githubUsername` or `customUrl`. There is no check during profile update to prevent a user from setting their `customUrl` to match another user's `githubUsername` or `customUrl`.
* **Impact**: If User A sets their `customUrl` to match User B's `githubUsername` (e.g. `john`), when visitors request `flaregit.com/user/john`, the `findFirst` query will match both documents and return whichever is indexed first. This allows malicious users to hijack traffic and showcase wrong profiles.
* **Remediation**: 
  1. Add a unique index to `customUrl` in the database (already present: `customUrl String? @unique`).
  2. Implement an validation check in `/api/profile/[userId]` to reject custom URLs that match any user's `githubUsername` or another profile's `customUrl`:
     ```javascript
     const existingUsername = await prisma.profile.findFirst({
       where: {
         OR: [
           { githubUsername: data.customUrl },
           { customUrl: data.customUrl }
         ],
         NOT: { userId }
       }
     });
     if (existingUsername) {
       return new NextResponse(JSON.stringify({ error: "URL already taken" }), { status: 400 });
     }
     ```

#### SEC-03: Exposure of Write-Scope GitHub Access Tokens to Browser Client
* **Location**: [auth.js Line 25-46](file:///j:/Saas/flaregit/src/lib/auth.js#L25-L46)
* **Vulnerability**: The NextAuth configuration serializes the user's raw GitHub OAuth access token (which contains write `repo` scopes) into the session JWT and returns it in the session object:
  ```javascript
  async session({ session, token }) {
    session.accessToken = token.accessToken;
    return session;
  }
  ```
* **Impact**: The write-access token is sent to the client browser and stored in client-side memory. Any XSS vulnerability or malicious npm package running on the client can steal the user's GitHub access token, compromising their entire GitHub account, repository code, and private work.
* **Remediation**: Do not serialize the access token into the session. Instead, retrieve the access token server-side from the database (`Account` model) whenever an API route needs to query GitHub:
  ```javascript
  const account = await prisma.account.findFirst({
    where: { userId: session.user.id, provider: "github" }
  });
  const accessToken = account.access_token;
  ```

---

### Medium Severity

#### SEC-04: Fragile and Unsafe Markdown/HTML Parsing (XSS Risk)
* **Location**: [readme-generator.jsx Line 245-248](file:///j:/Saas/flaregit/src/components/readme-generator.jsx#L245-L248)
* **Vulnerability**: The unused `ReadmeGenerator` component uses a custom regex replacement script to parse markdown headings/lists to HTML and renders them using `dangerouslySetInnerHTML`.
* **Impact**: Using raw regex to parse markdown is highly fragile and bypasses HTML sanitization. If the AI model or a malicious contributor injects script tags (`<script>alert('XSS')</script>`), they will execute in the user's browser, leading to XSS.
* **Remediation**: Remove the custom regex parser and `dangerouslySetInnerHTML`. Use standard, secure libraries like `ReactMarkdown` (which is used in `repository-readme-generator.jsx`) and sanitize HTML using `dompurify` if raw HTML rendering is required.

#### SEC-05: Lack of Custom URL Input Validation
* **Location**: [profile/[userId]/route.js](file:///j:/Saas/flaregit/src/app/api/profile/%5BuserId%5D/route.js#L77-L89)
* **Vulnerability**: The update profile endpoint saves `customUrl` directly into the database without character format checks or length restrictions.
* **Impact**: Users can submit custom URLs with slashes, spaces, or script tags. Slashes or spaces will break portfolio URL routing, and script tags could execute script actions on profile loads.
* **Remediation**: Enforce strict alphanumeric format validation (slug style) on the server side:
  ```javascript
  const slugRegex = /^[a-zA-Z0-9-_]+$/;
  if (data.customUrl && !slugRegex.test(data.customUrl)) {
    return new NextResponse(JSON.stringify({ error: "Invalid URL slug format" }), { status: 400 });
  }
  ```

---

### Low Severity

#### SEC-06: Leakage of System Internals in Error Handlers
* **Location**: [generate-repo-readme/route.js Line 53](file:///j:/Saas/flaregit/src/app/api/ai/generate-repo-readme/route.js#L53)
* **Vulnerability**: API catch blocks return `error.message` directly in the JSON response details.
* **Impact**: Exposes stack trace details, file paths, database query issues, or network endpoints to the end-user, facilitating system footprinting.
* **Remediation**: Log error details securely on the server console and return a generic error message (e.g. "Failed to process request") to the client.
