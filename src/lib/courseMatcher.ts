import courses from '@/data/courseCatalog.json';

export interface StudentCourseProfile {
  educationLevel?: string;
  currentClass?: string;

  stream?: string;

  board?: string;

  state?: string;

  city?: string;

  careerGoal?: string;

  interestedCourse?: string;

  targetJob?: string;

  targetExam?: string;

  preferredStudyState?: string;

  preferredIndustry?: string;
}

function normalize(
  value?: unknown
): string {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function matchesText(
  value: unknown,
  search: string
): boolean {
  if (!search) {
    return false;
  }

  return normalize(value)
    .includes(search);
}

function matchesArray(
  values: unknown,
  search: string
): boolean {
  if (!search) {
    return false;
  }

  if (!Array.isArray(values)) {
    return false;
  }

  return values.some(
    (item) => {
      const normalized =
        normalize(item);

      return (
        normalized === search ||
        normalized.includes(search) ||
        search.includes(normalized)
      );
    }
  );
}

export function getRecommendedCourses(
  student: StudentCourseProfile
) {
  const stream =
    normalize(student.stream);

  const careerGoal =
    normalize(student.careerGoal);

  const interestedCourse =
    normalize(
      student.interestedCourse
    );

  const targetJob =
    normalize(student.targetJob);

  const state =
    normalize(student.state);

  const targetExam =
    normalize(student.targetExam);

  const preferredStudyState =
    normalize(
      student.preferredStudyState
    );

  const preferredIndustry =
    normalize(
      student.preferredIndustry
    );

  return courses
    .map((course: any) => {
      let score = 0;

      /*
       * STREAM
       */
      if (
        matchesArray(
          course.stream,
          stream
        )
      ) {
        score += 5;
      }

      /*
       * CAREER GOAL
       */
      if (
        matchesArray(
          course.careerGoals,
          careerGoal
        )
      ) {
        score += 5;
      }

      /*
       * INTERESTED COURSE
       */
      if (
        interestedCourse &&
        (
          matchesText(
            course.title,
            interestedCourse
          ) ||
          matchesText(
            course.category,
            interestedCourse
          )
        )
      ) {
        score += 4;
      }

      /*
       * TARGET JOB
       */
      if (
        matchesArray(
          course.targetJobs,
          targetJob
        )
      ) {
        score += 5;
      }

      /*
       * STATE
       */
      if (
        matchesArray(
          course.states,
          state
        ) ||
        matchesArray(
          course.state,
          state
        ) ||
        matchesArray(
          course.availableStates,
          state
        )
      ) {
        score += 3;
      }

      /*
       * TARGET EXAM
       */
      if (
        matchesArray(
          course.exams,
          targetExam
        ) ||
        matchesArray(
          course.entranceExams,
          targetExam
        )
      ) {
        score += 3;
      }

      /*
       * STUDY STATE
       */
      if (
        matchesArray(
          course.states,
          preferredStudyState
        ) ||
        matchesArray(
          course.availableStates,
          preferredStudyState
        )
      ) {
        score += 2;
      }

      /*
       * INDUSTRY
       */
      if (
        matchesArray(
          course.industries,
          preferredIndustry
        ) ||
        matchesArray(
          course.targetIndustries,
          preferredIndustry
        )
      ) {
        score += 3;
      }

      return {
        ...course,
        recommendationScore:
          score,
      };
    })
    .filter(
      (course) =>
        course.recommendationScore >
        0
    )
    .sort(
      (a, b) =>
        b.recommendationScore -
        a.recommendationScore
    );
}