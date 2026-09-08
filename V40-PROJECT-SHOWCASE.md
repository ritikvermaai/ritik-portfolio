# V40 Project Showcase Upgrade

This V40 upgrade keeps the existing MongoDB collections and APIs compatible while adding a professional project case-study experience.

## Public experience
- `/projects` now presents projects as case-study cards.
- `/projects/:id` is a dedicated project showcase page.
- Each showcase can include overview, role, challenge, solution, results, screenshots, live demo, GitHub, and an optional walkthrough video.
- Existing projects without the new fields continue to work using fallback copy.
- Project opens are still recorded through the existing analytics event endpoint.

## Admin
The existing Project editor now includes optional case-study fields:
- Overview
- My role
- Challenge
- Solution
- Results / impact
- Walkthrough video URL

No existing project data needs to be migrated. New fields are optional and default to empty strings.

## Deployment
Use the same MongoDB, Cloudinary, Razorpay, session, and Render environment variables as V40.
