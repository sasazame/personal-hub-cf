## security - high priority
- [x] Implement Rate Limiting (Completed in PR #19)
  - ✅ Add rate-limiting middleware for auth endpoints (login, register, password reset)
  - ✅ Use Cloudflare's rate limiting or implement custom solution
  - ✅ 5 requests per 15 minutes per IP for auth endpoints
- [x] Add Security Headers (Completed in PR #19)
  - ✅ X-Content-Type-Options: nosniff
  - ✅ X-Frame-Options: DENY
  - ✅ X-XSS-Protection: 1; mode=block
  - ✅ Strict-Transport-Security: max-age=31536000; includeSubDomains
  - ✅ Content-Security-Policy headers
- [x] Restrict CORS Origins (Completed in PR #19)
  - ✅ Replace wildcard origin with allowed domain list
  - ✅ Configure separate origins for development and production

## security - medium priority
- [ ] Implement Account Lockout
  - Track failed login attempts in database
  - Lock account after 5 failed attempts
  - Require email verification or time-based unlock
- [ ] Add CSRF Protection
  - Implement CSRF tokens for state-changing operations
  - Use SameSite cookie attribute
  - Add double-submit cookie pattern
- [ ] Enhance Session Management
  - Switch from localStorage to httpOnly secure cookies
  - Implement inactivity timeout (30 minutes)
  - Add device/session tracking
  - Limit concurrent sessions per user

## security - low priority
- [ ] Add Multi-Factor Authentication (2FA)
  - TOTP-based authentication
  - Backup recovery codes
  - Optional per-user setting
- [ ] Implement Security Event Logging
  - Use existing securityEvents table
  - Log authentication attempts
  - Log password changes and resets
  - Log suspicious activities
- [ ] Add Field-Level Encryption
  - Encrypt sensitive user data at rest
  - Use Cloudflare's Web Crypto API
  - Implement key rotation strategy

## known issues
- E2E tests still have some stability issues that need deeper investigation
- Performance optimizations needed for smoother user experience

## bug
- Pomodoro session failed to end.
```
ET https://personal-hub-backend-prod.zametech.workers.dev/api/v1/pomodoro/sessions/active 404 (Not Found)
(anonymous) @ xhr.js:195
xhr @ xhr.js:15
Mm @ dispatchRequest.js:49
Promise.then
_request @ Axios.js:163
request @ Axios.js:40
sl.<computed> @ Axios.js:213
(anonymous) @ bind.js:5
xe @ pomodoro-api.ts:24
queryFn @ usePomodoro.ts:12
o @ query.js:212
U @ retryer.js:80
start @ retryer.js:121
fetch @ query.js:295
#c @ queryObserver.js:173
(anonymous) @ queryObserver.js:210
setInterval
#y @ queryObserver.js:208
#m @ queryObserver.js:216
onQueryUpdate @ queryObserver.js:419
(anonymous) @ query.js:368
(anonymous) @ query.js:367
batch @ notifyManager.js:40
#u @ query.js:366
setData @ query.js:53
onSuccess @ query.js:267
A @ retryer.js:45
Promise.then
U @ retryer.js:84
start @ retryer.js:121
fetch @ query.js:295
#c @ queryObserver.js:173
(anonymous) @ queryObserver.js:210
setInterval
#y @ queryObserver.js:208
#m @ queryObserver.js:216
onQueryUpdate @ queryObserver.js:419
(anonymous) @ query.js:368
(anonymous) @ query.js:367
batch @ notifyManager.js:40
#u @ query.js:366
setData @ query.js:53
onSuccess @ query.js:267
A @ retryer.js:45
Promise.then
U @ retryer.js:84
start @ retryer.js:121
fetch @ query.js:295
#c @ queryObserver.js:173
(anonymous) @ queryObserver.js:210
setInterval
#y @ queryObserver.js:208
#m @ queryObserver.js:216
onQueryUpdate @ queryObserver.js:419
(anonymous) @ query.js:368
(anonymous) @ query.js:367
batch @ notifyManager.js:40
#u @ query.js:366
setData @ query.js:53
onSuccess @ query.js:267
A @ retryer.js:45
Promise.then
U @ retryer.js:84
start @ retryer.js:121
fetch @ query.js:295
#c @ queryObserver.js:173
(anonymous) @ queryObserver.js:210
setInterval
#y @ queryObserver.js:208
#m @ queryObserver.js:216
onQueryUpdate @ queryObserver.js:419
(anonymous) @ query.js:368
(anonymous) @ query.js:367
batch @ notifyManager.js:40
#u @ query.js:366
setData @ query.js:53
onSuccess @ query.js:267
A @ retryer.js:45
Promise.then
U @ retryer.js:84
start @ retryer.js:121
fetch @ query.js:295
#c @ queryObserver.js:173
(anonymous) @ queryObserver.js:210
setInterval
#y @ queryObserver.js:208
#m @ queryObserver.js:216
onQueryUpdate @ queryObserver.js:419
(anonymous) @ query.js:368
(anonymous) @ query.js:367
batch @ notifyManager.js:40
#u @ query.js:366
setData @ query.js:53
onSuccess @ query.js:267
A @ retryer.js:45
Promise.then
U @ retryer.js:84
start @ retryer.js:121
fetch @ query.js:295
#c @ queryObserver.js:173
(anonymous) @ queryObserver.js:210
setInterval
#y @ queryObserver.js:208
#m @ queryObserver.js:216
onQueryUpdate @ queryObserver.js:419
(anonymous) @ query.js:368
(anonymous) @ query.js:367
batch @ notifyManager.js:40
#u @ query.js:366
setData @ query.js:53
onSuccess @ query.js:267
A @ retryer.js:45
Promise.then
U @ retryer.js:84
start @ retryer.js:121
fetch @ query.js:295
#c @ queryObserver.js:173
(anonymous) @ queryObserver.js:210
setInterval
#y @ queryObserver.js:208
#m @ queryObserver.js:216
onQueryUpdate @ queryObserver.js:419
(anonymous) @ query.js:368
(anonymous) @ query.js:367
batch @ notifyManager.js:40
#u @ query.js:366
setData @ query.js:53
onSuccess @ query.js:267
A @ retryer.js:45
Promise.then
U @ retryer.js:84
start @ retryer.js:121
fetch @ query.js:295
#c @ queryObserver.js:173
(anonymous) @ queryObserver.js:210
setInterval
#y @ queryObserver.js:208
#m @ queryObserver.js:216
onQueryUpdate @ queryObserver.js:419
(anonymous) @ query.js:368
(anonymous) @ query.js:367
batch @ notifyManager.js:40
#u @ query.js:366
setData @ query.js:53
onSuccess @ query.js:267
A @ retryer.js:45
Promise.then
U @ retryer.js:84
start @ retryer.js:121
fetch @ query.js:295
#c @ queryObserver.js:173
(anonymous) @ queryObserver.js:210
setInterval
#y @ queryObserver.js:208
#m @ queryObserver.js:216
onQueryUpdate @ queryObserver.js:419
(anonymous) @ query.js:368
(anonymous) @ query.js:367
batch @ notifyManager.js:40
#u @ query.js:366
setData @ query.js:53
onSuccess @ query.js:267
A @ retryer.js:45
Promise.then
U @ retryer.js:84
start @ retryer.js:121
fetch @ query.js:295
#c @ queryObserver.js:173
(anonymous) @ queryObserver.js:210
setInterval
#y @ queryObserver.js:208
#m @ queryObserver.js:216
onQueryUpdate @ queryObserver.js:419
(anonymous) @ query.js:368
(anonymous) @ query.js:367
batch @ notifyManager.js:40
#u @ query.js:366
setData @ query.js:53
onSuccess @ query.js:267
A @ retryer.js:45
Promise.then
U @ retryer.js:84
start @ retryer.js:121
fetch @ query.js:295
#c @ queryObserver.js:173
(anonymous) @ queryObserver.js:210
setInterval
#y @ queryObserver.js:208
#m @ queryObserver.js:216
onQueryUpdate @ queryObserver.js:419
(anonymous) @ query.js:368
(anonymous) @ query.js:367
batch @ notifyManager.js:40
#u @ query.js:366
setData @ query.js:53
onSuccess @ query.js:267
A @ retryer.js:45
Promise.then
U @ retryer.js:84
start @ retryer.js:121
fetch @ query.js:295
#c @ queryObserver.js:173
(anonymous) @ queryObserver.js:210
setInterval
#y @ queryObserver.js:208
#m @ queryObserver.js:216
onQueryUpdate @ queryObserver.js:419
(anonymous) @ query.js:368
(anonymous) @ query.js:367
batch @ notifyManager.js:40
#u @ query.js:366
setData @ query.js:53
onSuccess @ query.js:267
A @ retryer.js:45
Promise.then
U @ retryer.js:84
start @ retryer.js:121
fetch @ query.js:295
#c @ queryObserver.js:173
(anonymous) @ queryObserver.js:210
setInterval
#y @ queryObserver.js:208
#m @ queryObserver.js:216
onQueryUpdate @ queryObserver.js:419
(anonymous) @ query.js:368
(anonymous) @ query.js:367
batch @ notifyManager.js:40
#u @ query.js:366
setData @ query.js:53
onSuccess @ query.js:267
A @ retryer.js:45
Promise.then
U @ retryer.js:84
start @ retryer.js:121
fetch @ query.js:295
#c @ queryObserver.js:173
(anonymous) @ queryObserver.js:210
setInterval
#y @ queryObserver.js:208
#m @ queryObserver.js:216
onQueryUpdate @ queryObserver.js:419
(anonymous) @ query.js:368
(anonymous) @ query.js:367
batch @ notifyManager.js:40
#u @ query.js:366
setData @ query.js:53
onSuccess @ query.js:267
A @ retryer.js:45
Promise.then
U @ retryer.js:84
start @ retryer.js:121
fetch @ query.js:295
#c @ queryObserver.js:173
(anonymous) @ queryObserver.js:210
setInterval
#y @ queryObserver.js:208
#m @ queryObserver.js:216
onQueryUpdate @ queryObserver.js:419
(anonymous) @ query.js:368
(anonymous) @ query.js:367
batch @ notifyManager.js:40
#u @ query.js:366
setData @ query.js:53
onSuccess @ query.js:267
A @ retryer.js:45
Promise.then
U @ retryer.js:84
start @ retryer.js:121
fetch @ query.js:295
#c @ queryObserver.js:173
(anonymous) @ queryObserver.js:210
setInterval
#y @ queryObserver.js:208
#m @ queryObserver.js:216
onQueryUpdate @ queryObserver.js:419
(anonymous) @ query.js:368
(anonymous) @ query.js:367
batch @ notifyManager.js:40
#u @ query.js:366
setData @ query.js:53
onSuccess @ query.js:267
A @ retryer.js:45Understand this error
pomodoro-api.ts:36  POST https://personal-hub-backend-prod.zametech.workers.dev/api/v1/pomodoro/sessions 400 (Bad Request)
```
- pomodoro timer' style in light mode is awful. the back ground color and some texts are taken from dark theme.