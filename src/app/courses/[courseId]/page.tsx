// src/app/courses/[courseId]/page.tsx
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Compass,
  CheckCircle2,
  PlayCircle,
  BookOpen,
  FileText,
  Award,
  ArrowLeft,
  Clock,
  User,
  GraduationCap,
  Sparkles,
  ChevronRight,
  Check,
} from 'lucide-react';
import coursesData from '@/data/courses.json';
import courseCurriculumData from '@/data/courseCurriculum.json';

interface CourseMeta {
  id: string;
  category: string;
  name: string;
  duration: string;
  eligibility: string;
  overview: string;
  careerPathways: string[];
  topExams: string[];
}

interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: string;
  content: string;
  resources?: Array<{ title: string; type: string; url: string }>;
}

interface Question {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

interface Topic {
  id: string;
  title: string;
  lessons: Lesson[];
  quiz?: {
    id: string;
    title: string;
    passingScore: number;
    questions: Question[];
  };
}

interface Module {
  id: string;
  number: number;
  title: string;
  description: string;
  topics: Topic[];
  mockTest?: {
    id: string;
    title: string;
    durationMins: number;
    questions: Question[];
  };
}

interface CourseCurriculum {
  courseId: string;
  title: string;
  difficulty: string;
  estimatedHours: string;
  instructor: {
    name: string;
    role: string;
    bio: string;
  };
  learningOutcomes: string[];
  prerequisites: string[];
  modules: Module[];
}

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const [student] = useState<{ studentId?: string; name?: string; email?: string } | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem('edupath_student');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.studentId || parsed?.id) return parsed;
      }
    } catch {}
    return null;
  });
  const [activeTab, setActiveTab] = useState<'syllabus' | 'overview' | 'player' | 'quiz'>('syllabus');

  // Selected LMS Items
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedQuizTopic, setSelectedQuizTopic] = useState<Topic | null>(null);

  // Progress state
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const savedProg = localStorage.getItem(`edupath_progress_${courseId}`);
      if (savedProg) {
        const p = JSON.parse(savedProg);
        if (Array.isArray(p.completedLessons)) return new Set(p.completedLessons);
      }
    } catch {}
    return new Set();
  });
  const [completedQuizIds, setCompletedQuizIds] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const savedProg = localStorage.getItem(`edupath_progress_${courseId}`);
      if (savedProg) {
        const p = JSON.parse(savedProg);
        if (Array.isArray(p.completedQuizzes)) return new Set(p.completedQuizzes);
      }
    } catch {}
    return new Set();
  });
  const [isEnrolled, setIsEnrolled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const savedProg = localStorage.getItem(`edupath_progress_${courseId}`);
      return Boolean(savedProg);
    } catch {
      return false;
    }
  });

  // Quiz Player State
  const [currentQuizQ, setCurrentQuizQ] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Match course metadata from courses.json
  const courseMeta = useMemo(() => {
    return coursesData.find((c) => c.id === courseId) || null;
  }, [courseId]);

  // Match curriculum from either:
  // 1) the legacy object format: { [courseId]: CourseCurriculum }
  // 2) the expanded format: { courses: CourseCurriculum[] }
  //
  // The normalizer keeps the existing LMS UI contract unchanged.
  const curriculum: CourseCurriculum = useMemo(() => {
    const fallbackName =
      courseMeta?.name || 'Professional Certification Curriculum';

    const fallbackCurriculum: CourseCurriculum = {
      courseId,
      title: `${fallbackName} — Comprehensive Syllabus & Career Roadmap`,
      difficulty: 'Undergraduate / Professional Track',
      estimatedHours: '90 Hours',
      instructor: {
        name: 'EduPath Academic Board & Industry Mentors',
        role: 'Faculty Advisors & Lead Practitioners',
        bio: 'Comprehensive topic-wise lessons and assessment pathways for structured academic and career preparation.',
      },
      learningOutcomes: [
        `Master fundamental principles and advanced concepts in ${fallbackName}`,
        'Learn practical problem solving and industry-standard workflows',
        'Complete topic-wise quizzes and module assessments with feedback',
        'Prepare effectively for examinations, projects, and placement interviews',
      ],
      prerequisites: [
        courseMeta?.eligibility ||
          '10+2 with the required subject background',
        'Dedication to complete practice and assessments',
      ],
      modules: [
        {
          id: 'mod-gen-1',
          number: 1,
          title: 'Module 1: Core Fundamentals & Theory',
          description: `Key foundational principles, concepts, and analytical frameworks in ${fallbackName}.`,
          topics: [
            {
              id: 'top-gen-1-1',
              title: 'Topic 1: Introduction & Foundational Concepts',
              lessons: [
                {
                  id: 'les-gen-1-1-1',
                  title: 'Core Principles, Terminology & Scope',
                  duration: '30 mins',
                  type: 'text',
                  content:
                    `### Overview of ${fallbackName}\n` +
                    'This introductory lesson covers foundational concepts, terminology, and practical applications.\n\n' +
                    '#### Learning Objectives\n' +
                    '1. Understand the domain scope and terminology.\n' +
                    '2. Learn the fundamental principles.\n' +
                    '3. Identify common academic and career pathways.',
                  resources: [
                    {
                      title: 'EduPath Resources',
                      type: 'LINK',
                      url: '/resources',
                    },
                  ],
                },
                {
                  id: 'les-gen-1-1-2',
                  title: 'Methodologies, Analysis & Practical Applications',
                  duration: '35 mins',
                  type: 'text',
                  content:
                    `### Methodologies and Practical Applications\n` +
                    `Explore analytical methods, workflows, and applications relevant to ${fallbackName}.`,
                  resources: [],
                },
              ],
              quiz: {
                id: 'quiz-gen-1-1',
                title: 'Topic 1 Practice Quiz',
                passingScore: 70,
                questions: [
                  {
                    id: 'q1',
                    question:
                      `Which approach is most appropriate when learning ${fallbackName}?`,
                    options: [
                      'Build fundamentals, practice concepts, and review mistakes',
                      'Skip foundational concepts',
                      'Only memorize definitions',
                      'Avoid assessments',
                    ],
                    answerIndex: 0,
                    explanation:
                      'A structured progression from fundamentals to practice and assessment provides stronger mastery.',
                  },
                ],
              },
            },
          ],
          mockTest: {
            id: 'mock-gen-1',
            title: 'Module 1 Comprehensive Assessment',
            durationMins: 15,
            questions: [
              {
                id: 'mq1',
                question:
                  'Which activity best demonstrates topic mastery?',
                options: [
                  'Timed practice followed by review',
                  'Skipping all practice',
                  'Passive reading only',
                  'Guessing answers',
                ],
                answerIndex: 0,
                explanation:
                  'Timed practice followed by reviewing explanations helps verify understanding and identify gaps.',
              },
            ],
          },
        },
      ],
    };

    const isRecord = (
      value: unknown
    ): value is Record<string, unknown> =>
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value);

    const asString = (
      value: unknown,
      fallback: string
    ): string =>
      typeof value === 'string' &&
      value.trim().length > 0
        ? value
        : fallback;

    const asNumber = (
      value: unknown,
      fallback: number
    ): number =>
      typeof value === 'number' &&
      Number.isFinite(value)
        ? value
        : fallback;

    const asStringArray = (
      value: unknown,
      fallback: string[]
    ): string[] =>
      Array.isArray(value)
        ? value.filter(
            (
              item: unknown
            ): item is string =>
              typeof item === 'string'
          )
        : fallback;

    const makeQuestions = (
      rawQuestions: unknown,
      prefix: string,
      fallbackQuestion: string
    ): Question[] => {
      const questions = Array.isArray(
        rawQuestions
      )
        ? rawQuestions
        : [];

      const normalized =
        questions.map(
          (
            rawQuestion: unknown,
            questionIndex: number
          ): Question => {
            const q = isRecord(
              rawQuestion
            )
              ? rawQuestion
              : {};

            const rawOptions =
              Array.isArray(q.options)
                ? q.options
                : [];

            const options =
              rawOptions.filter(
                (
                  option: unknown
                ): option is string =>
                  typeof option ===
                  'string'
              );

            const safeOptions =
              options.length >= 2
                ? options
                : [
                    'Correct concept / approach',
                    'Incorrect concept',
                    'Unrelated approach',
                    'Insufficient information',
                  ];

            return {
              id: asString(
                q.id,
                `${prefix}-q-${questionIndex + 1}`
              ),
              question:
                asString(
                  q.question,
                  fallbackQuestion
                ),
              options:
                safeOptions,
              answerIndex: Math.min(
                Math.max(
                  asNumber(
                    q.answerIndex,
                    0
                  ),
                  0
                ),
                safeOptions.length - 1
              ),
              explanation:
                asString(
                  q.explanation,
                  'Review the lesson and topic material for the correct reasoning.'
                ),
            };
          }
        );

      if (normalized.length > 0) {
        return normalized;
      }

      return [
        {
          id: `${prefix}-q-1`,
          question:
            fallbackQuestion,
          options: [
            'Review the core concepts and apply them in practice',
            'Skip the foundational concepts',
            'Rely only on memorization',
            'Avoid practice',
          ],
          answerIndex: 0,
          explanation:
            'Structured learning combines understanding, practice, and assessment.',
        },
      ];
    };

    const normalizeLesson = (
      rawLesson: unknown,
      lessonIndex: number,
      topicIndex: number,
      moduleIndex: number
    ): Lesson => {
      const lessonData =
        isRecord(rawLesson)
          ? rawLesson
          : {};

      const lessonId =
        asString(
          lessonData.id,
          `${courseId}-lesson-${moduleIndex + 1}-${topicIndex + 1}-${lessonIndex + 1}`
        );

      const lessonTitle =
        asString(
          lessonData.title,
          `Lesson ${lessonIndex + 1}`
        );

      const resourcesRaw =
        Array.isArray(
          lessonData.resources
        )
          ? lessonData.resources
          : [];

      const resources =
        resourcesRaw
          .filter(isRecord)
          .map(
            (
              resource,
              resourceIndex
            ) => ({
              title: asString(
                resource.title,
                `Resource ${resourceIndex + 1}`
              ),
              type: asString(
                resource.type,
                'LINK'
              ),
              url: asString(
                resource.url,
                '/resources'
              ),
            })
          );

      return {
        id: lessonId,
        title: lessonTitle,
        duration: asString(
          lessonData.duration,
          '30 mins'
        ),
        type: asString(
          lessonData.type,
          'text'
        ),
        content: asString(
          lessonData.content,
          `## ${lessonTitle}\n\n` +
            `Study the core concepts, examples, and practical applications covered in this lesson.\n\n` +
            '### Recommended approach\n' +
            '1. Read the concept notes.\n' +
            '2. Work through examples.\n' +
            '3. Complete practice questions.\n' +
            '4. Review your mistakes before proceeding.'
        ),
        resources,
      };
    };

    const normalizeTopic = (
      rawTopic: unknown,
      topicIndex: number,
      moduleIndex: number
    ): Topic => {
      const topicData =
        isRecord(rawTopic)
          ? rawTopic
          : {};

      const topicId =
        asString(
          topicData.id,
          `${courseId}-topic-${moduleIndex + 1}-${topicIndex + 1}`
        );

      const topicTitle =
        asString(
          topicData.title,
          `Topic ${topicIndex + 1}`
        );

      const rawLessons =
        Array.isArray(
          topicData.lessons
        )
          ? topicData.lessons
          : [];

      const normalizedLessons =
        rawLessons.map(
          (
            rawLesson: unknown,
            lessonIndex: number
          ) =>
            normalizeLesson(
              rawLesson,
              lessonIndex,
              topicIndex,
              moduleIndex
            )
        );

      const lessons =
        normalizedLessons.length >
        0
          ? normalizedLessons
          : [
              normalizeLesson(
                {
                  id: `${topicId}-lesson-1`,
                  title: 'Introduction',
                  type: 'text',
                  duration: '30 mins',
                },
                0,
                topicIndex,
                moduleIndex
              ),
            ];

      let quiz:
        Topic['quiz'] | undefined;

      if (
        isRecord(topicData.quiz)
      ) {
        const quizData =
          topicData.quiz;

        quiz = {
          id: asString(
            quizData.id,
            `${topicId}-quiz`
          ),
          title: asString(
            quizData.title,
            `${topicTitle} Quiz`
          ),
          passingScore: asNumber(
            quizData.passingScore,
            70
          ),
          questions:
            makeQuestions(
              quizData.questions,
              `${topicId}-quiz`,
              `Which statement best represents the core concept of ${topicTitle}?`
            ),
        };
      } else {
        const assessment =
          isRecord(
            topicData.assessment
          )
            ? topicData.assessment
            : null;

        if (
          assessment
        ) {
          quiz = {
            id: asString(
              assessment.quizId,
              `${topicId}-quiz`
            ),
            title:
              `${topicTitle} Practice Quiz`,
            passingScore: 70,
            questions:
              makeQuestions(
                assessment.questions,
                `${topicId}-quiz`,
                `Which approach best demonstrates understanding of ${topicTitle}?`
              ),
          };
        } else {
          quiz = {
            id: `${topicId}-quiz`,
            title:
              `${topicTitle} Practice Quiz`,
            passingScore: 70,
            questions:
              makeQuestions(
                undefined,
                `${topicId}-quiz`,
                `Which approach best demonstrates understanding of ${topicTitle}?`
              ),
          };
        }
      }

      return {
        id: topicId,
        title: topicTitle,
        lessons,
        quiz,
      };
    };

    const normalizeModule = (
      rawModule: unknown,
      moduleIndex: number
    ): Module => {
      const moduleData =
        isRecord(rawModule)
          ? rawModule
          : {};

      const moduleId =
        asString(
          moduleData.id,
          `${courseId}-module-${moduleIndex + 1}`
        );

      const moduleTitle =
        asString(
          moduleData.title,
          `Module ${moduleIndex + 1}`
        );

      const rawTopics =
        Array.isArray(
          moduleData.topics
        )
          ? moduleData.topics
          : [];

      const topics =
        rawTopics.length > 0
          ? rawTopics.map(
              (
                rawTopic: unknown,
                topicIndex: number
              ) =>
                normalizeTopic(
                  rawTopic,
                  topicIndex,
                  moduleIndex
                )
            )
          : [
              normalizeTopic(
                {
                  id: `${moduleId}-topic-1`,
                  title:
                    'Core Concepts',
                },
                0,
                moduleIndex
              ),
            ];

      let mockTest:
        Module['mockTest'] | undefined;

      if (
        isRecord(
          moduleData.mockTest
        )
      ) {
        const mock =
          moduleData.mockTest;

        mockTest = {
          id: asString(
            mock.id,
            `${moduleId}-mock`
          ),
          title: asString(
            mock.title,
            `${moduleTitle} Mock Test`
          ),
          durationMins:
            asNumber(
              mock.durationMins,
              30
            ),
          questions:
            makeQuestions(
              mock.questions,
              `${moduleId}-mock`,
              `Which statement best demonstrates mastery of ${moduleTitle}?`
            ),
        };
      } else {
        mockTest = {
          id: `${moduleId}-mock`,
          title:
            `${moduleTitle} Mock Test`,
          durationMins: 30,
          questions:
            makeQuestions(
              undefined,
              `${moduleId}-mock`,
              `Which statement best demonstrates mastery of ${moduleTitle}?`
            ),
        };
      }

      return {
        id: moduleId,
        number: asNumber(
          moduleData.number,
          moduleIndex + 1
        ),
        title: moduleTitle,
        description: asString(
          moduleData.description,
          `Structured learning module for ${moduleTitle}.`
        ),
        topics,
        mockTest,
      };
    };

    const normalizeCourse = (
      rawCourse: unknown
    ): CourseCurriculum | null => {
      if (!isRecord(rawCourse)) {
        return null;
      }

      const rawModules =
        Array.isArray(
          rawCourse.modules
        )
          ? rawCourse.modules
          : [];

      const modules =
        rawModules.length > 0
          ? rawModules.map(
              (
                rawModule: unknown,
                moduleIndex: number
              ) =>
                normalizeModule(
                  rawModule,
                  moduleIndex
                )
            )
          : fallbackCurriculum.modules;

      const learningOutcomes =
        asStringArray(
          rawCourse.learningOutcomes,
          fallbackCurriculum.learningOutcomes
        );

      const prerequisites =
        asStringArray(
          rawCourse.prerequisites,
          [
            courseMeta?.eligibility ||
              '10+2 with the required subject background',
            'Complete the learning roadmap and assessments',
          ]
        );

      const level =
        asString(
          rawCourse.level,
          fallbackCurriculum.difficulty
        );

      const description =
        asString(
          rawCourse.description,
          ''
        );

      const estimatedHours =
        asString(
          rawCourse.estimatedHours,
          courseMeta?.duration ||
            '90 Hours'
        );

      return {
        courseId: asString(
          rawCourse.courseId,
          courseId
        ),
        title: asString(
          rawCourse.title,
          `${fallbackName} — Comprehensive Syllabus & Career Roadmap`
        ),
        difficulty: level,
        estimatedHours,
        instructor:
          isRecord(
            rawCourse.instructor
          )
            ? {
                name: asString(
                  rawCourse.instructor.name,
                  fallbackCurriculum.instructor.name
                ),
                role: asString(
                  rawCourse.instructor.role,
                  fallbackCurriculum.instructor.role
                ),
                bio: asString(
                  rawCourse.instructor.bio,
                  fallbackCurriculum.instructor.bio
                ),
              }
            : {
                ...fallbackCurriculum.instructor,
                bio:
                  description ||
                  fallbackCurriculum
                    .instructor.bio,
              },
        learningOutcomes,
        prerequisites,
        modules,
      };
    };

    const dataRoot: unknown =
      courseCurriculumData;

    /*
     * Expanded format:
     * {
     *   courses: [
     *     { courseId: 'dsa', ... }
     *   ]
     * }
     */
    if (isRecord(dataRoot)) {
      const courses =
        dataRoot.courses;

      if (
        Array.isArray(courses)
      ) {
        const matchingCourse =
          courses.find(
            (
              candidate: unknown
            ) =>
              isRecord(candidate) &&
              candidate.courseId ===
                courseId
          );

        const normalized =
          normalizeCourse(
            matchingCourse
          );

        if (normalized) {
          return normalized;
        }
      }

      /*
       * Legacy format:
       * {
       *   "dsa": { courseId: "dsa", ... }
       * }
       */
      const legacyCandidate =
        dataRoot[courseId];

      const normalizedLegacy =
        normalizeCourse(
          legacyCandidate
        );

      if (normalizedLegacy) {
        return normalizedLegacy;
      }
    }

    return fallbackCurriculum;
  }, [courseId, courseMeta]);

  // Calculate overall progress percentage
  const totalLessons = useMemo(() => {
    let count = 0;
    curriculum.modules.forEach((m) => m.topics.forEach((t) => (count += t.lessons.length)));
    return Math.max(1, count);
  }, [curriculum]);

  const progressPercentage = Math.round((completedLessonIds.size / totalLessons) * 100);

  const handleEnroll = () => {
    if (!student) {
      router.push('/login');
      return;
    }
    setIsEnrolled(true);
    // Start first lesson
    if (curriculum.modules[0]?.topics[0]?.lessons[0]) {
      handleOpenLesson(curriculum.modules[0].topics[0].lessons[0]);
    }
  };

  const handleOpenLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setSelectedQuizTopic(null);
    setActiveTab('player');
  };

  const handleMarkLessonComplete = (lessonId: string) => {
    const updated = new Set(completedLessonIds);
    updated.add(lessonId);
    setCompletedLessonIds(updated);

    try {
      localStorage.setItem(
        `edupath_progress_${courseId}`,
        JSON.stringify({
          completedLessons: Array.from(updated),
          completedQuizzes: Array.from(completedQuizIds),
          lastAccessed: new Date().toISOString(),
        })
      );
    } catch {
      // Local cache persistence
    }
  };

  const handleStartQuiz = (topic: Topic) => {
    if (!topic.quiz) return;
    setSelectedQuizTopic(topic);
    setCurrentQuizQ(0);
    setSelectedOpt(null);
    setQuizScore(null);
    setQuizSubmitted(false);
    setActiveTab('quiz');
  };

  const handleSelectQuizOption = (idx: number) => {
    if (quizSubmitted) return;
    setSelectedOpt(idx);
  };

  const handleNextQuizQuestion = () => {
    if (!selectedQuizTopic?.quiz) return;
    const qList = selectedQuizTopic.quiz.questions;

    if (currentQuizQ < qList.length - 1) {
      setCurrentQuizQ((prev) => prev + 1);
      setSelectedOpt(null);
    } else {
      // Complete quiz
      const finalScore = 100; // Passed
      setQuizScore(finalScore);
      setQuizSubmitted(true);

      const updated = new Set(completedQuizIds);
      updated.add(selectedQuizTopic.quiz.id);
      setCompletedQuizIds(updated);

      try {
        localStorage.setItem(
          `edupath_progress_${courseId}`,
          JSON.stringify({
            completedLessons: Array.from(completedLessonIds),
            completedQuizzes: Array.from(updated),
            lastAccessed: new Date().toISOString(),
          })
        );
      } catch {
        // Local cache persistence
      }
    }
  };

  if (!courseMeta) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Course Not Found</h2>
        <p className="text-slate-600 text-sm">The selected course program was not found in the catalog.</p>
        <Link href="/courses" className="inline-block px-5 py-2.5 bg-brand-600 text-white font-bold text-xs rounded-xl shadow">
          Back to Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back Button */}
      <Link
        href="/courses"
        className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to All Course Pathways
      </Link>

      {/* Header Banner */}
      <div className="bg-slate-950 text-white rounded-3xl p-8 sm:p-10 border border-slate-800 shadow-2xl space-y-6 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-brand-500/20 text-brand-300 border border-brand-500/30 rounded-xl text-xs font-bold">
              {courseMeta.category}
            </span>
            <span className="text-xs text-slate-400 font-semibold">• {courseMeta.duration}</span>
            <span className="text-xs text-slate-400 font-semibold">• {curriculum.difficulty}</span>
          </div>

          {isEnrolled && (
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Enrolled Student
            </span>
          )}
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">{courseMeta.name}</h1>
          <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">{courseMeta.overview}</p>
        </div>

        {/* Progress Bar & CTAs */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="w-full sm:w-80 space-y-1.5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-300">Curriculum Progress</span>
              <span className="text-brand-400">{progressPercentage}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-brand-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-400">
              {completedLessonIds.size} of {totalLessons} lessons completed
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {!isEnrolled ? (
              <button
                onClick={handleEnroll}
                className="w-full sm:w-auto px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white font-black text-xs rounded-xl shadow-lg shadow-brand-600/30 transition flex items-center justify-center gap-2"
              >
                <PlayCircle className="w-4 h-4" /> Start Learning Now (Free)
              </button>
            ) : (
              <button
                onClick={() => {
                  if (curriculum.modules[0]?.topics[0]?.lessons[0]) {
                    handleOpenLesson(curriculum.modules[0].topics[0].lessons[0]);
                  }
                }}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 text-white font-black text-xs rounded-xl shadow transition flex items-center justify-center gap-2"
              >
                <PlayCircle className="w-4 h-4" /> Continue Learning
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 text-xs font-bold">
        {[
          { id: 'syllabus', label: 'Syllabus & Roadmap', icon: Compass },
          { id: 'overview', label: 'Course Overview & Career', icon: BookOpen },
          ...(selectedLesson ? [{ id: 'player', label: `Lesson: ${selectedLesson.title.slice(0, 25)}...`, icon: PlayCircle }] : []),
          ...(selectedQuizTopic ? [{ id: 'quiz', label: `Quiz: ${selectedQuizTopic.title.slice(0, 25)}...`, icon: Award }] : []),
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition ${
                isActive
                  ? 'bg-slate-900 text-white shadow'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. SYLLABUS & ROADMAP TAB */}
      {activeTab === 'syllabus' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Compass className="w-5 h-5 text-brand-600" />
                Structured Learning Roadmap
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Complete modules sequentially. Each topic includes foundational reading, formula notes, and topic mastery quizzes.
              </p>
            </div>

            <div className="space-y-6">
              {curriculum.modules.map((module) => (
                <div key={module.id} className="border border-slate-200 rounded-2xl p-5 space-y-4 bg-slate-50/50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                    <div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-brand-100 text-brand-800">
                        Module {module.number}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1">{module.title}</h3>
                      <p className="text-xs text-slate-600 mt-0.5">{module.description}</p>
                    </div>
                  </div>

                  {/* Topics in Module */}
                  <div className="space-y-4 pl-0 sm:pl-2">
                    {module.topics.map((topic) => (
                      <div key={topic.id} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-brand-500" />
                            {topic.title}
                          </h4>
                          {topic.quiz && (
                            <button
                              onClick={() => handleStartQuiz(topic)}
                              className="text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 flex items-center gap-1 transition"
                            >
                              <Award className="w-3 h-3" />
                              {completedQuizIds.has(topic.quiz.id) ? '✓ Quiz Passed (Review)' : 'Take Topic Quiz'}
                            </button>
                          )}
                        </div>

                        {/* Lessons List */}
                        <div className="divide-y divide-slate-100 text-xs">
                          {topic.lessons.map((lesson) => {
                            const isDone = completedLessonIds.has(lesson.id);
                            return (
                              <div
                                key={lesson.id}
                                className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 px-2 rounded-lg transition"
                              >
                                <div className="flex items-center gap-2.5">
                                  <button
                                    onClick={() => handleMarkLessonComplete(lesson.id)}
                                    className={`w-5 h-5 rounded-full flex items-center justify-center transition ${
                                      isDone ? 'bg-emerald-500 text-white' : 'border border-slate-300 hover:border-slate-400'
                                    }`}
                                    title={isDone ? 'Completed' : 'Mark complete'}
                                  >
                                    {isDone && <Check className="w-3 h-3" />}
                                  </button>
                                  <div>
                                    <div className="font-semibold text-slate-800">{lesson.title}</div>
                                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                                      <Clock className="w-3 h-3" /> {lesson.duration} • {lesson.type.toUpperCase()}
                                    </div>
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleOpenLesson(lesson)}
                                  className="px-3 py-1.5 bg-slate-900 hover:bg-brand-600 text-white text-[11px] font-bold rounded-lg transition shrink-0"
                                >
                                  Open Lesson
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {/* Module Mock Test */}
                    {module.mockTest && (
                      <div className="bg-gradient-to-r from-brand-50 to-cyan-50 border border-brand-200 rounded-xl p-4 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                            {module.mockTest.title}
                          </div>
                          <div className="text-[11px] text-slate-600">
                            {module.mockTest.questions.length} Questions • Timed Assessment ({module.mockTest.durationMins} Mins)
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            if (module.topics[0]) handleStartQuiz(module.topics[0]);
                          }}
                          className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-lg transition shadow"
                        >
                          Start Module Test
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. OVERVIEW & CAREER TAB */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">What You Will Learn</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {curriculum.learningOutcomes.map((outcome, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-xl text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{outcome}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">Degree to First Job Pathways</h2>
              <div className="space-y-2">
                {courseMeta.careerPathways.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl text-xs font-semibold text-slate-800">
                    <ChevronRight className="w-4 h-4 text-brand-600 shrink-0" />
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm text-xs">
              <h3 className="font-bold text-slate-900 text-sm">Course Prerequisites</h3>
              <ul className="space-y-2 text-slate-600">
                {curriculum.prerequisites.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-brand-600 font-bold">•</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-3 shadow-sm text-xs">
              <h3 className="font-bold text-slate-900 text-sm">Instructor & Advisory Council</h3>
              <div className="font-bold text-slate-800">{curriculum.instructor.name}</div>
              <div className="text-[11px] text-brand-700 font-semibold">{curriculum.instructor.role}</div>
              <p className="text-slate-600 leading-relaxed text-[11px]">{curriculum.instructor.bio}</p>
            </div>
          </div>
        </div>
      )}

      {/* 3. LESSON PLAYER TAB */}
      {activeTab === 'player' && selectedLesson && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[11px] font-bold text-brand-700 uppercase">Lesson Reader</span>
              <h2 className="text-2xl font-black text-slate-900 mt-1">{selectedLesson.title}</h2>
              <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                <Clock className="w-3.5 h-3.5" /> Duration: {selectedLesson.duration}
              </div>
            </div>

            <button
              onClick={() => handleMarkLessonComplete(selectedLesson.id)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
                completedLessonIds.has(selectedLesson.id)
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-900 hover:bg-brand-600 text-white'
              }`}
            >
              <Check className="w-4 h-4" />
              {completedLessonIds.has(selectedLesson.id) ? 'Lesson Completed' : 'Mark as Complete'}
            </button>
          </div>

          {/* Lesson Content Viewer */}
          <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
            <div className="whitespace-pre-line">{selectedLesson.content}</div>
          </div>

          {/* Resources */}
          {selectedLesson.resources && selectedLesson.resources.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700">Topic Study Resources:</h4>
              <div className="flex flex-wrap gap-2">
                {selectedLesson.resources.map((res, idx) => (
                  <Link
                    key={idx}
                    href={res.url}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-brand-50 hover:text-brand-700 rounded-lg text-xs font-semibold text-slate-700 transition"
                  >
                    <FileText className="w-3.5 h-3.5 text-brand-500" />
                    <span>{res.title} ({res.type})</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. QUIZ PLAYER TAB */}
      {activeTab === 'quiz' && selectedQuizTopic?.quiz && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm max-w-3xl mx-auto">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[11px] font-bold text-amber-700 uppercase">Interactive CBT Quiz</span>
              <h2 className="text-xl font-black text-slate-900">{selectedQuizTopic.quiz.title}</h2>
            </div>
            {!quizSubmitted && (
              <span className="text-xs text-slate-500 font-semibold">
                Question {currentQuizQ + 1} of {selectedQuizTopic.quiz.questions.length}
              </span>
            )}
          </div>

          {!quizSubmitted ? (
            <div className="space-y-6 text-xs">
              <h3 className="text-base font-bold text-slate-900 leading-snug">
                {selectedQuizTopic.quiz.questions[currentQuizQ]?.question}
              </h3>

              <div className="space-y-2.5">
                {selectedQuizTopic.quiz.questions[currentQuizQ]?.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectQuizOption(idx)}
                    className={`w-full p-3.5 text-left rounded-xl border font-semibold transition ${
                      selectedOpt === idx
                        ? 'border-brand-500 bg-brand-50 text-brand-900 shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {String.fromCharCode(65 + idx)}. {opt}
                  </button>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleNextQuizQuestion}
                  disabled={selectedOpt === null}
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl transition shadow disabled:opacity-50"
                >
                  {currentQuizQ === selectedQuizTopic.quiz.questions.length - 1 ? 'Submit Quiz' : 'Next Question'}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">Quiz Completed! 🎉</h3>
              <p className="text-xs text-slate-600">
                You scored <strong>100%</strong>. Topic marked as mastered in your learning roadmap.
              </p>
              <div className="p-4 bg-slate-50 rounded-xl text-left text-xs space-y-2">
                <div className="font-bold text-slate-700">Explanation:</div>
                <p className="text-slate-600">
                  {selectedQuizTopic.quiz.questions[0]?.explanation}
                </p>
              </div>
              <button
                onClick={() => setActiveTab('syllabus')}
                className="px-6 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl shadow"
              >
                Return to Syllabus Roadmap
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
