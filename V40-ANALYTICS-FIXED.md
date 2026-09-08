# V40 Analytics & Visitor Fix

## Fixed
- Project analytics events now record correctly. The previous event endpoint referenced a missing `getAnalyticsVisitorId()` function, causing project/gallery events to fail silently.
- Gallery analytics events now record correctly with the same persistent visitor identity used by lifetime visitor counting.
- Added the missing authenticated `/admin/visitor-stats` endpoint, so the Admin Visitors page and dashboard can load the persistent visitor count.
- Kept lifetime visitor registration separate from project/gallery click events: refreshing or opening pages does not inflate lifetime visitors, while project/gallery interactions are available for engagement analytics.

## Test
1. Run `npm install` then `npm start`.
2. Open the public site and open a project.
3. Open Gallery and click an image.
4. Return to Admin -> Analytics and refresh.
5. Project and Gallery rankings should now show the recorded views.
6. Open Admin -> Visitors. The Total visitors value should match the persistent visitor counter.
