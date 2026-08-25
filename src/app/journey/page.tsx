'use client';

import React, { useMemo, useState } from 'react';
import {
  Route,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  GraduationCap,
  MapPin,
  Target,
  Brain,
  Briefcase,
  Code2,
  HeartPulse,
  Palette,
  Building2,
} from 'lucide-react';

import DemoModal from '@/components/DemoModal';
import roadmapsData from '@/data/roadmaps.json';

type Stage =
  | 'class10'
  | 'class11'
  | 'class12'
  | 'after12';

type Interest =
  | 'technology'
  | 'engineering'
  | 'medical'
  | 'business'
  | 'design'
  | 'law'
  | 'not-sure';

type Goal =
  | 'job'
  | 'higher-education'
  | 'government'
  | 'entrepreneurship'
  | 'not-sure';

interface StudentSelection {
  stage: Stage | '';
  interest: Interest | '';
  state: string;
  goal: Goal | '';
}

const stages = [
  {
    id: 'class10' as Stage,
    title: 'Class 10',
    description:
      'I am studying in Class 10 and want to understand my future options.',
    icon: GraduationCap,
  },
  {
    id: 'class11' as Stage,
    title: 'Class 11',
    description:
      'I have started Class 11 and want to plan my academic and career path.',
    icon: GraduationCap,
  },
  {
    id: 'class12' as Stage,
    title: 'Class 12',
    description:
      'I am preparing for entrance exams, college and career decisions.',
    icon: Target,
  },
  {
    id: 'after12' as Stage,
    title: 'After 12th',
    description:
      'I have completed Class 12 and want to choose my course or career.',
    icon: Briefcase,
  },
];

const interests = [
  {
    id: 'technology' as Interest,
    title: 'Technology & Coding',
    description:
      'Software, AI, data, cybersecurity, cloud and technology.',
    icon: Code2,
  },
  {
    id: 'engineering' as Interest,
    title: 'Engineering',
    description:
      'CSE, ECE, Mechanical, Civil, Electrical and other engineering fields.',
    icon: Building2,
  },
  {
    id: 'medical' as Interest,
    title: 'Medical & Life Sciences',
    description:
      'Medicine, pharmacy, biotechnology, nursing and healthcare.',
    icon: HeartPulse,
  },
  {
    id: 'business' as Interest,
    title: 'Business & Finance',
    description:
      'Management, commerce, finance, entrepreneurship and business.',
    icon: Briefcase,
  },
  {
    id: 'design' as Interest,
    title: 'Design & Creativity',
    description:
      'UI/UX, architecture, animation, media and creative careers.',
    icon: Palette,
  },
  {
    id: 'law' as Interest,
    title: 'Law & Public Services',
    description:
      'Law, civil services, government careers and public administration.',
    icon: Building2,
  },
  {
    id: 'not-sure' as Interest,
    title: "I'm Not Sure",
    description:
      'Help me discover suitable careers based on my interests and strengths.',
    icon: Brain,
  },
];

const goals = [
  {
    id: 'job' as Goal,
    title: 'Get a Good Job',
    description:
      'Build skills, projects, internships and interview preparation.',
  },
  {
    id: 'higher-education' as Goal,
    title: 'Higher Education',
    description:
      'Plan degrees, entrance exams, colleges and specialization.',
  },
  {
    id: 'government' as Goal,
    title: 'Government Career',
    description:
      'Explore government exams and public-sector career pathways.',
  },
  {
    id: 'entrepreneurship' as Goal,
    title: 'Start a Business',
    description:
      'Build business, technology and entrepreneurship skills.',
  },
  {
    id: 'not-sure' as Goal,
    title: 'I Need Guidance',
    description:
      'Let EduPath help me identify the right career direction.',
  },
];

const states = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Jammu & Kashmir',
  'Ladakh',
  'Puducherry',
  'Chandigarh',
];

function getPersonalizedTitle(selection: StudentSelection) {
  if (selection.interest === 'technology') {
    return 'Technology & Software Career Roadmap';
  }

  if (selection.interest === 'engineering') {
    return 'Engineering Career Roadmap';
  }

  if (selection.interest === 'medical') {
    return 'Medical & Life Sciences Roadmap';
  }

  if (selection.interest === 'business') {
    return 'Business & Finance Career Roadmap';
  }

  if (selection.interest === 'design') {
    return 'Design & Creative Career Roadmap';
  }

  if (selection.interest === 'law') {
    return 'Law & Public Service Roadmap';
  }

  return 'Your Personalized Career Roadmap';
}

function getStepDescription(
  originalDescription: string,
  index: number,
  selection: StudentSelection
) {
  if (!selection.interest) {
    return originalDescription;
  }

  if (index === 0) {
    return `Start from your current stage (${selection.stage}) and build a strong academic foundation.`;
  }

  if (index === 1) {
    return `Explore ${selection.interest} careers and understand which paths match your interests and strengths.`;
  }

  if (index === 2) {
    return `Plan the relevant subjects, entrance exams and preparation strategy for ${selection.state || 'your state'}.`;
  }

  if (index === 3) {
    return `Shortlist courses and colleges that match your selected career direction.`;
  }

  if (index >= 8 && index <= 11) {
    return `Build practical ${selection.interest} skills through structured learning, projects and real-world practice.`;
  }

  if (index >= 12) {
    return `Prepare for internships, resume building, interviews and your first professional opportunity.`;
  }

  return originalDescription;
}

export default function JourneyPage() {
  const [step, setStep] = useState(1);

  const [selection, setSelection] =
    useState<StudentSelection>({
      stage: '',
      interest: '',
      state: '',
      goal: '',
    });

  const [isDemoOpen, setIsDemoOpen] =
    useState(false);

  const canContinue = useMemo(() => {
    if (step === 1) {
      return Boolean(selection.stage);
    }

    if (step === 2) {
      return Boolean(selection.interest);
    }

    if (step === 3) {
      return Boolean(selection.state);
    }

    if (step === 4) {
      return Boolean(selection.goal);
    }

    return true;
  }, [step, selection]);

  const handleContinue = () => {
    if (!canContinue) return;

    if (step < 5) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const saveRoadmap = () => {
    try {
      localStorage.setItem(
        'edupath_student_selection',
        JSON.stringify(selection)
      );
    } catch (error) {
      console.error(
        'Unable to save student roadmap',
        error
      );
    }
  };

  const restart = () => {
    setSelection({
      stage: '',
      interest: '',
      state: '',
      goal: '',
    });

    setStep(1);
  };

  const personalizedTitle =
    getPersonalizedTitle(selection);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">

      {/* Header */}
      <div className="space-y-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
          <Route className="w-3.5 h-3.5 text-emerald-600" />
          <span>
            10th → First Job • Personalized Career Journey
          </span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          Build Your Journey From 10th to Your First Job
        </h1>

        <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
          Tell EduPath where you are today, what interests you
          and what you want to achieve. We will show the most
          relevant courses, exams, colleges, skills and career
          roadmap for you.
        </p>
      </div>

      {/* Progress */}
      {step < 5 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-700">
              Step {step} of 4
            </span>

            <span className="text-xs text-slate-500">
              {Math.round((step / 4) * 100)}% complete
            </span>
          </div>

          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-600 transition-all duration-300"
              style={{
                width: `${(step / 4) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* STEP 1 */}
      {step === 1 && (
        <section className="space-y-5">
          <div>
            <h2 className="text-2xl font-black text-slate-900">
              Where are you currently?
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Your answer determines the starting point of your
              roadmap.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stages.map((item) => {
              const Icon = item.icon;

              const selected =
                selection.stage === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    setSelection((prev) => ({
                      ...prev,
                      stage: item.id,
                    }))
                  }
                  className={`text-left p-6 rounded-2xl border-2 transition ${
                    selected
                      ? 'border-brand-500 bg-brand-50 shadow-md'
                      : 'border-slate-200 bg-white hover:border-brand-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                        selected
                          ? 'bg-brand-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900">
                        {item.title}
                      </h3>

                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {selected && (
                      <CheckCircle2 className="w-5 h-5 text-brand-600 shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <section className="space-y-5">
          <div>
            <h2 className="text-2xl font-black text-slate-900">
              What interests you?
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Select the area you are most interested in.
              You can choose guidance if you are unsure.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {interests.map((item) => {
              const Icon = item.icon;

              const selected =
                selection.interest === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    setSelection((prev) => ({
                      ...prev,
                      interest: item.id,
                    }))
                  }
                  className={`text-left p-5 rounded-2xl border-2 transition ${
                    selected
                      ? 'border-brand-500 bg-brand-50 shadow-md'
                      : 'border-slate-200 bg-white hover:border-brand-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        selected
                          ? 'bg-brand-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    {selected && (
                      <CheckCircle2 className="w-5 h-5 text-brand-600" />
                    )}
                  </div>

                  <h3 className="font-bold text-slate-900 mt-4">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <section className="max-w-2xl space-y-5">
          <div>
            <h2 className="text-2xl font-black text-slate-900">
              Select your state
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              This helps us recommend state-specific entrance
              exams, colleges and opportunities.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <label
              htmlFor="state"
              className="block text-sm font-bold text-slate-700 mb-2"
            >
              Your State / Union Territory
            </label>

            <div className="relative">
              <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />

              <select
                id="state"
                value={selection.state}
                onChange={(event) =>
                  setSelection((prev) => ({
                    ...prev,
                    state: event.target.value,
                  }))
                }
                className="w-full appearance-none pl-11 pr-4 py-3 border border-slate-300 rounded-xl text-sm bg-white outline-none focus:border-brand-500"
              >
                <option value="">
                  Select your state
                </option>

                {states.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>

            {selection.state && (
              <div className="mt-4 p-4 rounded-xl bg-brand-50 border border-brand-100 text-xs text-brand-800">
                <strong>{selection.state}</strong> will be
                used to personalize your entrance exams,
                college recommendations and admission guidance.
              </div>
            )}
          </div>
        </section>
      )}

      {/* STEP 4 */}
      {step === 4 && (
        <section className="space-y-5">
          <div>
            <h2 className="text-2xl font-black text-slate-900">
              What is your main goal?
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              This helps us prioritize the right roadmap for you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map((item) => {
              const selected =
                selection.goal === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    setSelection((prev) => ({
                      ...prev,
                      goal: item.id,
                    }))
                  }
                  className={`text-left p-6 rounded-2xl border-2 transition ${
                    selected
                      ? 'border-brand-500 bg-brand-50 shadow-md'
                      : 'border-slate-200 bg-white hover:border-brand-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">
                      {item.title}
                    </h3>

                    {selected && (
                      <CheckCircle2 className="w-5 h-5 text-brand-600" />
                    )}
                  </div>

                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {item.description}
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* STEP 5 - RESULT */}
      {step === 5 && (
        <section className="space-y-8">
          <div className="bg-gradient-to-r from-slate-950 via-brand-950 to-slate-950 text-white rounded-3xl p-7 sm:p-10 shadow-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-400/30 text-brand-200 text-xs font-bold">
              <Sparkles className="w-4 h-4" />
              Personalized EduPath
            </div>

            <h2 className="text-2xl sm:text-4xl font-black mt-4">
              {personalizedTitle}
            </h2>

            <p className="text-sm text-slate-300 mt-3 max-w-3xl">
              Your roadmap starts from{' '}
              <strong className="text-white">
                {selection.stage}
              </strong>{' '}
              and is personalized for{' '}
              <strong className="text-white">
                {selection.state}
              </strong>
              .
            </p>
          </div>

          {/* Selection summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="text-xs text-slate-400 font-bold uppercase">
                Current Stage
              </div>

              <div className="font-bold text-slate-900 mt-2">
                {selection.stage}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="text-xs text-slate-400 font-bold uppercase">
                Interest
              </div>

              <div className="font-bold text-slate-900 mt-2 capitalize">
                {selection.interest?.replace(
                  '-',
                  ' '
                )}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="text-xs text-slate-400 font-bold uppercase">
                State
              </div>

              <div className="font-bold text-slate-900 mt-2">
                {selection.state}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="text-xs text-slate-400 font-bold uppercase">
                Goal
              </div>

              <div className="font-bold text-slate-900 mt-2 capitalize">
                {selection.goal?.replace(
                  '-',
                  ' '
                )}
              </div>
            </div>
          </div>

          {/* Roadmap */}
          <div className="relative border-l-2 border-brand-200 ml-4 sm:ml-8 space-y-8 py-4">
            {roadmapsData.map((roadmapStep, index) => (
              <div
                key={roadmapStep.step}
                className="relative pl-6 sm:pl-10 group"
              >
                <div className="absolute -left-[17px] top-0 w-8 h-8 rounded-full bg-white border-2 border-brand-500 text-brand-600 font-extrabold text-xs flex items-center justify-center shadow-md group-hover:bg-brand-600 group-hover:text-white transition">
                  {roadmapStep.step}
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-brand-400 hover:shadow-md transition space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold text-[11px] rounded-md uppercase">
                      Step {roadmapStep.step}
                    </span>

                    <span className="text-xs font-bold text-brand-600">
                      {roadmapStep.stage}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">
                    {roadmapStep.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {getStepDescription(
                      roadmapStep.description,
                      index,
                      selection
                    )}
                  </p>

                  <div>
                    <div className="text-[11px] font-bold text-slate-700 uppercase mb-2">
                      Recommended Action
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {roadmapStep.actionables.map(
                        (action, actionIndex) => (
                          <div
                            key={actionIndex}
                            className="flex items-center text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mr-1.5 shrink-0" />

                            <span>
                              {action}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Next actions */}
          <div className="bg-white border border-slate-200 rounded-3xl p-7 shadow-sm">
            <h2 className="text-xl font-black text-slate-900">
              Your Next Steps
            </h2>

            <p className="text-sm text-slate-500 mt-2">
              Save your roadmap and continue with EduPath.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <button
                type="button"
                onClick={saveRoadmap}
                className="p-5 rounded-2xl bg-brand-50 border border-brand-100 text-left hover:border-brand-300 transition"
              >
                <Target className="w-6 h-6 text-brand-600" />

                <div className="font-bold text-slate-900 mt-3">
                  Save My Roadmap
                </div>

                <p className="text-xs text-slate-500 mt-1">
                  Keep your personalized selections for your
                  student dashboard.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setIsDemoOpen(true)}
                className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100 text-left hover:border-emerald-300 transition"
              >
                <Sparkles className="w-6 h-6 text-emerald-600" />

                <div className="font-bold text-slate-900 mt-3">
                  Book Free Demo
                </div>

                <p className="text-xs text-slate-500 mt-1">
                  Discuss your roadmap with an EduPath counsellor.
                </p>
              </button>

              <button
                type="button"
                onClick={restart}
                className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left hover:border-slate-300 transition"
              >
                <ArrowLeft className="w-6 h-6 text-slate-600" />

                <div className="font-bold text-slate-900 mt-3">
                  Change Selection
                </div>

                <p className="text-xs text-slate-500 mt-1">
                  Start again and explore another career path.
                </p>
              </button>
            </div>
          </div>

          {/* Demo CTA */}
          <div className="bg-slate-900 text-white rounded-3xl p-8 text-center space-y-4">
            <h2 className="text-2xl font-bold">
              Want a Counsellor to Review Your Roadmap?
            </h2>

            <p className="text-xs text-slate-300 max-w-lg mx-auto">
              Book a free EduPath demo and get guidance based on
              your current stage, interests, state and career goal.
            </p>

            <button
              onClick={() => setIsDemoOpen(true)}
              className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl transition"
            >
              <Sparkles className="w-4 h-4 inline mr-1" />
              Book Free Demo
            </button>
          </div>
        </section>
      )}

      {/* Navigation */}
      {step < 5 && (
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 1}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <button
            type="button"
            onClick={handleContinue}
            disabled={!canContinue}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-700 transition shadow"
          >
            {step === 4
              ? 'Build My Roadmap'
              : 'Continue'}

            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <DemoModal
        isOpen={isDemoOpen}
        onClose={() => setIsDemoOpen(false)}
      />
    </div>
  );
}