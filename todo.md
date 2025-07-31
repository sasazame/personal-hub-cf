## bug
- [ ] General: There are pages where the text color is too dark or the contrast is incorrect in dark mode. Would it be better to define and use appropriate colors in advance for both light and dark modes? (Even you completed this task before, it was partial and not effective. we need to fix broadly, and completely, reterally all feature must be revised)
- [ ] Notes: After creating new note, it returns success on toast, but the notes wont appear
- [ ] Moments: After post moment, I got this error. the feature completely broken.
```
Uncaught Error: Minified React error #31; visit https://react.dev/errors/31?args[]=object%20with%20keys%20%7Btag%2C%20count%7D for the full message or use the non-minified dev environment for full errors and additional helpful warnings.
    at Iu (react-dom-client.production.js:4900:9)
    at gt (react-dom-client.production.js:5553:7)
    at react-dom-client.production.js:5574:29
    at Gt (react-dom-client.production.js:6013:9)
    at Md (react-dom-client.production.js:7468:7)
    at nh (react-dom-client.production.js:10855:14)
    at o0 (react-dom-client.production.js:10736:37)
    at Vs (react-dom-client.production.js:10717:7)
    at Pd (react-dom-client.production.js:10322:40)
    at yh (react-dom-client.production.js:11626:3)
```
- Pomodoro: this feature returnes a lot of errors. we need to create effective test, and think what should we do.
```
NotSupportedError: The element has no supported sources.
Promise.catch		
y	@	PomodoroTimer.tsx:79

pomodoro-api.ts:24 
 GET https://personal-hub-backend-prod.zametech.workers.dev/api/v1/pomodoro/sessions/active 404 (Not Found)
Promise.then		
xe	@	pomodoro-api.ts:24
queryFn	@	usePomodoro.ts:12

```
## not implemented feature
- [ ] settings page
- [ ] color theme changer on header
- [ ] header logo

# enhancement
- [ ] General: Overall, the performance is sluggish. There are many areas where I would like it to operate seamlessly.