'use client';

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useRouter } from 'next/navigation';

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Code2,
  GraduationCap,
  Loader2,
  MapPin,
  Sparkles,
  Target,
} from 'lucide-react';

/* =========================================================
   TYPES
========================================================= */

type Student = {
  studentId: string;
  name?: string;
  email?: string;
  phone?: string;
};

type FormData = {
  educationLevel: string;
  tenthStatus: string;
  twelfthStatus: string;
  stream: string;
  state: string;
  careerGoal: string;
  interestedCourse: string;
  targetJob: string;
  preferredExam: string;
  learningMode: string;
  skills: string[];
};

/* =========================================================
   OPTIONS
========================================================= */

const educationLevels = [
  '10th',
  '11th',
  '12th',
  'Diploma',
  'Graduate',
];

const states = [
  'Karnataka',
  'Andhra Pradesh',
  'Telangana',
  'Tamil Nadu',
  'Kerala',
  'Maharashtra',
  'Delhi',
  'Uttar Pradesh',
  'Rajasthan',
  'Gujarat',
  'West Bengal',
  'Other',
];

const streams = [
  'Science - PCM',
  'Science - PCB',
  'Science - PCMB',
  'Commerce',
  'Arts / Humanities',
  'Diploma',
  'Computer Science',
  'Other',
];

const careerGoals = [
  'Engineering',
  'Medical',
  'Technology / IT',
  'Government Job',
  'Banking / Finance',
  'Business / Startup',
  'Design',
  'Law',
  'Teaching',
  'Research',
  'Not Sure Yet',
];

const courses = [
  'B.Tech / BE',
  'BCA',
  'B.Sc Computer Science',
  'B.Pharm',
  'MBBS',
  'BDS',
  'B.Com',
  'BBA',
  'BA',
  'B.Des',
  'LLB',
  'Diploma',
  'Other',
];

const exams = [
  'JEE Main',
  'JEE Advanced',
  'KCET',
  'NEET',
  'COMEDK',
  'BITSAT',
  'CUET',
  'NATA',
  'CLAT',
  'CET / State Entrance',
  'Government Competitive Exams',
  'Not Decided',
];

const jobs = [
  'Software Engineer',
  'Full Stack Developer',
  'Frontend Developer',
  'Backend Developer',
  'Data Analyst',
  'Data Scientist',
  'AI / ML Engineer',
  'Cybersecurity Engineer',
  'Cloud Engineer',
  'DevOps Engineer',
  'Product Manager',
  'Business Analyst',
  'Government Officer',
  'Banking Professional',
  'Doctor',
  'Entrepreneur',
  'Not Decided',
];

const skills = [
  'Programming',
  'Python',
  'Java',
  'JavaScript',
  'TypeScript',
  'React',
  'Node.js',
  'SQL',
  'Data Structures',
  'AI / Machine Learning',
  'Cloud Computing',
  'Cybersecurity',
  'Communication',
  'Leadership',
  'Problem Solving',
  'Aptitude',
];

/* =========================================================
   COMPONENT
========================================================= */

export default function OnboardingPage() {
  const router = useRouter();

  const [student] =
    useState<Student | null>(() => {
      if (typeof window === 'undefined') {
        return null;
      }

      try {
        const stored =
          localStorage.getItem('edupath_student');

        if (!stored) {
          return null;
        }

        const parsed: unknown =
          JSON.parse(stored);

        if (
          typeof parsed === 'object' &&
          parsed !== null &&
          'studentId' in parsed &&
          typeof parsed.studentId === 'string'
        ) {
          return parsed as Student;
        }
      } catch (error) {
        console.error(
          'Failed to read student session cache:',
          error
        );
      }

      return null;
    });

  const [step, setStep] = useState(1);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');

  const [form, setForm] = useState<FormData>({
    educationLevel: '',
    tenthStatus: '',
    twelfthStatus: '',
    stream: '',
    state: '',
    careerGoal: '',
    interestedCourse: '',
    targetJob: '',
    preferredExam: '',
    learningMode: '',
    skills: [],
  });

  /* =======================================================
     LOAD STUDENT
  ======================================================= */

  useEffect(() => {
    if (!student?.studentId) {
      router.replace('/login');
    }
  }, [router, student]);

  /* =======================================================
     TOTAL STEPS
  ======================================================= */

  const totalSteps = 6;

  /* =======================================================
     PROGRESS
  ======================================================= */

  const progress = Math.round(
    (step / totalSteps) * 100
  );

  /* =======================================================
     UPDATE FORM
  ======================================================= */

  const updateField = (
    field: keyof FormData,
    value: string
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setError('');
  };

  /* =======================================================
     SKILL TOGGLE
  ======================================================= */

  const toggleSkill = (skill: string) => {
    setForm((previous) => {
      const exists =
        previous.skills.includes(skill);

      return {
        ...previous,

        skills: exists
          ? previous.skills.filter(
              (item) => item !== skill
            )
          : [
              ...previous.skills,
              skill,
            ],
      };
    });

    setError('');
  };

  /* =======================================================
     VALIDATION
  ======================================================= */

  const validateStep = () => {
    setError('');

    /* STEP 1 */

    if (step === 1) {
      if (!form.educationLevel) {
        setError(
          'Please select your current education level.'
        );

        return false;
      }

      if (!form.tenthStatus) {
        setError(
          'Please select your 10th status.'
        );

        return false;
      }
    }

    /* STEP 2 */

    if (step === 2) {
      if (!form.state) {
        setError(
          'Please select your state.'
        );

        return false;
      }

      if (!form.stream) {
        setError(
          'Please select your stream.'
        );

        return false;
      }
    }

    /* STEP 3 */

    if (step === 3) {
      if (!form.careerGoal) {
        setError(
          'Please select your career goal.'
        );

        return false;
      }

      if (!form.interestedCourse) {
        setError(
          'Please select the course you are interested in.'
        );

        return false;
      }
    }

    /* STEP 4 */

    if (step === 4) {
      if (!form.preferredExam) {
        setError(
          'Please select your preferred entrance exam.'
        );

        return false;
      }

      if (!form.targetJob) {
        setError(
          'Please select your target career or job.'
        );

        return false;
      }
    }

    /* STEP 5 */

    if (step === 5) {
      if (!form.learningMode) {
        setError(
          'Please select your preferred learning mode.'
        );

        return false;
      }
    }

    /* STEP 6 */

    if (step === 6) {
      if (form.skills.length === 0) {
        setError(
          'Please select at least one skill you want to develop.'
        );

        return false;
      }
    }

    return true;
  };

  /* =======================================================
     NEXT
  ======================================================= */

  const handleNext = () => {
    if (!validateStep()) {
      return;
    }

    if (step < totalSteps) {
      setStep(
        (previous) => previous + 1
      );

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  };

  /* =======================================================
     BACK
  ======================================================= */

  const handleBack = () => {
    if (step > 1) {
      setStep(
        (previous) => previous - 1
      );

      setError('');

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  };

  /* =======================================================
     SUBMIT
  ======================================================= */

  const handleSubmit = async () => {
    if (!validateStep()) {
      return;
    }

    if (!student?.studentId) {
      setError(
        'Student session expired. Please login again.'
      );

      return;
    }

    try {
      setSaving(true);
      setError('');

      const response = await fetch(
        '/api/student/onboarding',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            studentId:
              student.studentId,

            educationLevel:
              form.educationLevel,

            tenthStatus:
              form.tenthStatus,

            twelfthStatus:
              form.twelfthStatus,

            stream:
              form.stream,

            state:
              form.state,

            careerGoal:
              form.careerGoal,

            interestedCourse:
              form.interestedCourse,

            targetJob:
              form.targetJob,

            preferredExam:
              form.preferredExam,

            learningMode:
              form.learningMode,

            skills:
              form.skills,

            onboardingCompleted:
              true,

            onboardingCompletedAt:
              new Date().toISOString(),
          }),
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            'Unable to save your profile.'
        );
      }

      /* -----------------------------------------------
         UPDATE LOCAL STUDENT SESSION
      ----------------------------------------------- */

      const updatedStudent = {
        ...student,
        ...data.student,
        onboardingCompleted: true,
      };

      localStorage.setItem(
        'edupath_student',
        JSON.stringify(
          updatedStudent
        )
      );

      /* -----------------------------------------------
         GO TO DASHBOARD
      ----------------------------------------------- */

      router.replace('/dashboard');
    } catch (err) {
      console.error(
        'Onboarding submit error:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while saving your profile.'
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     COURSE RECOMMENDATION
  ======================================================= */

  const recommendation = useMemo(() => {
    if (
      form.careerGoal ===
      'Engineering'
    ) {
      return 'Engineering roadmap: entrance exam → college → programming → projects → internship → placement.';
    }

    if (
      form.careerGoal ===
      'Medical'
    ) {
      return 'Medical roadmap: entrance preparation → medical college → clinical learning → specialization → career.';
    }

    if (
      form.careerGoal ===
      'Technology / IT'
    ) {
      return 'Technology roadmap: fundamentals → programming → DSA → projects → internship → interviews → first job.';
    }

    return 'EduPath will create a personalized roadmap based on your selections.';
  }, [form.careerGoal]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (!student) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-brand-600" />
      </div>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4">

        {/* HEADER */}

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Build Your EduPath
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900">
            Build your career roadmap
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Hi {student.name || 'Student'}, answer a few questions and EduPath will personalize your journey from education to your first job.
          </p>
        </div>

        {/* PROGRESS */}

        <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-sm">

          <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-2">

            <span>
              Step {step} of {totalSteps}
            </span>

            <span>
              {progress}%
            </span>

          </div>

          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">

            <div
              className="h-full bg-brand-600 rounded-full transition-all duration-300"
              style={{
                width: `${progress}%`,
              }}
            />

          </div>

        </div>

        {/* MAIN CARD */}

        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">

          {/* =================================================
              STEP 1
          ================================================= */}

          {step === 1 && (
            <section className="p-6 sm:p-8 space-y-7">

              <SectionHeader
                icon={
                  <GraduationCap className="w-5 h-5" />
                }
                title="Where are you in your education?"
                description="Tell us where you are starting from."
              />

              <OptionGrid
                title="Current education level"
                options={educationLevels}
                value={
                  form.educationLevel
                }
                onChange={(value) =>
                  updateField(
                    'educationLevel',
                    value
                  )
                }
              />

              <OptionGrid
                title="10th status"
                options={[
                  'Completed',
                  'Currently studying',
                  'Not completed',
                ]}
                value={
                  form.tenthStatus
                }
                onChange={(value) =>
                  updateField(
                    'tenthStatus',
                    value
                  )
                }
              />

              <OptionGrid
                title="12th status"
                options={[
                  'Completed',
                  'Currently studying',
                  'Not started',
                  'Not applicable',
                ]}
                value={
                  form.twelfthStatus
                }
                onChange={(value) =>
                  updateField(
                    'twelfthStatus',
                    value
                  )
                }
              />

            </section>
          )}

          {/* =================================================
              STEP 2
          ================================================= */}

          {step === 2 && (
            <section className="p-6 sm:p-8 space-y-7">

              <SectionHeader
                icon={
                  <MapPin className="w-5 h-5" />
                }
                title="Tell us about your location and stream"
                description="This helps us show relevant state exams, colleges and opportunities."
              />

              <OptionGrid
                title="Your state"
                options={states}
                value={form.state}
                onChange={(value) =>
                  updateField(
                    'state',
                    value
                  )
                }
              />

              <OptionGrid
                title="Your stream"
                options={streams}
                value={form.stream}
                onChange={(value) =>
                  updateField(
                    'stream',
                    value
                  )
                }
              />

            </section>
          )}

          {/* =================================================
              STEP 3
          ================================================= */}

          {step === 3 && (
            <section className="p-6 sm:p-8 space-y-7">

              <SectionHeader
                icon={
                  <Target className="w-5 h-5" />
                }
                title="What career are you targeting?"
                description="We will use this information to create your personalized learning and career roadmap."
              />

              <OptionGrid
                title="Career goal"
                options={careerGoals}
                value={
                  form.careerGoal
                }
                onChange={(value) =>
                  updateField(
                    'careerGoal',
                    value
                  )
                }
              />

              <OptionGrid
                title="Interested course"
                options={courses}
                value={
                  form.interestedCourse
                }
                onChange={(value) =>
                  updateField(
                    'interestedCourse',
                    value
                  )
                }
              />

            </section>
          )}

          {/* =================================================
              STEP 4
          ================================================= */}

          {step === 4 && (
            <section className="p-6 sm:p-8 space-y-7">

              <SectionHeader
                icon={
                  <Briefcase className="w-5 h-5" />
                }
                title="Where do you want to go?"
                description="Choose your entrance exam and your target job."
              />

              <OptionGrid
                title="Preferred entrance exam"
                options={exams}
                value={
                  form.preferredExam
                }
                onChange={(value) =>
                  updateField(
                    'preferredExam',
                    value
                  )
                }
              />

              <OptionGrid
                title="Target job"
                options={jobs}
                value={
                  form.targetJob
                }
                onChange={(value) =>
                  updateField(
                    'targetJob',
                    value
                  )
                }
              />

            </section>
          )}

          {/* =================================================
              STEP 5
          ================================================= */}

          {step === 5 && (
            <section className="p-6 sm:p-8 space-y-7">

              <SectionHeader
                icon={
                  <BookOpen className="w-5 h-5" />
                }
                title="How do you want to learn?"
                description="We will customize your learning resources accordingly."
              />

              <OptionGrid
                title="Preferred learning mode"
                options={[
                  'Self-paced',
                  'Video learning',
                  'Live classes',
                  'Practice focused',
                  'Mixed / All',
                ]}
                value={
                  form.learningMode
                }
                onChange={(value) =>
                  updateField(
                    'learningMode',
                    value
                  )
                }
              />

              <div className="p-5 rounded-2xl bg-brand-50 border border-brand-100">

                <div className="text-sm font-bold text-brand-900 mb-2">
                  Your initial roadmap
                </div>

                <p className="text-xs leading-relaxed text-brand-700">
                  {recommendation}
                </p>

              </div>

            </section>
          )}

          {/* =================================================
              STEP 6
          ================================================= */}

          {step === 6 && (
            <section className="p-6 sm:p-8 space-y-7">

              <SectionHeader
                icon={
                  <Code2 className="w-5 h-5" />
                }
                title="Which skills do you want to build?"
                description="Select everything you want EduPath to include in your learning roadmap."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                {skills.map((skill) => {
                  const selected =
                    form.skills.includes(
                      skill
                    );

                  return (
                    <button
                      type="button"
                      key={skill}
                      onClick={() =>
                        toggleSkill(
                          skill
                        )
                      }
                      className={`text-left p-3.5 rounded-xl border transition ${
                        selected
                          ? 'border-brand-500 bg-brand-50 text-brand-800'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-brand-300'
                      }`}
                    >

                      <div className="flex items-center justify-between">

                        <span className="text-sm font-semibold">
                          {skill}
                        </span>

                        {selected && (
                          <CheckCircle2 className="w-4 h-4 text-brand-600" />
                        )}

                      </div>

                    </button>
                  );
                })}

              </div>

              <div className="p-5 rounded-2xl bg-slate-900 text-white">

                <div className="flex items-center gap-2 mb-2">

                  <Sparkles className="w-4 h-4 text-brand-300" />

                  <span className="text-sm font-bold">
                    Your EduPath will include
                  </span>

                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Entrance preparation, course syllabus, state-specific information, college guidance, projects, skill development, internships, resume building, aptitude preparation, interview questions and a structured path toward your first job.
                </p>

              </div>

            </section>
          )}

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div className="mx-6 sm:mx-8 mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* =================================================
              FOOTER
          ================================================= */}

          <div className="border-t border-slate-200 p-5 sm:p-6 flex items-center justify-between gap-3">

            <button
              type="button"
              onClick={handleBack}
              disabled={
                step === 1 ||
                saving
              }
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition"
            >
              <ArrowLeft className="w-4 h-4" />

              Back
            </button>

            {step < totalSteps ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow-sm transition"
              >
                Continue

                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-sm transition disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />

                    Saving...
                  </>
                ) : (
                  <>
                    Complete My Profile

                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SECTION HEADER
========================================================= */

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div>

      <div className="flex items-center gap-3 mb-2">

        <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
          {icon}
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-slate-900">
          {title}
        </h2>

      </div>

      <p className="text-xs sm:text-sm text-slate-500">
        {description}
      </p>

    </div>
  );
}

/* =========================================================
   OPTION GRID
========================================================= */

function OptionGrid({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>

      <div className="text-sm font-bold text-slate-800 mb-3">
        {title}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

        {options.map((option) => {
          const selected =
            value === option;

          return (
            <button
              type="button"
              key={option}
              onClick={() =>
                onChange(option)
              }
              className={`text-left p-4 rounded-xl border transition ${
                selected
                  ? 'border-brand-500 bg-brand-50 text-brand-800 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-slate-50'
              }`}
            >

              <div className="flex items-center justify-between">

                <span className="text-sm font-semibold">
                  {option}
                </span>

                {selected && (
                  <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                )}

              </div>

            </button>
          );
        })}

      </div>

    </div>
  );
}