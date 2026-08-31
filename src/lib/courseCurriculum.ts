export type LessonKind = 'lesson' | 'practice' | 'quiz' | 'mock' | 'project';

export type CurriculumLesson = {
  id: string;
  title: string;
  kind: LessonKind;
  description: string;
};

export type CurriculumTopic = {
  id: string;
  title: string;
  lessons: CurriculumLesson[];
};

export type CurriculumModule = {
  id: string;
  title: string;
  level: 'Foundation' | 'Intermediate' | 'Advanced' | 'Professional';
  topics: CurriculumTopic[];
};

export type CourseCurriculum = {
  courseId: string;
  modules: CurriculumModule[];
};

const SPECIAL_TOPICS: Record<string, string[]> = {
  'dsa-mastery': ['Programming Fundamentals', 'Complexity Analysis', 'Arrays', 'Strings', 'Linked Lists', 'Stacks', 'Queues', 'Hashing', 'Recursion', 'Searching', 'Sorting', 'Binary Search', 'Trees', 'Binary Search Trees', 'Heaps', 'Graphs', 'Greedy Algorithms', 'Backtracking', 'Dynamic Programming', 'Advanced Graph Algorithms', 'String Algorithms', 'Interview Patterns', 'Competitive Programming'],
  'devops-engineering': ['Linux Fundamentals', 'Files, Permissions & Users', 'Processes & Services', 'Networking Fundamentals', 'Git & GitHub', 'Branching & Collaboration', 'Bash Automation', 'Python for Operations', 'Docker Fundamentals', 'Docker Networking & Volumes', 'Docker Compose', 'CI/CD Fundamentals', 'GitHub Actions', 'Jenkins', 'AWS Compute & Storage', 'AWS Networking & IAM', 'Terraform', 'Ansible', 'Kubernetes Fundamentals', 'Kubernetes Networking', 'Helm', 'Prometheus', 'Grafana', 'Logging & Observability', 'GitOps & Argo CD', 'Production Troubleshooting', 'Capstone Project'],
  'devsecops-engineering': ['Security Fundamentals', 'Linux Security', 'Secure Git', 'Secure Coding', 'SAST', 'SCA & Dependencies', 'Secret Scanning', 'DAST & API Security', 'Container Security', 'Trivy & Image Scanning', 'Docker Security', 'Kubernetes Security', 'RBAC', 'IaC Security', 'Terraform Security', 'Cloud Security', 'IAM', 'CI/CD Security', 'SBOM', 'Supply Chain Security', 'Runtime Security', 'Detection & Response', 'DevSecOps Pipeline', 'Capstone Project'],
  'full-stack-web': ['Web Fundamentals', 'HTML & CSS', 'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 'Express APIs', 'REST & Authentication', 'SQL & PostgreSQL', 'MongoDB', 'Testing', 'Git & GitHub', 'Docker', 'CI/CD', 'Cloud Deployment', 'Performance', 'Application Security', 'Production Project', 'Interview Preparation'],
  'cloud-architecture': ['Cloud Concepts', 'Linux & Networking', 'Compute', 'Storage', 'Databases', 'VPC & Networking', 'IAM', 'Observability', 'Auto Scaling', 'Serverless', 'Containers', 'Kubernetes', 'Infrastructure as Code', 'Terraform', 'High Availability', 'Disaster Recovery', 'Cloud Security', 'Cost Optimization', 'Architecture Case Studies', 'Capstone Project'],
  'cybersecurity-foundation': ['Security Principles', 'Networking', 'Linux', 'Cryptography', 'Web Security', 'Identity & Access', 'Vulnerability Management', 'SAST, SCA & DAST', 'SOC Fundamentals', 'SIEM Concepts', 'Incident Response', 'Threat Intelligence', 'Cloud Security', 'Container Security', 'Kubernetes Security', 'Secure Architecture', 'Security Automation', 'Defensive Project', 'Interview Preparation'],
  'ai-ml-engineering': ['Python for AI', 'Mathematics for ML', 'Statistics', 'Data Preparation', 'Regression', 'Classification', 'Clustering', 'Feature Engineering', 'Model Evaluation', 'Trees & Ensembles', 'Neural Networks', 'Deep Learning', 'NLP', 'Computer Vision', 'MLOps', 'Model Deployment', 'Responsible AI', 'AI Project', 'Interview Preparation'],
  'data-science': ['Python', 'SQL', 'Statistics', 'Data Cleaning', 'Exploratory Analysis', 'Visualization', 'Probability', 'Hypothesis Testing', 'Regression', 'Classification', 'Clustering', 'Feature Engineering', 'Machine Learning', 'Experimentation', 'Dashboards', 'Data Storytelling', 'Portfolio Project', 'Interview Preparation'],
};

const DOMAIN_TOPICS: Record<string, string[]> = {
  Engineering: ['Engineering Mathematics', 'Physics & Engineering Science', 'Core Engineering Foundations', 'Programming & Digital Tools', 'Branch Fundamentals', 'Laboratory & Practical Skills', 'Design & Analysis', 'Industry Tools', 'Mini Project', 'Internship Preparation', 'Aptitude', 'Technical Interview', 'Professional Communication', 'Capstone Project'],
  Pharmacy: ['Pharmaceutical Chemistry', 'Pharmaceutics', 'Pharmacology', 'Pharmacognosy', 'Biochemistry', 'Microbiology', 'Industrial Pharmacy', 'Quality Assurance', 'Regulatory Affairs', 'Clinical Research', 'Pharmacovigilance', 'Hospital Practice', 'Career Preparation'],
  Medical: ['Biology Foundation', 'Anatomy', 'Physiology', 'Biochemistry', 'Pathology', 'Pharmacology', 'Microbiology', 'Clinical Foundations', 'Community Medicine', 'Diagnostics', 'Clinical Practice', 'Research Skills', 'Professional Development'],
  Law: ['Legal Methods', 'Constitutional Law', 'Contract Law', 'Torts', 'Criminal Law', 'Family Law', 'Property Law', 'Corporate Law', 'Legal Research', 'Moot Court', 'Internship Skills', 'Career Preparation'],
  Management: ['Management Foundations', 'Accounting', 'Economics', 'Marketing', 'Operations', 'Finance', 'Business Analytics', 'Communication', 'Leadership', 'Internship', 'Projects', 'Placement Preparation'],
  Agriculture: ['Agriculture Foundations', 'Soil Science', 'Crop Science', 'Agronomy', 'Plant Protection', 'Horticulture', 'Irrigation', 'Agricultural Economics', 'Farm Management', 'Field Practice', 'Research', 'Career Preparation'],
  Science: ['Mathematics & Reasoning', 'Subject Foundations', 'Laboratory Skills', 'Data & Computing', 'Scientific Methods', 'Statistics', 'Research Methods', 'Project Work', 'Higher Studies', 'Career Preparation'],
  'Computer Science': ['Programming Foundations', 'Data Structures', 'Algorithms', 'Databases', 'Operating Systems', 'Computer Networks', 'Software Engineering', 'Web & Applications', 'Testing', 'Cloud & Deployment', 'Security', 'Projects', 'Interview Preparation'],
};

const lessonPack = (courseId: string, topicId: string, topic: string): CurriculumLesson[] => [
  { id: `${courseId}-${topicId}-lesson`, title: `${topic}: Core Lesson`, kind: 'lesson', description: `Learn the concepts, vocabulary, mental models, prerequisites and practical patterns for ${topic}.` },
  { id: `${courseId}-${topicId}-examples`, title: `${topic}: Worked Examples`, kind: 'lesson', description: `Study guided examples and real-world applications of ${topic}.` },
  { id: `${courseId}-${topicId}-practice`, title: `${topic}: Practice Lab`, kind: 'practice', description: `Apply the topic with progressively harder practice exercises.` },
  { id: `${courseId}-${topicId}-quiz`, title: `${topic}: Topic Quiz`, kind: 'quiz', description: `Check your understanding before unlocking the next topic.` },
];

export function getCourseCurriculum(course: { id: string; name: string; category: string }): CourseCurriculum {
  const topics = SPECIAL_TOPICS[course.id] || DOMAIN_TOPICS[course.category] || (
    /computer|software|data|web|it|developer|programming|cloud|cyber/i.test(course.name)
      ? DOMAIN_TOPICS['Computer Science']
      : DOMAIN_TOPICS.Science
  );
  const chunk = Math.max(3, Math.ceil(topics.length / 5));
  const modules: CurriculumModule[] = [];
  const levels: CurriculumModule['level'][] = ['Foundation', 'Intermediate', 'Advanced', 'Professional'];

  for (let i = 0; i < topics.length; i += chunk) {
    const slice = topics.slice(i, i + chunk);
    const moduleIndex = modules.length + 1;
    modules.push({
      id: `${course.id}-module-${moduleIndex}`,
      title: `Module ${moduleIndex} — ${slice[0]}`,
      level: levels[Math.min(modules.length, levels.length - 1)],
      topics: slice.map((topic, index) => {
        const topicId = `topic-${i + index + 1}`;
        return { id: `${course.id}-${topicId}`, title: topic, lessons: lessonPack(course.id, topicId, topic) };
      }),
    });
  }

  modules.push({
    id: `${course.id}-capstone`,
    title: 'Final Assessment, Mock Test & Capstone',
    level: 'Professional',
    topics: [{
      id: `${course.id}-final-topic`,
      title: 'Capstone & Final Assessment',
      lessons: [
        { id: `${course.id}-project`, title: 'Portfolio Capstone Project', kind: 'project', description: 'Build a portfolio-ready project demonstrating the major skills from this learning path.' },
        { id: `${course.id}-mock`, title: 'Comprehensive Final Mock Test', kind: 'mock', description: 'Complete a cumulative assessment covering the full curriculum.' },
      ],
    }],
  });

  return { courseId: course.id, modules };
}
