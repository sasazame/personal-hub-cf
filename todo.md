## bug
- [ ] General: There are pages where the text color is too dark or the contrast is incorrect in dark mode ~~- FIXED in PR #8~~
  - There are still exists this issue. like card, modal, calender, moment's post area, and etc, especially in light mode.
  - I suspects that we use something like dark: prefix in our css. Since we can change the color theme agains the os preferer, we need to use other solutions.
- [ ] Moments: I can't see any notes even I register them.
- [ ] Side bar: In mobile size window, the humberger menu button does'nt work.


## not implemented feature
- [ ] Goals: Creating Goals


## enhancement
- [ ] General: Overall, the performance is sluggish. There are many areas where I would like it to operate seamlessly.
  - Consider code splitting for large components
  - Optimize bundle size

## known issues
- E2E tests still have some stability issues that need deeper investigation
- Performance optimizations needed for smoother user experience
