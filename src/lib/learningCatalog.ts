export type CurriculumLesson = {
  id: string;
  title: string;
  type: 'lesson' | 'practice' | 'quiz' | 'mock' | 'project';
  description: string;
};

export type CurriculumModule = {
  id: string;
  title: string;
  level: 'Foundation' | 'Intermediate' | 'Advanced' | 'Professional';
  topics: { id: string; title: string; lessons: CurriculumLesson[] }[];
};

export type CourseCurriculum = {
  courseId: string;
  learningPath: string[];
  modules: CurriculumModule[];
};

const lessonSet = (slug: string, topic: string, index: number) => [
  { id: `${slug}-${index}-concepts`, title: `${topic}: Core Concepts`, type: 'lesson' as const, description: `Learn the fundamentals, vocabulary, mental models and prerequisites for ${topic}.` },
  { id: `${slug}-${index}-examples`, title: `${topic}: Worked Examples`, type: 'lesson' as const, description: `Study guided examples and common patterns for ${topic}.` },
  { id: `${slug}-${index}-practice`, title: `${topic}: Practice Lab`, type: 'practice' as const, description: `Apply the ideas through graduated practice exercises.` },
  { id: `${slug}-${index}-quiz`, title: `${topic}: Topic Quiz`, type: 'quiz' as const, description: `Check topic understanding before moving to the next topic.` },
];

const moduleFromTopics = (courseId: string, index: number, title: string, level: CurriculumModule['level'], topics: string[]): CurriculumModule => ({
  id: `${courseId}-m${index + 1}`,
  title,
  level,
  topics: topics.map((topic, i) => ({
    id: `${courseId}-m${index + 1}-t${i + 1}`,
    title: topic,
    lessons: lessonSet(courseId, topic, i + 1),
  })),
});

const SPECIAL: Record<string, string[]> = {
  'dsa-mastery': ['Programming Refresher', 'Time & Space Complexity', 'Arrays', 'Strings', 'Linked Lists', 'Stacks & Queues', 'Hashing', 'Recursion', 'Sorting', 'Binary Search', 'Trees', 'BST', 'Heaps', 'Graphs', 'Greedy Algorithms', 'Backtracking', 'Dynamic Programming', 'Advanced Graphs', 'String Algorithms', 'Interview Patterns'],
  'devops-engineering': ['Linux Fundamentals', 'Linux Processes & Services', 'Networking Fundamentals', 'Git & GitHub', 'Bash & Automation', 'Python for Operations', 'Docker', 'Docker Networking & Volumes', 'Docker Compose', 'CI/CD Fundamentals', 'GitHub Actions', 'Jenkins', 'AWS Core Services', 'AWS Networking', 'Terraform', 'Ansible', 'Kubernetes Core', 'Kubernetes Networking', 'Helm', 'Observability', 'Prometheus & Grafana', 'GitOps with Argo CD', 'Production Troubleshooting', 'Capstone Project'],
  'devsecops-engineering': ['Security Foundations', 'Linux Security', 'Secure Git Workflows', 'Secure Coding', 'SAST', 'SCA & Dependency Security', 'Secret Scanning', 'DAST & API Security', 'Container Security', 'Trivy & Image Scanning', 'Docker Security', 'Kubernetes Security', 'RBAC', 'IaC Security', 'Terraform Security', 'Cloud Security', 'IAM', 'CI/CD Security', 'SBOM', 'Supply Chain Security', 'Runtime Security', 'Detection & Response', 'DevSecOps Pipeline Project', 'Capstone Project'],
  'full-stack-web': ['Web Fundamentals', 'HTML & CSS', 'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 'Express APIs', 'REST & Authentication', 'PostgreSQL & SQL', 'MongoDB', 'Testing', 'Git & GitHub', 'Docker', 'CI/CD', 'Cloud Deployment', 'Performance', 'Security', 'Production Project', 'Interview Preparation'],
  'cloud-architecture': ['Cloud Concepts', 'Linux & Networking', 'Compute', 'Storage', 'Databases', 'VPC & Networking', 'IAM', 'Observability', 'Auto Scaling', 'Serverless', 'Containers', 'Kubernetes', 'Infrastructure as Code', 'Terraform', 'High Availability', 'Disaster Recovery', 'Cloud Security', 'Cost Optimization', 'Architecture Case Studies', 'Capstone'],
  'cybersecurity-foundation': ['Security Principles', 'Networking', 'Linux', 'Cryptography', 'Web Security', 'Identity & Access', 'Vulnerability Management', 'SAST/SCA/DAST', 'SOC Fundamentals', 'SIEM Concepts', 'Incident Response', 'Threat Intelligence', 'Cloud Security', 'Container Security', 'Kubernetes Security', 'Secure Architecture', 'Security Automation', 'Defensive Project', 'Interview Preparation'],
  'ai-ml-engineering': ['Python for AI', 'Mathematics for ML', 'Statistics', 'Data Preparation', 'Regression', 'Classification', 'Clustering', 'Feature Engineering', 'Model Evaluation', 'Trees & Ensembles', 'Neural Networks', 'Deep Learning', 'NLP', 'Computer Vision', 'MLOps', 'Model Deployment', 'Responsible AI', 'AI Project', 'Interview Preparation'],
  'data-science': ['Python', 'SQL', 'Statistics', 'Data Cleaning', 'Exploratory Analysis', 'Visualization', 'Probability', 'Hypothesis Testing', 'Regression', 'Classification', 'Clustering', 'Feature Engineering', 'Machine Learning', 'Experimentation', 'Dashboards', 'Data Storytelling', 'Portfolio Project', 'Interview Preparation'],
};

const DOMAIN_DEFAULTS: Record<string, string[]> = {
  'Computer Science': ['Foundations', 'Programming', 'Data Structures', 'Databases', 'Operating Systems', 'Computer Networks', 'Software Engineering', 'Web/Applications', 'Testing', 'Cloud & Deployment', 'Security Basics', 'Projects', 'Interview Preparation'],
  'Engineering': ['Engineering Mathematics', 'Core Engineering Fundamentals', 'Programming & Tools', 'Branch Fundamentals', 'Laboratory Practice', 'Design & Analysis', 'Industry Tools', 'Projects', 'Internship Preparation', 'Aptitude', 'Technical Interviews', 'Career Preparation'],
  'Medical': ['Biology Foundation', 'Anatomy', 'Physiology', 'Biochemistry', 'Pathology', 'Pharmacology', 'Microbiology', 'Clinical Foundations', 'Community Health', 'Clinical Practice', 'Research Skills', 'Professional Development'],
  'Pharmacy': ['Pharmaceutical Chemistry', 'Pharmaceutics', 'Pharmacology', 'Pharmacognosy', 'Biochemistry', 'Microbiology', 'Industrial Pharmacy', 'Quality Assurance', 'Regulatory Affairs', 'Clinical Research', 'Pharmacovigilance', 'Career Preparation'],
  'Management': ['Management Foundations', 'Accounting', 'Economics', 'Marketing', 'Operations', 'Finance', 'Business Analytics', 'Communication', 'Leadership', 'Internships', 'Projects', 'Placement Preparation'],
  'Law': ['Legal Methods', 'Constitutional Law', 'Contract Law', 'Torts', 'Criminal Law', 'Family Law', 'Property Law', 'Corporate Law', 'Legal Research', 'Moot Court', 'Internships', 'Career Preparation'],
  'Agriculture': ['Agriculture Foundations', 'Soil Science', 'Crop Science', 'Plant Protection', 'Agronomy', 'Horticulture', 'Agricultural Economics', 'Irrigation', 'Farm Management', 'Field Practice', 'Research', 'Career Preparation'],
  'Science': ['Mathematics & Reasoning', 'Subject Fundamentals', 'Laboratory Skills', 'Data & Computing', 'Scientific Methods', 'Statistics', 'Research Methods', 'Projects', 'Higher Studies', 'Career Preparation'],
};

function topicsForCourse(courseId: string, category: string, name: string): string[] {
  const special = SPECIAL[courseId];
  if (special) return special;
  const exact = DOMAIN_DEFAULTS[category];
  if (exact) return exact;
  if (/CSE|Computer|Software|IT|Programming|Web|Developer/i.test(name)) return DOMAIN_DEFAULTS['Computer Science'];
  if (/Medical|MBBS|BDS/i.test(name)) return DOMAIN_DEFAULTS['Medical'];
  if (/Pharm/i.test(name)) return DOMAIN_DEFAULTS['Pharmacy'];
  if (/Management|MBA|BBA|Business/i.test(name)) return DOMAIN_DEFAULTS['Management'];
  if (/Law|LLB|LLM/i.test(name)) return DOMAIN_DEFAULTS['Law'];
  if (/Agriculture/i.test(name)) return DOMAIN_DEFAULTS['Agriculture'];
  return DOMAIN_DEFAULTS['Science'];
}

export function getCourseCurriculum(course: { id: string; name: string; category: string }): CourseCurriculum {
  const topics = topicsForCourse(course.id, course.category, course.name);
  const chunk = Math.max(3, Math.ceil(topics.length / 4));
  const levels: CurriculumModule['level'][] = ['Foundation', 'Intermediate', 'Advanced', 'Professional'];
  const modules: CurriculumModule[] = [];
  for (let i = 0; i < topics.length; i += chunk) {
    const level = levels[Math.min(modules.length, levels.length - 1)];
    modules.push(moduleFromTopics(course.id, modules.length, `Module ${modules.length + 1} — ${topics[i]}`, level, topics.slice(i, i + chunk)));
  }
  modules.push({
    id: `${course.id}-final-assessment`,
    title: 'Final Assessment & Capstone',
    level: 'Professional',
    topics: [{
      id: `${course.id}-capstone`,
      title: 'Capstone Project & Final Mock Test',
      lessons: [
        { id: `${course.id}-capstone-project`, title: 'Capstone Project', type: 'project', description: 'Build a portfolio-ready project that demonstrates the skills learned across the course.' },
        { id: `${course.id}-final-mock`, title: 'Final Mock Test', type: 'mock', description: 'Complete a cumulative assessment covering the full learning path.' },
      ],
    }],
  });
  return { courseId: course.id, learningPath: ['Start', 'Foundation', 'Intermediate', 'Advanced', 'Professional', 'Capstone', 'Completion'], modules };
}
