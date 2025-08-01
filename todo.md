## bug
- [x] ~~General: There are pages where the text color is too dark or the contrast is incorrect in dark mode~~ - FIXED in PR #16
  - ~~There are still exists this issue. like card, modal, calender, moment's post area, and etc, especially in light mode.~~
  - ~~I suspects that we use something like dark: prefix in our css. Since we can change the color theme agains the os preferer, we need to use other solutions.~~
  - Fixed by implementing theme-aware CSS variables and utility classes throughout the application
- [x] ~~Moments: I can't see any notes even I register them.~~ - FIXED in PR #15
- [x] ~~Side bar: In mobile size window, the humberger menu button does'nt work.~~ - FIXED in PR #15


## not implemented feature
- [x] ~~Goals: Creating Goals~~ - IMPLEMENTED in PR #17
  - Added GoalForm component with full create/edit functionality
  - Form includes goal type, metric type, target values, and date selection
  - Auto-calculates end dates based on goal type
  - Integrated with existing Goals page
  - Fixed react-hook-form conflict issue from PR review


## enhancement
- [ ] Ensure the unit test coverage is over 70%.
- [ ] Confirm that the e2e tests cover valid cases, and add cases if any are missing.
- [ ] Check for any instances where the e2e test timeout duration is unnecessarily long, and shorten them if found. In particular, all user operations should be completed within 5 seconds, so any waits longer than 10 seconds are unnecessary. A common issue is waiting indefinitely due to incorrect selectors while trying to display a screen. Address such situations by following best practices. 
- [ ] General: Overall, the performance is sluggish. There are many areas where I would like it to operate seamlessly.
  - Consider code splitting for large components
  - Optimize bundle size

## known issues
- E2E tests still have some stability issues that need deeper investigation
- Performance optimizations needed for smoother user experience
