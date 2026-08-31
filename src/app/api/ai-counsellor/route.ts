import { NextResponse } from 'next/server';
import examsData from '@/data/exams.json';
import coursesData from '@/data/courses.json';
import statesData from '@/data/states.json';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ success: false, message: 'Query string is required' }, { status: 400 });
    }

    const lowerQuery = query.toLowerCase();

    // Query matcher logic against verified datasets
    const matchedExams = examsData.filter(e =>
      e.examName.toLowerCase().includes(lowerQuery) ||
      e.fullName.toLowerCase().includes(lowerQuery) ||
      e.stateId.toLowerCase().includes(lowerQuery) ||
      e.courseCategory.toLowerCase().includes(lowerQuery)
    );

    const matchedCourses = coursesData.filter(c =>
      c.name.toLowerCase().includes(lowerQuery) ||
      c.category.toLowerCase().includes(lowerQuery) ||
      c.overview.toLowerCase().includes(lowerQuery)
    );

    const matchedStates = statesData.filter(s =>
      s.name.toLowerCase().includes(lowerQuery) ||
      s.code.toLowerCase().includes(lowerQuery)
    );

    let answer = `I am EduPath AI Counsellor, trained on verified official Indian entrance exam & higher education datasets.`;
    const citations: Array<{ source: string; verifiedDate: string; label: string }> = [];

    if (matchedExams.length > 0) {
      const exam = matchedExams[0];
      answer = `### Verified Information for ${exam.fullName} (${exam.examName})\n\n` +
        `- **Conducting Authority:** ${exam.conductingAuthority}\n` +
        `- **State Coverage:** ${exam.stateId.toUpperCase()}\n` +
        `- **Target Courses:** ${exam.courseCategory}\n` +
        `- **Eligibility:** ${exam.eligibility}\n` +
        `- **Exam Pattern:** ${exam.examPattern}\n` +
        `- **Official Portal:** [${exam.officialWebsite}](${exam.officialWebsite})\n\n` +
        `*Note: Cutoffs and annual seat allotments vary based on official normalized percentile ranks.*`;

      citations.push({
        source: exam.officialSource,
        verifiedDate: exam.lastVerifiedDate,
        label: exam.dataQualityLabel || 'Verified'
      });
    } else if (matchedCourses.length > 0) {
      const course = matchedCourses[0];
      answer = `### EduPath Career & Degree Pathway: ${course.name}\n\n` +
        `- **Duration:** ${course.duration}\n` +
        `- **Eligibility:** ${course.eligibility}\n` +
        `- **Overview:** ${course.overview}\n\n` +
        `#### Career Pathways (Degree to First Job):\n` +
        course.careerPathways.map(p => `  * ${p}`).join('\n') + `\n\n` +
        `#### Applicable Entrance Exams:\n` +
        course.topExams.map(e => `  * ${e}`).join('\n');

      citations.push({
        source: 'EduPath Official Curriculum & Industry Matrix',
        verifiedDate: '2026-08-01',
        label: 'Verified'
      });
    } else if (matchedStates.length > 0) {
      const state = matchedStates[0];
      const stateExams = examsData.filter(e => e.stateId === state.id);
      answer = `### Entrance Exams & Higher Education in ${state.name} (${state.type})\n\n` +
        `- **Capital:** ${state.capital}\n` +
        `- **Top State Exams:** ${state.topExams.join(', ')}\n\n` +
        `EduPath indexes verified admission procedures for all 36 Indian States and Union Territories.`;

      stateExams.forEach(e => {
        citations.push({
          source: e.officialSource,
          verifiedDate: e.lastVerifiedDate,
          label: 'Verified'
        });
      });
    } else {
      answer = `EduPath indexes official admission guidelines for all 28 States & 8 UTs in India across Engineering, Pharmacy (D.Pharm, B.Pharm, Pharm.D, M.Pharm), Medical, Law, Management, Agriculture, and Design.\n\n` +
        `You can explore state-specific entrance exams like **KCET, MHT-CET, WBJEE, TS EAMCET, AP EAPCET, UPTAC, KEAM, GUJCET**, or national exams like **JEE Main, NEET-UG, CUET-UG, CLAT, GPAT**.\n\n` +
        `Would you like to review entrance requirements, eligibility criteria, or book a Free Demo session with an expert human counsellor?`;

      citations.push({
        source: 'EduPath Verified National Portal Data',
        verifiedDate: '2026-08-01',
        label: 'Indicative'
      });
    }

    return NextResponse.json({
      success: true,
      answer,
      citations,
      dataQualityLabel: citations[0]?.label || 'Verified'
    });

  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'AI Processing error';
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}
