## bug
- [x] ~~General: There are pages where the text color is too dark or the contrast is incorrect in dark mode~~ - FIXED in current PR
  - ~~There are still exists this issue. like card, modal, calender, moment's post area, and etc, especially in light mode.~~
  - ~~I suspects that we use something like dark: prefix in our css. Since we can change the color theme agains the os preferer, we need to use other solutions.~~
  - Fixed by implementing theme-aware CSS variables and utility classes throughout the application
- [x] ~~Moments: I can't see any notes even I register them.~~ - FIXED in PR #15
- [x] ~~Side bar: In mobile size window, the humberger menu button does'nt work.~~ - FIXED in PR #15


## not implemented feature
- [ ] Goals: Creating Goals


## enhancement
- [ ] General: Overall, the performance is sluggish. There are many areas where I would like it to operate seamlessly.
  - Consider code splitting for large components
  - Optimize bundle size

## known issues
- E2E tests still have some stability issues that need deeper investigation
- Performance optimizations needed for smoother user experience
