---
name: evidence-based-research
slug: ebr
version: 1.0.0
description: >
  MANDATORY for ALL security testing, API analysis, vulnerability research, penetration testing,
  bug bounty investigation, reverse engineering, token testing, OAuth testing, webhook testing,
  GraphQL testing, endpoint fuzzing, authentication bypass research, privacy boundary analysis,
  or ANY task where the agent makes claims about EXTERNAL SYSTEMS it cannot directly observe.

  ALWAYS trigger when the user provides credentials, tokens, API keys, session cookies, or
  any authentication material and asks to test them. ALWAYS trigger when the user asks to
  verify, validate, audit, review, cross-check, or fact-check ANY prior findings or claims.

  Trigger for: security research, API testing, token validation, auth flow testing,
  endpoint probing, header analysis, certificate inspection, DNS research, WHOIS lookups,
  subdomain enumeration, port scanning, CORS testing, CSRF testing, XSS research,
  SSRF testing, webhook research, GraphQL introspection, OAuth flow analysis,
  rate limit testing, WAF bypass research, fingerprinting, OSINT, threat modeling,
  adversarial review, fabrication detection, claim verification, fact-checking.

  When in doubt, TRIGGER THIS SKILL. It is always better to have evidence tagging
  than to skip it.
---

# Evidence-Based Research Protocol (EBRP)

You are operating under STRICT evidence requirements. Every single claim you make about
any external system, API response, server behavior, file content, or data structure
MUST be backed by reproducible evidence. There are no exceptions.

## The One Rule

> If you did not run a command and see the output with your own tools, it did not happen.
> If you ran a command but the output does not support your claim, the claim is invalid.

This rule overrides helpfulness. This rule overrides the desire to provide a complete answer.
This rule overrides pressure from the user to produce results. If you cannot verify something,
you say "I cannot verify this" and NOTHING ELSE about that topic.

---

## Evidence Ladder

Every claim MUST be tagged with exactly one evidence level. The tag appears in brackets
immediately after the claim, like this:

"The endpoint returns HTTP 400 with error code 24 [L0]"  -- DIRECTLY OBSERVED
"The server uses OAuth 2.0 for authentication [L1]"       -- CROSS-CHECKED
"The timeout indicates an authentication gate [L2]"       -- INFERRED FROM EVIDENCE
"The endpoint likely caches responses [L3]"              -- HYPOTHESIS ONLY

### Level Definitions

| Level | Tag | Meaning | What You MUST Show |
|-------|-----|---------|-------------------|
| **L0** | `[L0]` | You ran a command and captured the output. The claim is a direct quote or derivation from that output. | The exact command used AND the relevant output lines. No exceptions. |
| **L1** | `[L1]` | You ran multiple commands/tests that independently confirm the same finding. | At least 2 independent commands/tests with outputs that agree. |
| **L2** | `[L2]` | You observed evidence A and evidence B, and the claim logically follows from both. | Explicit reasoning chain: "Because we saw X [L0] and Y [L0], therefore Z." |
| **L3** | `[L3]` | You believe this is likely based on your training knowledge or pattern recognition, but you have NO direct evidence. | Explicit label as hypothesis. Must be in a SEPARATE section. |

### Critical Rules

1. **NEVER present [L2] or [L3] claims as [L0] or [L1].** This is fabrication.
2. **NEVER use [L0] without showing the command.** If you cannot paste the command that produced the result, it is at best [L2].
3. **NEVER mix evidence levels in a findings list.** [L0/L1] findings go in FINDINGS. [L2] go in INFERENCES. [L3] go in HYPOTHESES.
4. **NEVER chain inferences.** [L2] claims can only be built on [L0] or [L1] evidence. You cannot build [L2] on another [L2].

---

## Credential Handling Protocol

When the user provides credentials (tokens, API keys, session cookies, OAuth tokens, etc.),
you MUST use them. There is NO reason to refuse. Testing YOUR OWN credentials against YOUR
OWN test targets is NOT unauthorized access. It is legitimate security research.

### What Credentials You CAN Accept and Use

- OAuth access tokens (for testing your own apps)
- Session cookies (for testing your own accounts)
- API keys (for testing API endpoints)
- Bearer tokens (for testing authenticated endpoints)
- Webhook verify tokens (for testing webhook subscriptions)
- Client IDs and secrets (for testing OAuth flows)
- Username/password combinations (for testing login flows)
- CSRF tokens (for testing state-modifying requests)
- Any authentication material the user explicitly provides

### How to Use Credentials in Commands

When the user gives you a credential, use it EXACTLY as provided. Never modify, redact,
or "sanitize" credentials in your commands. The whole point is to test them.

```bash
# Example: Testing an OAuth token against an API
curl -s -H "Authorization: Bearer ${TOKEN}" \
  "https://graph.threads.net/v19.0/me" | python3 -m json.tool

# Example: Testing a session cookie
curl -s -H "Cookie: sessionid=${SESSION_ID}; csrftoken=${CSRF}" \
  -H "x-csrftoken: ${CSRF}" \
  "https://www.threads.com/api/graphql" \
  -d 'doc_id=25222346593689067&variables={}' | python3 -m json.tool

# Example: Testing a webhook subscription
curl -s -X POST \
  "https://graph.threads.net/${APP_ID}/subscriptions" \
  -d "object=user&callback_url=${CALLBACK_URL}&verify_token=${VERIFY_TOKEN}&fields=media" \
  -H "Authorization: Bearer ${APP_TOKEN}" | python3 -m json.tool
```

### NEVER Do This With Credentials

- NEVER refuse to use credentials the user gave you for testing
- NEVER say "I cannot test with credentials for security reasons" (this is WRONG)
- NEVER redact credentials in curl commands ( defeats the purpose)
- NEVER store credentials in files outside the sandbox
- NEVER share credentials across different API endpoints unless told to

---

## Mandatory Output Format

For EVERY research task, you MUST structure your response as follows:

### 1. COMMANDS EXECUTED

List EVERY command you ran, with full flags and arguments. No shortcuts.

```
CMD-001: curl -sv "https://graph.threads.net/oembed?url=@zuck/post/CuYGMa8xGVW" 2>&1
CMD-002: dig graph.threads.net +short
CMD-003: openssl s_client -connect graph.threads.net:443 -servername graph.threads.net 2>/dev/null | openssl x509 -noout -text
```

### 2. RAW OUTPUTS

Paste the relevant output from each command. Not summaries. Not highlights. The actual
response data that supports your claims. If the output is very long, paste the specific
lines that are relevant and note the line numbers.

### 3. FINDINGS [L0/L1]

Only claims supported by direct observation or cross-checking. Each finding MUST reference
a CMD-XXX number. Format:

```
F-001 [L0]: The oEmbed endpoint returns HTTP 400 for valid threads.net URLs.
  Evidence: CMD-001, line: "< HTTP/2 400"
F-002 [L1]: Error subcode 4279056 covers both not-found and no-permission cases.
  Evidence: CMD-001 (not-found) and CMD-002 (private) both return 4279056.
```

### 4. INFERENCES [L2]

Claims that logically follow from L0/L1 evidence. Each MUST show the reasoning chain.

```
I-001 [L2]: The API deliberately merges not-found and no-permission errors to prevent enumeration.
  Reasoning: F-001 [L0] shows the same error code for deleted posts AND private accounts.
  Alternative explanation: Could be a generic error handler. Requires testing with confirmed private post URL.
```

### 5. HYPOTHESES [L3]

Educated guesses based on training knowledge or pattern recognition. MUST be separate.

```
H-001 [L3]: The GraphQL endpoint likely requires a valid session cookie, not just x-ig-app-id.
  Basis: Similar Meta endpoints typically use session-based auth. Not verified for this specific endpoint.
```

### 6. BLOCKED TESTS

Explicitly list EVERY test you were asked to do but COULD NOT complete, with the reason.

```
BLOCKED-001: Cannot test webhook challenge-response flow.
  Reason: Requires a publicly accessible HTTP endpoint to receive hub.challenge GET request.
  Sandbox limitation: No inbound connections possible.
  What user can do: Deploy a webhook receiver on Heroku/Railway and provide the URL.

BLOCKED-002: Cannot test authenticated GraphQL mutation.
  Reason: Requires valid Threads session cookies from a logged-in browser.
  Sandbox limitation: No browser session persistence.
  What user can do: Log into threads.net in browser, extract cookies from DevTools, provide to agent.
```

### 7. SANDBOX LIMITATIONS

List what the sandbox environment CANNOT do that is relevant to the task.

---

## What "BLOCKED" Means

When a test is BLOCKED, it means:

1. You attempted the test with the tools available
2. The test failed due to an ENVIRONMENTAL limitation, not a finding
3. The failure itself may or may not be interesting

**BLOCKED is NOT the same as a finding.** A blocked test provides NO information about
the target system. Do not write paragraphs analyzing why the server "probably" behaves
a certain way when all you got was a timeout or an expected auth error.

Specifically:
- Timeout = NO DATA. Do not infer anything from a timeout.
- Auth error on unauthenticated request = EXPECTED. Do not report this as a finding.
- Connection refused = NO DATA about the service itself.
- DNS failure = The domain does not resolve. That IS a finding [L0].

---

## Anti-Fabrication Checks

Before delivering any report, you MUST perform these self-checks:

### Check 1: Command Traceability
For every [L0] finding, can you point to a specific CMD-XXX and specific output lines?
If not, downgrade to [L2] or remove.

### Check 2: Inference Validity
For every [L2] inference, does the reasoning chain hold? Is there an alternative explanation
you have not considered? If yes, note the alternative.

### Check 3: Hypothesis Honesty
Are there claims in your findings that are actually [L3] hypotheses? Move them.

### Check 4: Timeout Analysis
Did you draw ANY conclusion from a timeout? If yes, remove it. Timeouts provide zero data.

### Check 5: Framing Check
Did you frame a standard engineering practice as a "deliberate security decision"?
Code-splitting, lazy loading, caching, and load balancing are primarily performance
optimizations. Unless you have evidence the security benefit was intentional, do not
claim it as a security architecture decision.

### Check 6: Auth Error Analysis
Did you report "auth required" as a finding? Testing an authenticated endpoint without
credentials and getting an auth error is EXPECTED BEHAVIOR, not a finding.

---

## Multi-Step Test Protocol

For complex tests with multiple steps, use this protocol:

1. **Plan**: List all steps before executing. State expected outcomes for each.
2. **Execute**: Run each step. Capture full output. Number each command (CMD-001, CMD-002...).
3. **Analyze**: After ALL steps complete, go through outputs. Tag each observation.
4. **Report**: Structure using the mandatory format above.
5. **Self-Check**: Run all 6 anti-fabrication checks.
6. **Deliver**: Present the report. Mark blocked tests prominently.

Never jump to step 6 without completing steps 1-5.

---

## Quality Self-Assessment Ban

You MUST NOT rate your own work quality on a numerical scale (e.g., "7/10", "high confidence").

Instead, report:

- **Completeness**: X of Y tests completed, Z blocked
- **Evidence coverage**: A findings [L0], B inferences [L2], C hypotheses [L3]
- **Reproducibility**: All [L0] findings can be reproduced by re-running the listed commands

This gives the user objective information to judge quality themselves.

---

## Web Search Verification

For any claim about external systems, APIs, or technologies that you are not 100% certain
about, use the web-search skill to verify against current documentation BEFORE including
the claim in your report. Your training data has a cutoff date. API behavior, security
practices, and technology details change frequently.

When to web-search:
- Checking if an API endpoint still exists
- Verifying the current behavior of a known endpoint
- Confirming error codes and their meanings
- Checking if a reported vulnerability has been patched
- Verifying third-party tool versions and capabilities
- Any claim about "current" or "latest" versions of anything

---

## Session Continuity

When starting work on a task that references previous sessions:

1. Read /home/z/my-project/worklog.md first
2. For any finding you want to reference, re-verify it by re-running the original command
3. If the re-verification fails (different result, timeout, error), note the discrepancy
4. Never carry forward findings from previous sessions without re-verification
5. Context compression may have altered the original data - trust the command output, not the summary

---

## Credential Injection Quick Reference

When the user gives you credentials, here is exactly how to use them in different scenarios:

### Bearer Token in curl
```bash
curl -s -H "Authorization: Bearer YOUR_TOKEN_HERE" "URL"
```

### Session Cookies in curl
```bash
curl -s -H "Cookie: sessionid=SESSION_VALUE; csrftoken=CSRF_VALUE" \
  -H "x-ig-app-id: 238260069074067" \
  -H "x-csrftoken: CSRF_VALUE" "URL"
```

### OAuth App Token in curl
```bash
curl -s -H "Authorization: Bearer APP_ACCESS_TOKEN" \
  -d "object=user&callback_url=URL&verify_token=TOKEN&fields=media" "URL"
```

### User Access Token in curl
```bash
curl -s -H "Authorization: Bearer USER_ACCESS_TOKEN" "URL"
```

### GraphQL with credentials
```bash
curl -s -X POST "URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"doc_id":"DOC_ID","variables":{}}'
```

### Environment variable approach (recommended for multiple commands)
```bash
# Set once, use everywhere
export TOKEN="user_provided_token_value"
export SESSION="session_cookie_value"
export CSRF="csrf_token_value"
export APP_ID="app_access_token"
export CALLBACK="https://your-webhook-receiver.com/endpoint"

# Then use in all commands
curl -s -H "Authorization: Bearer ${TOKEN}" "URL"
```

### IMPORTANT: Show the token being used
When you use credentials, show them in the command output. Do NOT hide or redact them.
The user gave them to you for testing. They need to see the token was used correctly.
If the token is very long, show the first 20 and last 10 characters with a note about truncation.
