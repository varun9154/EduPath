# EduPath Course/LMS Module Patch

This patch is designed for the supplied working EduPath project.

Files:
- src/data/courseCurriculum.json
- src/app/courses/[courseId]/page.tsx

Scope:
- Course curriculum expansion for all 61 entries in src/data/courses.json
- Foundation → Beginner → Intermediate → Advanced → Professional → Capstone
- 24 domain-specific topics per course
- 3 lesson/practical layers per topic
- 10-question quiz per topic
- Module assessments
- Final assessment metadata
- Student-specific browser progress keys (studentId + courseId)
- Real quiz scoring instead of hard-coded 100

Validation:
- JSON parsed successfully
- 61/61 course IDs covered
- 1,464 topics
- 4,392 lessons
- 1,464 topic quizzes
- 14,640 quiz questions
- ESLint: PASS
- TypeScript: PASS

Note:
The supplied project uses a client-side import of courseCurriculum.json, so this
patch intentionally preserves the existing course UI contract. The curriculum
file is substantially larger than the original; if bundle/performance becomes
a concern, the next safe refactor is to split curriculum into route-fetched
course data without changing the UI.
