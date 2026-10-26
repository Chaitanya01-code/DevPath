import { useEffect, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { getApiErrorMessage } from '../api/client'
import {
  createAdminDomain,
  createAdminResource,
  createAdminRoadmap,
  createAdminStep,
  deleteAdminDomain,
  deleteAdminResource,
  deleteAdminRoadmap,
  deleteAdminStep,
  getAdminDomains,
  getAdminRoadmapPreview,
  getAdminRoadmaps,
  getAdminStatistics,
  getAdminStudent,
  getAdminStudents,
  reorderAdminResources,
  reorderAdminSteps,
  updateAdminDomain,
  updateAdminResource,
  updateAdminRoadmap,
  updateAdminStep,
  updateAdminStudent,
} from '../api/auth'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import { useAdminAuth } from '../context/AdminAuthContext'
import type {
  AdminStatistics,
  Domain,
  DomainPayload,
  ResourcePayload,
  Roadmap,
  RoadmapPayload,
  RoadmapStepPayload,
  Student,
  StudentDetail,
  StudentPage,
} from '../types'

type AdminSection = 'overview' | 'domains' | 'roadmaps' | 'students'
type AdminSidebarMode = 'expanded' | 'collapsed' | 'hidden'
type AsyncAction = () => Promise<void>

const adminSidebarPreferenceKey = 'devpath.admin.sidebar'

const getSafeResourceUrl = (value: string): string | null => {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

const defaultDomainForm: DomainPayload = {
  name: '',
  slug: '',
  description: '',
  is_active: true,
  display_order: 0,
}

const defaultRoadmapForm = (domainId = 0): RoadmapPayload => ({
  domain_id: domainId,
  title: '',
  slug: '',
  description: '',
  difficulty: 'beginner',
  estimated_hours: 1,
  display_order: 0,
  is_published: false,
  is_archived: false,
})

const defaultStepForm = (position = 1): RoadmapStepPayload => ({
  title: '',
  description: '',
  instructions: '',
  learning_objectives: [],
  position,
  estimated_minutes: 30,
  is_required: true,
})

const defaultResourceForm: ResourcePayload = {
  title: '',
  url: '',
  description: '',
  resource_type: 'documentation',
  is_recommended: false,
  display_order: 0,
}

type StarterStep = RoadmapStepPayload & {
  resource?: Omit<ResourcePayload, 'step_id'>
}

type StarterRoadmap = {
  domainName: string
  domainSlug: string
  domainAliases: string[]
  domainDescription: string
  title: string
  slug: string
  description: string
  estimatedHours: number
  steps: StarterStep[]
}

const lesson = (
  title: string,
  description: string,
  activity: string,
  estimatedMinutes: number,
  resource?: { title: string; url: string; resource_type: ResourcePayload['resource_type'] },
): StarterStep => ({
  title,
  description,
  instructions: `## Explanation\n${description}\n\n## Practical exercise\n${activity}\n\n## Key takeaways\n- ${description}`,
  learning_objectives: [description],
  position: 0,
  estimated_minutes: estimatedMinutes,
  is_required: true,
  ...(resource
    ? {
        resource: {
          ...resource,
          description: 'Official documentation reference. Complete the practical activity in the step instructions.',
          is_recommended: true,
          display_order: 0,
        },
      }
    : {}),
})

const starterRoadmapTemplates: StarterRoadmap[] = [
  {
    domainName: 'Web Development',
    domainSlug: 'web-development',
    domainAliases: [],
    domainDescription: 'Plan, build, and understand websites and web applications.',
    title: 'Web Development Beginner Roadmap',
    slug: 'web-development-beginner',
    description: 'Start with how the web works, then learn HTML, CSS, JavaScript, version control, responsive layouts, React, backend concepts, and databases before building a complete application.',
    estimatedHours: 48,
    steps: [
      lesson('Introduction to Web Development', 'Learn how browsers, servers, URLs, and web pages work together.', 'Sketch the journey of a page request from entering a URL to seeing the rendered page.', 45, { title: 'MDN Learn web development', url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development', resource_type: 'documentation' }),
      lesson('HTML Fundamentals', 'Use semantic HTML elements to structure accessible pages and forms.', 'Create a small profile page with headings, lists, links, and a labeled form.', 90, { title: 'MDN Learn web development', url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development', resource_type: 'documentation' }),
      lesson('CSS Fundamentals', 'Style content using selectors, the box model, typography, and layout basics.', 'Style the profile page and compare a flex layout with a grid layout.', 120, { title: 'MDN Learn web development', url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development', resource_type: 'documentation' }),
      lesson('JavaScript Basics', 'Use values, variables, conditions, loops, functions, and events for page behavior.', 'Add a button that validates a simple form and displays a helpful message.', 150, { title: 'MDN Learn web development', url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development', resource_type: 'documentation' }),
      lesson('Git and GitHub', 'Track changes with Git and understand how repositories support collaboration.', 'Create a repository, commit the page, and write a concise README describing it.', 90, { title: 'Git documentation', url: 'https://git-scm.com/docs', resource_type: 'documentation' }),
      lesson('Responsive Web Design', 'Adapt page layouts and content to different screen sizes and input methods.', 'Make the profile page usable at mobile and desktop widths, then check keyboard focus.', 120, { title: 'MDN Learn web development', url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development', resource_type: 'documentation' }),
      lesson('React Fundamentals', 'Understand components, props, state, and how interfaces update from data.', 'Break the profile page into reusable components and add one stateful interaction.', 180),
      lesson('Backend Development', 'Learn the role of APIs, request methods, validation, and server responses.', 'Map a contact form to a simple API contract and document success and error responses.', 150, { title: 'FastAPI Tutorial', url: 'https://fastapi.tiangolo.com/tutorial/', resource_type: 'documentation' }),
      lesson('Databases', 'Understand tables, relationships, and how applications store and retrieve data.', 'Design a small users-and-projects schema and write down its primary and foreign keys.', 120, { title: 'PostgreSQL Tutorial', url: 'https://www.postgresql.org/docs/current/tutorial.html', resource_type: 'documentation' }),
      lesson('Final Project: Build a Complete Web Application', 'Combine frontend, backend, and data concepts in a small, accessible web application.', 'Build a small project with a responsive interface, a documented API, and a persistent data model; review it with a checklist.', 360, { title: 'MDN Learn web development', url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development', resource_type: 'documentation' }),
    ],
  },
  {
    domainName: 'Artificial Intelligence and Machine Learning',
    domainSlug: 'ai-machine-learning',
    domainAliases: ['ai-machine-learning', 'aiml', 'artificial-intelligence-machine-learning'],
    domainDescription: 'Explore artificial intelligence, machine learning, and responsible data-driven systems.',
    title: 'Artificial Intelligence and Machine Learning Beginner Roadmap',
    slug: 'artificial-intelligence-machine-learning-beginner',
    description: 'Build foundations in AI, Python, data tools, mathematics, and machine learning, then practice training and evaluating a small prediction model.',
    estimatedHours: 52,
    steps: [
      lesson('Introduction to Artificial Intelligence', 'Distinguish common AI ideas and identify where machine learning fits.', 'Choose three everyday software features and describe what data or rules might support them.', 45),
      lesson('Python Fundamentals', 'Use basic Python syntax, collections, functions, and simple modules.', 'Write a short program that reads a small list of values and summarizes them.', 150, { title: 'The Python Tutorial', url: 'https://docs.python.org/3/tutorial/', resource_type: 'documentation' }),
      lesson('NumPy Fundamentals', 'Represent numeric data with arrays and perform basic vectorized operations.', 'Create a small numeric array and calculate its minimum, maximum, and mean.', 90, { title: 'NumPy Quickstart', url: 'https://numpy.org/doc/stable/user/quickstart.html', resource_type: 'documentation' }),
      lesson('Pandas Fundamentals', 'Load tabular data and inspect, select, and summarize DataFrame columns.', 'Use a small table of your own to filter rows and compute a grouped summary.', 120, { title: 'Pandas getting started tutorials', url: 'https://pandas.pydata.org/docs/getting_started/intro_tutorials/', resource_type: 'documentation' }),
      lesson('Data Visualization', 'Choose simple chart forms to communicate patterns and uncertainty in data.', 'Make a labeled chart from a small dataset and write two observations without overstating them.', 90),
      lesson('Mathematics for Machine Learning', 'Build intuition for vectors, averages, variation, and probability used in model explanations.', 'Calculate a mean and a simple distance by hand, then explain what each number represents.', 120),
      lesson('Machine Learning Basics', 'Understand features, labels, training data, and the purpose of a model.', 'Describe a small prediction task and identify its inputs, target, and possible limitations.', 90),
      lesson('Supervised Learning', 'Compare regression and classification and understand how labeled examples are used.', 'Sort sample prediction tasks into regression or classification and explain the choice.', 120),
      lesson('Model Evaluation', 'Use held-out examples and appropriate metrics to check model performance.', 'Compare two hypothetical models and explain why accuracy alone may be misleading.', 90),
      lesson('Final Project: Build a Prediction Model', 'Plan a small, reproducible prediction exercise and communicate its limitations.', 'Use a suitable public dataset, document preparation and evaluation, and summarize what the model cannot establish.', 300, { title: 'Pandas getting started tutorials', url: 'https://pandas.pydata.org/docs/getting_started/intro_tutorials/', resource_type: 'documentation' }),
    ],
  },
  {
    domainName: 'Data Structures and Algorithms',
    domainSlug: 'data-structures-algorithms',
    domainAliases: ['data-structures-algorithms'],
    domainDescription: 'Practice organizing data and reasoning about clear, efficient problem-solving approaches.',
    title: 'Data Structures and Algorithms Beginner Roadmap',
    slug: 'data-structures-algorithms-beginner',
    description: 'Learn programming foundations, complexity, core data structures, searching, sorting, trees, graphs, and introductory dynamic programming through small exercises.',
    estimatedHours: 48,
    steps: [
      lesson('Programming Fundamentals', 'Review variables, control flow, functions, and breaking problems into smaller tasks.', 'Write a function that transforms a list of values and explain each step.', 120, { title: 'The Python Tutorial', url: 'https://docs.python.org/3/tutorial/', resource_type: 'documentation' }),
      lesson('Time and Space Complexity', 'Compare how an algorithm’s work and memory needs grow with input size.', 'Count operations in two simple list-processing approaches for several input lengths.', 90),
      lesson('Arrays and Strings', 'Traverse indexed sequences and recognize common search and transformation patterns.', 'Write functions to find a maximum and reverse a sequence without using a built-in shortcut.', 90),
      lesson('Hash Maps and Sets', 'Use key-value lookup and uniqueness to solve counting and membership tasks.', 'Count repeated words and find shared values between two small collections.', 90),
      lesson('Searching and Sorting', 'Understand linear and binary search and compare sorting behavior at a high level.', 'Trace a search by hand on sorted and unsorted lists and record each comparison.', 120),
      lesson('Linked Lists', 'Understand nodes and references and compare linked lists with indexed arrays.', 'Draw a short linked list and implement traversal and insertion in a local learning exercise.', 120),
      lesson('Stacks and Queues', 'Model last-in-first-out and first-in-first-out workflows.', 'Use a stack to check balanced delimiters and a queue to model a simple waiting line.', 90),
      lesson('Trees', 'Represent hierarchical data and practice common tree traversal orders.', 'Draw a small binary tree and list its preorder, inorder, and level-order traversals.', 120),
      lesson('Graphs', 'Model relationships with vertices and edges and understand basic graph traversal.', 'Represent a small campus map as an adjacency list and trace a visited-set traversal.', 150),
      lesson('Dynamic Programming', 'Recognize overlapping subproblems and compare recursive and memoized reasoning.', 'Solve a small sequence-counting exercise first recursively, then store reused results.', 150),
    ],
  },
  {
    domainName: 'Python Development',
    domainSlug: 'python-development',
    domainAliases: [],
    domainDescription: 'Learn Python from setup and core syntax through practical application development.',
    title: 'Python Development Beginner Roadmap',
    slug: 'python-development-beginner',
    description: 'Set up Python, learn core language features and object-oriented ideas, then work with files, packages, APIs, and databases in a small application.',
    estimatedHours: 44,
    steps: [
      lesson('Python Setup', 'Install or access Python, run a script, and understand a project environment.', 'Create a project folder, run a small script, and record the Python version you used.', 60, { title: 'The Python Tutorial', url: 'https://docs.python.org/3/tutorial/', resource_type: 'documentation' }),
      lesson('Variables and Data Types', 'Work with names, numbers, strings, booleans, and conversions.', 'Build a small unit-conversion script and handle an invalid numeric input clearly.', 90, { title: 'The Python Tutorial', url: 'https://docs.python.org/3/tutorial/', resource_type: 'documentation' }),
      lesson('Conditions and Loops', 'Use branching and iteration to control program flow.', 'Create a menu-driven console exercise with a clear exit option.', 90, { title: 'The Python Tutorial', url: 'https://docs.python.org/3/tutorial/', resource_type: 'documentation' }),
      lesson('Lists, Tuples, Sets, and Dictionaries', 'Choose common collection types and use them to organize related data.', 'Store a small reading list and report unique categories and item counts.', 120, { title: 'The Python Tutorial', url: 'https://docs.python.org/3/tutorial/', resource_type: 'documentation' }),
      lesson('Functions', 'Create reusable functions with parameters, return values, and clear responsibilities.', 'Refactor the menu exercise into small functions and describe each function’s purpose.', 90, { title: 'The Python Tutorial', url: 'https://docs.python.org/3/tutorial/', resource_type: 'documentation' }),
      lesson('Object-Oriented Programming', 'Understand classes, instances, attributes, and methods at an introductory level.', 'Model a simple library book as an object and add methods for checkout and return.', 120, { title: 'The Python Tutorial', url: 'https://docs.python.org/3/tutorial/', resource_type: 'documentation' }),
      lesson('Files and Exception Handling', 'Read and write files safely and handle expected errors with useful messages.', 'Save a small collection to a text file and handle the file-not-found case.', 120, { title: 'The Python Tutorial', url: 'https://docs.python.org/3/tutorial/', resource_type: 'documentation' }),
      lesson('Libraries and Packages', 'Import standard and third-party modules and understand isolated project dependencies.', 'Create a small environment for the project and document its dependencies.', 90, { title: 'The Python Tutorial', url: 'https://docs.python.org/3/tutorial/', resource_type: 'documentation' }),
      lesson('APIs and Databases', 'Understand HTTP requests and how application code reads and writes structured records.', 'Document a small API request and design a table for the data it would store.', 150, { title: 'FastAPI Tutorial', url: 'https://fastapi.tiangolo.com/tutorial/', resource_type: 'documentation' }),
      lesson('Final Project: Build a Python Application', 'Combine Python fundamentals into a useful, maintainable application.', 'Build a small command-line or API application with input validation, persistence, and a short README.', 300, { title: 'FastAPI Tutorial', url: 'https://fastapi.tiangolo.com/tutorial/', resource_type: 'documentation' }),
    ],
  },
  {
    domainName: 'Data Science',
    domainSlug: 'data-science',
    domainAliases: [],
    domainDescription: 'Turn data into careful, understandable insights using programming, statistics, and visualization.',
    title: 'Data Science Beginner Roadmap',
    slug: 'data-science-beginner',
    description: 'Follow a practical path from Python and data tables through statistics, visualization, exploration, SQL, and introductory machine learning.',
    estimatedHours: 48,
    steps: [
      lesson('Introduction to Data Science', 'Understand the stages of a data project and the importance of asking a precise question.', 'Turn a broad curiosity into one answerable question and list data that could help.', 45),
      lesson('Python Fundamentals', 'Use Python syntax, functions, and collections to prepare for data work.', 'Write a small script that cleans and summarizes a list of measurements.', 120, { title: 'The Python Tutorial', url: 'https://docs.python.org/3/tutorial/', resource_type: 'documentation' }),
      lesson('NumPy Fundamentals', 'Use arrays and basic numeric operations for structured data.', 'Create arrays from a few measurements and calculate a mean and range.', 90, { title: 'NumPy Quickstart', url: 'https://numpy.org/doc/stable/user/quickstart.html', resource_type: 'documentation' }),
      lesson('Pandas and DataFrames', 'Load, inspect, select, and summarize tabular data with DataFrames.', 'Create a small DataFrame, filter it, and group values by one category.', 120, { title: 'Pandas getting started tutorials', url: 'https://pandas.pydata.org/docs/getting_started/intro_tutorials/', resource_type: 'documentation' }),
      lesson('Statistics Fundamentals', 'Interpret averages, spread, samples, and the limits of drawing conclusions from data.', 'Compare the mean and median of a small dataset containing one unusual value.', 120),
      lesson('Data Visualization', 'Choose clear charts and labels that accurately communicate data patterns.', 'Create a chart from a small dataset and write a caption that distinguishes observation from explanation.', 90),
      lesson('Exploratory Data Analysis', 'Inspect data quality and explore patterns before making claims or modeling.', 'Prepare a short notebook-style report with missing-value checks and two cautious observations.', 150, { title: 'Pandas getting started tutorials', url: 'https://pandas.pydata.org/docs/getting_started/intro_tutorials/', resource_type: 'documentation' }),
      lesson('SQL for Data Analysis', 'Use relational tables and introductory SQL queries to retrieve and summarize data.', 'Design a small table and write example queries for filtering, grouping, and sorting.', 120, { title: 'PostgreSQL Tutorial', url: 'https://www.postgresql.org/docs/current/tutorial.html', resource_type: 'documentation' }),
      lesson('Introduction to Machine Learning', 'Understand the purpose of basic models and how they differ from descriptive analysis.', 'Identify inputs, target, and a simple baseline for a prediction question.', 90),
      lesson('Final Project: Analyze a Real-World Dataset', 'Present a reproducible data analysis with clear methods and limitations.', 'Choose a public dataset, document cleaning decisions, answer one question, and present evidence with a labeled visualization.', 300, { title: 'Pandas getting started tutorials', url: 'https://pandas.pydata.org/docs/getting_started/intro_tutorials/', resource_type: 'documentation' }),
    ],
  },
  {
    domainName: 'Cybersecurity',
    domainSlug: 'cybersecurity',
    domainAliases: [],
    domainDescription: 'Learn defensive security fundamentals, safe testing practices, and responsible risk communication.',
    title: 'Cybersecurity Beginner Roadmap',
    slug: 'cybersecurity-beginner',
    description: 'Build defensive foundations in networks, operating systems, command lines, Python, web security, testing, and monitoring. All practical work is limited to systems you own or explicitly authorized training labs.',
    estimatedHours: 48,
    steps: [
      lesson('Introduction to Cybersecurity', 'Learn core security goals, common roles, responsible disclosure, and authorization boundaries.', 'Write a short scope and authorization checklist for a fictional security review.', 60),
      lesson('Networking Fundamentals', 'Understand addresses, ports, DNS, and how network communication is described.', 'Draw a client-to-server request path and label the roles of DNS, address, and port.', 120),
      lesson('Operating System Fundamentals', 'Explore users, permissions, processes, updates, and basic system security controls.', 'Review a local device’s update and account settings and record defensive improvements.', 120),
      lesson('Command-Line Fundamentals', 'Navigate files and inspect system information with basic shell commands.', 'Create a practice directory and organize sample files without accessing other users’ data.', 90),
      lesson('Python for Security', 'Use Python for safe automation, text processing, and defensive data review.', 'Write a local script that checks a supplied sample log for repeated status categories.', 120, { title: 'The Python Tutorial', url: 'https://docs.python.org/3/tutorial/', resource_type: 'documentation' }),
      lesson('Web Security Fundamentals', 'Understand browser and server trust boundaries, authentication concepts, and secure defaults.', 'Review a toy application design and list where input validation and access checks belong.', 120, { title: 'MDN Learn web development', url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development', resource_type: 'documentation' }),
      lesson('Common Web Vulnerabilities and OWASP', 'Recognize common vulnerability categories and learn how prevention and impact are discussed.', 'For a fictional app, map each risk category to a defensive control and a safe verification question.', 120),
      lesson('Security Testing Tools', 'Understand the role of approved scanners and static checks in a scoped, authorized assessment.', 'Create a test plan for a local intentionally vulnerable training application; document scope, permitted checks, and cleanup.', 120),
      lesson('Defensive Security and Monitoring', 'Learn how logs, alerts, updates, and incident procedures support defense.', 'Review a sample set of benign log events and draft a simple escalation checklist.', 120),
      lesson('Final Project: Audit a Deliberately Vulnerable Lab Application', 'Practice documenting security observations and mitigations in a contained training environment.', 'Use only a local or explicitly authorized lab; write a non-destructive assessment summary with scope, observations, mitigations, and retest criteria.', 240),
    ],
  },
]

export default function AdminDashboard() {
  const { admin, logout } = useAdminAuth()
  const navigate = useNavigate()
  const [section, setSection] = useState<AdminSection>('overview')
  const [sidebarMode, setSidebarMode] = useState<AdminSidebarMode>(() => {
    const saved = window.localStorage.getItem(adminSidebarPreferenceKey)
    return saved === 'collapsed' || saved === 'hidden' ? saved : 'expanded'
  })
  const [statistics, setStatistics] = useState<AdminStatistics | null>(null)
  const [domains, setDomains] = useState<Domain[]>([])
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([])
  const [previewRoadmap, setPreviewRoadmap] = useState<Roadmap | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [students, setStudents] = useState<StudentPage | null>(null)
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null)
  const [selectedRoadmap, setSelectedRoadmap] = useState<number | null>(null)
  const [roadmapDomainFilter, setRoadmapDomainFilter] = useState('')
  const [roadmapStatusFilter, setRoadmapStatusFilter] = useState('all')
  const [roadmapSearch, setRoadmapSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<StudentDetail | null>(null)
  const [domainForm, setDomainForm] = useState<DomainPayload>(defaultDomainForm)
  const [roadmapForm, setRoadmapForm] = useState<RoadmapPayload>(defaultRoadmapForm())
  const [stepForm, setStepForm] = useState<RoadmapStepPayload>(defaultStepForm())
  const [resourceForm, setResourceForm] = useState<ResourcePayload>(defaultResourceForm)
  const [selectedStepId, setSelectedStepId] = useState<number | null>(null)
  const [editingStepId, setEditingStepId] = useState<number | null>(null)
  const [stepTargetRoadmapId, setStepTargetRoadmapId] = useState<number | null>(null)
  const [editingResourceId, setEditingResourceId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const refreshCore = async () => {
    const [nextStatistics, nextDomains, nextRoadmaps] = await Promise.all([
      getAdminStatistics(),
      getAdminDomains(),
      getAdminRoadmaps(),
    ])
    setStatistics(nextStatistics)
    setDomains(nextDomains)
    setRoadmaps(nextRoadmaps)
  }

  useEffect(() => {
    refreshCore()
      .catch((requestError: unknown) =>
        setError(getApiErrorMessage(requestError, 'The request could not be completed.')),
      )
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (section !== 'students') return
    setStudentsLoading(true)
    getAdminStudents(search, page)
      .then(setStudents)
      .catch((requestError: unknown) =>
        setError(getApiErrorMessage(requestError, 'The request could not be completed.')),
      )
      .finally(() => setStudentsLoading(false))
  }, [section, search, page])

  const runAction = async (action: AsyncAction, successMessage: string) => {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await action()
      setNotice(successMessage)
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError, 'The request could not be completed.'))
    } finally {
      setBusy(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const submitDomain = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await runAction(async () => {
      if (selectedDomain) await updateAdminDomain(selectedDomain.id, domainForm)
      else await createAdminDomain(domainForm)
      setSelectedDomain(null)
      setDomainForm(defaultDomainForm)
      await refreshCore()
    }, selectedDomain ? 'Domain updated.' : 'Domain created.')
  }

  const editDomain = (domain: Domain) => {
    setSelectedDomain(domain)
    setDomainForm({
      name: domain.name,
      slug: domain.slug ?? '',
      description: domain.description ?? '',
      is_active: domain.is_active ?? true,
      display_order: domain.display_order ?? 0,
    })
  }

  const submitRoadmap = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await runAction(async () => {
      if (selectedRoadmap !== null) await updateAdminRoadmap(selectedRoadmap, roadmapForm)
      else await createAdminRoadmap(roadmapForm)
      setSelectedRoadmap(null)
      setRoadmapForm(defaultRoadmapForm(domains[0]?.id ?? 0))
      await refreshCore()
    }, selectedRoadmap !== null ? 'Roadmap updated.' : 'Roadmap created.')
  }

  const addStarterRoadmapDrafts = async () => {
    await runAction(async () => {
      const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '')
      let currentDomains = await getAdminDomains()
      const templateDomains: { template: StarterRoadmap; domain: Domain }[] = []

      for (const template of starterRoadmapTemplates) {
        const aliases = new Set([
          normalize(template.domainName),
          normalize(template.domainSlug),
          ...template.domainAliases.map(normalize),
        ])
        let domain = currentDomains.find(
          (item) => aliases.has(normalize(item.name)) || aliases.has(normalize(item.slug ?? '')),
        )
        if (!domain) {
          domain = await createAdminDomain({
            name: template.domainName,
            slug: template.domainSlug,
            description: template.domainDescription,
            is_active: true,
            display_order: currentDomains.length,
          })
          currentDomains = [...currentDomains, domain]
        }
        templateDomains.push({ template, domain })
      }

      let currentRoadmaps = await getAdminRoadmaps()
      const newlyCreatedRoadmapIds = new Set<number>()
      for (const { template, domain } of templateDomains) {
        let roadmap = currentRoadmaps.find(
          (item) =>
            item.domain_id === domain.id &&
            (item.slug === template.slug || normalize(item.title) === normalize(template.title)),
        )
        if (!roadmap) {
          roadmap = await createAdminRoadmap({
            domain_id: domain.id,
            title: template.title,
            slug: template.slug,
            description: template.description,
            difficulty: 'beginner',
            estimated_hours: template.estimatedHours,
            display_order: currentRoadmaps.length,
            is_published: false,
            is_archived: false,
          })
          currentRoadmaps.push(roadmap)
          newlyCreatedRoadmapIds.add(roadmap.id)
        } else if (roadmap.domain_id !== domain.id) {
          throw new Error(`The roadmap slug "${template.slug}" is already assigned to another domain. No existing content was changed.`)
        }

        const roadmapDetails = await getAdminRoadmapPreview(roadmap.id)
        const existingSteps = roadmapDetails.steps ?? []
        for (const [index, stepTemplate] of template.steps.entries()) {
          const position = index + 1
          let step = existingSteps.find((item) => item.position === position)
          if (step && normalize(step.title) !== normalize(stepTemplate.title)) {
            throw new Error(
              `"${roadmap.title}" already has a different step at position ${position} ("${step.title}"). Existing content was preserved; resolve the ordering in the admin editor and retry.`,
            )
          }
          if (!step) {
            step = existingSteps.find((item) => normalize(item.title) === normalize(stepTemplate.title))
          }
          if (!step) {
            step = await createAdminStep(roadmap.id, {
              title: stepTemplate.title,
              description: stepTemplate.description,
              instructions: stepTemplate.instructions,
              learning_objectives: stepTemplate.learning_objectives,
              position,
              estimated_minutes: stepTemplate.estimated_minutes,
              is_required: stepTemplate.is_required,
            })
            existingSteps.push(step)
          }
          if (stepTemplate.resource && !step.resources?.some((resource) => resource.url === stepTemplate.resource?.url)) {
            await createAdminResource(step.id, stepTemplate.resource)
          }
        }

        if (newlyCreatedRoadmapIds.has(roadmap.id)) {
          await updateAdminRoadmap(roadmap.id, { is_published: true })
        }
      }
      await refreshCore()
    }, 'Starter roadmap content has been saved. Newly created roadmaps were published; existing publication settings and content were preserved.')
  }

  const loadStudents = async () => {
    const result = await getAdminStudents(search, page)
    setStudents(result)
  }

  const selectStudent = async (student: Student) => {
    await runAction(async () => setSelectedStudent(await getAdminStudent(student.id)), '')
  }

  const saveStudent = async (payload: { name?: string; domain_id?: number; is_active?: boolean }) => {
    if (!selectedStudent) return
    await runAction(async () => {
      await updateAdminStudent(selectedStudent.id, payload)
      setSelectedStudent(await getAdminStudent(selectedStudent.id))
      await loadStudents()
    }, 'Student profile updated.')
  }

  const submitStep = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (selectedRoadmap === null) return
    await runAction(async () => {
      if (editingStepId !== null) {
        await updateAdminStep(editingStepId, {
          ...stepForm,
          roadmap_id: stepTargetRoadmapId ?? selectedRoadmap,
        })
      }
      else await createAdminStep(selectedRoadmap, stepForm)
      setEditingStepId(null)
      setStepForm(defaultStepForm(stepForm.position + 1))
      await refreshCore()
    }, editingStepId === null ? 'Roadmap step created.' : 'Roadmap step updated.')
  }

  const submitResource = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (selectedStepId === null) return
    await runAction(async () => {
      if (editingResourceId !== null) await updateAdminResource(editingResourceId, resourceForm)
      else await createAdminResource(selectedStepId, resourceForm)
      setEditingResourceId(null)
      setResourceForm(defaultResourceForm)
      await refreshCore()
    }, editingResourceId === null ? 'Learning resource added.' : 'Resource updated.')
  }

  const stepOrder = async (roadmap: Roadmap, stepId: number, direction: -1 | 1) => {
    const steps = [...(roadmap.steps ?? [])].sort((left, right) => left.position - right.position)
    const currentIndex = steps.findIndex((step) => step.id === stepId)
    const targetIndex = currentIndex + direction
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= steps.length) return
    ;[steps[currentIndex], steps[targetIndex]] = [steps[targetIndex], steps[currentIndex]]
    await runAction(async () => {
      await reorderAdminSteps(roadmap.id, steps.map((step) => step.id))
      await refreshCore()
    }, 'Step order updated.')
  }

  const resourceOrder = async (stepId: number, resourceIds: number[]) => {
    await runAction(async () => {
      await reorderAdminResources(stepId, resourceIds)
      await refreshCore()
    }, 'Resource order updated.')
  }

  const beginRoadmapEdit = (roadmap: Roadmap) => {
    setSelectedRoadmap(roadmap.id)
    setRoadmapForm({
      domain_id: roadmap.domain_id,
      title: roadmap.title,
      slug: roadmap.slug,
      description: roadmap.description,
      difficulty: roadmap.difficulty,
      estimated_hours: roadmap.estimated_hours,
      display_order: roadmap.display_order,
      is_published: roadmap.is_published,
      is_archived: roadmap.is_archived,
    })
  }

  const loadRoadmapPreview = async (roadmapId: number) => {
    setPreviewLoading(true)
    setError('')
    setPreviewRoadmap(null)
    try {
      setPreviewRoadmap(await getAdminRoadmapPreview(roadmapId))
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError, 'Unable to preview this roadmap.'))
    } finally {
      setPreviewLoading(false)
    }
  }

  const sections: { id: AdminSection; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'domains', label: 'Domains' },
    { id: 'roadmaps', label: 'Roadmaps' },
    { id: 'students', label: 'Students' },
  ]

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | null = null
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % sections.length
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + sections.length) % sections.length
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = sections.length - 1
    if (nextIndex === null) return

    event.preventDefault()
    const nextSection = sections[nextIndex]
    setSection(nextSection.id)
    setError('')
    setNotice('')
    document.getElementById(`admin-tab-${nextSection.id}`)?.focus()
  }

  const stats = [
    { label: 'Students', value: statistics?.total_students ?? '—', tint: 'bg-teal-tint text-teal-hover' },
    { label: 'Active domains', value: statistics?.active_domains ?? '—', tint: 'bg-violet-tint text-violet' },
    { label: 'Roadmaps', value: statistics?.total_roadmaps ?? '—', tint: 'bg-coral-tint text-heading' },
    { label: 'Published', value: statistics?.published_roadmaps ?? '—', tint: 'bg-teal-tint text-teal-hover' },
    { label: 'Steps', value: statistics?.total_steps ?? '—', tint: 'bg-violet-tint text-violet' },
    { label: 'Completed steps', value: statistics?.active_learning_records ?? '—', tint: 'bg-coral-tint text-heading' },
  ]
  const filteredRoadmaps = roadmaps.filter((roadmap) => {
    const matchesDomain = !roadmapDomainFilter || String(roadmap.domain_id) === roadmapDomainFilter
    const matchesStatus =
      roadmapStatusFilter === 'all' ||
      (roadmapStatusFilter === 'published' && roadmap.is_published && !roadmap.is_archived) ||
      (roadmapStatusFilter === 'draft' && !roadmap.is_published && !roadmap.is_archived) ||
      (roadmapStatusFilter === 'archived' && roadmap.is_archived)
    const matchesSearch = roadmap.title.toLowerCase().includes(roadmapSearch.trim().toLowerCase())
    return matchesDomain && matchesStatus && matchesSearch
  })
  const updateSidebarMode = (mode: AdminSidebarMode) => {
    window.localStorage.setItem(adminSidebarPreferenceKey, mode)
    setSidebarMode(mode)
  }

  return (
    <div className="min-h-screen bg-page">
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 sm:px-7 sm:py-7 lg:px-8">
        <header className="mb-6 flex items-center justify-between rounded-2xl border border-line/80 bg-white px-4 py-3 shadow-card sm:px-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-brand text-sm font-extrabold text-white shadow-sm">D</span>
            <div>
              <p className="text-base font-extrabold tracking-tight text-heading">DevPath<span className="text-gradient">.</span></p>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted">Administration</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {sidebarMode === 'hidden' && <Button type="button" variant="secondary" className="min-h-9 px-3" aria-label="Show admin navigation" onClick={() => updateSidebarMode('expanded')}>Show menu</Button>}
            <Button
              type="button"
              variant="ghost"
              className="hidden min-h-9 px-3 lg:inline-flex"
              aria-label={sidebarMode === 'expanded' ? 'Collapse admin navigation' : 'Expand admin navigation'}
              title={sidebarMode === 'expanded' ? 'Collapse navigation' : 'Expand navigation'}
              onClick={() => updateSidebarMode(sidebarMode === 'expanded' ? 'collapsed' : 'expanded')}
            >
              <span aria-hidden="true">☷</span>
            </Button>
            {admin && <span className="hidden rounded-full bg-violet-tint px-3 py-1.5 text-xs font-semibold text-violet sm:inline-flex">{admin.username}</span>}
            <Button variant="secondary" className="min-h-10 px-3 sm:px-4" onClick={handleLogout}>Log out</Button>
          </div>
        </header>

        <section className="relative mb-6 flex flex-col gap-5 overflow-hidden rounded-3xl border border-teal/15 bg-gradient-to-r from-teal-tint via-white to-violet-tint p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <span aria-hidden="true" className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border-[30px] border-white/50" />
          <div className="relative">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/75 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-violet">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-teal" />
              Management workspace
            </p>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-heading sm:text-3xl">Welcome, Admin</h1>
            <p className="mt-1.5 max-w-xl text-sm leading-6 text-body">Manage learning domains, published roadmaps, and student progress from one place.</p>
          </div>
          <div className="relative flex flex-wrap gap-2">
            <Button variant="secondary" className="bg-white/90" onClick={() => { setSection('roadmaps'); setError(''); setNotice('') }}>Manage roadmaps</Button>
            <Button variant="ghost" className="bg-white/60" onClick={() => { setSection('domains'); setError(''); setNotice('') }}>Domains</Button>
          </div>
        </section>

      <div className="flex flex-col items-start gap-4 lg:flex-row">
      {sidebarMode !== 'hidden' && (
        <aside className={`w-full shrink-0 rounded-2xl border border-line/80 bg-white p-2 shadow-card lg:sticky lg:top-4 ${sidebarMode === 'collapsed' ? 'lg:w-[4.5rem] lg:p-1.5' : 'lg:w-56'}`}>
          <nav role="tablist" aria-label="Admin sections" className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            {sections.map((item, index) => (
              <button
                key={item.id}
                id={`admin-tab-${item.id}`}
                type="button"
                onClick={() => { setSection(item.id); setError(''); setNotice('') }}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
                role="tab"
                aria-selected={section === item.id}
                aria-controls="admin-tab-panel"
                aria-label={sidebarMode === 'collapsed' ? item.label : undefined}
                title={sidebarMode === 'collapsed' ? item.label : undefined}
                tabIndex={section === item.id ? 0 : -1}
                className={`flex min-h-10 shrink-0 items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 ${sidebarMode === 'collapsed' ? 'lg:justify-center lg:px-2' : ''} ${section === item.id ? 'bg-gradient-brand text-white shadow-md shadow-teal/20' : 'text-muted hover:bg-page hover:text-heading'}`}
              >
                <span aria-hidden="true" className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-extrabold ${section === item.id ? 'bg-white/20 text-white' : 'bg-page text-teal-hover'}`}>{item.label.slice(0, 1)}</span>
                <span className={sidebarMode === 'collapsed' ? 'lg:hidden' : ''}>{item.label}</span>
              </button>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => updateSidebarMode('hidden')}
            className="mt-2 hidden min-h-10 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-xs font-semibold text-muted hover:bg-page hover:text-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal lg:flex"
            aria-label="Hide admin navigation"
          >
            <span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center text-base">←</span>
            <span className={sidebarMode === 'collapsed' ? 'lg:hidden' : ''}>Hide navigation</span>
          </button>
        </aside>
      )}

      <section
        id="admin-tab-panel"
        role="tabpanel"
        aria-labelledby={`admin-tab-${section}`}
        tabIndex={0}
        className="min-w-0 w-full flex-1 rounded-2xl focus-visible:outline-none"
      >
      {error && <p role="alert" className="mb-5 rounded-xl border border-coral/40 bg-coral-tint px-4 py-3 text-sm font-semibold text-heading">{error}</p>}
      {notice && <p role="status" className="mb-5 rounded-xl border border-teal/20 bg-teal-tint px-4 py-3 text-sm font-semibold text-teal-hover">{notice}</p>}
      {loading ? <p className="py-6 text-muted" role="status">Loading admin workspace…</p> : (
        <>
          {section === 'overview' && (
            <>
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-hover">At a glance</p>
                  <h2 className="mt-1 text-xl font-extrabold tracking-tight text-heading sm:text-2xl">Platform overview</h2>
                </div>
                <p className="text-xs font-medium text-muted">Your learning ecosystem, summarized</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {stats.map((stat) => (
                  <Card key={stat.label} className="group relative overflow-hidden p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover sm:p-6">
                    <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-brand opacity-60" />
                    <div className="flex items-center justify-between gap-3">
                      <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${stat.tint}`}>{stat.label}</span>
                      <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-gradient-brand opacity-70" />
                    </div>
                    <p className="mt-5 text-3xl font-extrabold tracking-tight text-heading">{stat.value}</p>
                  </Card>
                ))}
              </div>
              <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <Card className="flex items-start gap-4 bg-gradient-to-r from-white to-teal-tint/60 p-5 sm:p-6">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-teal-tint text-lg font-bold text-teal-hover" aria-hidden="true">↗</span>
                  <div>
                    <h3 className="font-bold text-heading">Learning activity</h3>
                    <p className="mt-1 text-sm leading-6 text-muted">Completed steps reflect recorded student activity across all roadmaps.</p>
                  </div>
                </Card>
                <Card className="flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6">
                  <div>
                    <p className="text-sm font-bold text-heading">Keep your content current</p>
                    <p className="mt-1 text-xs leading-5 text-muted">Review roadmaps and publishing status.</p>
                  </div>
                  <Button variant="secondary" className="px-3" onClick={() => { setSection('roadmaps'); setError(''); setNotice('') }}>View roadmaps</Button>
                </Card>
              </div>
            </>
          )}

          {section === 'domains' && (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.8fr)]">
              <div className="space-y-3">
                {domains.map((domain) => (
                  <Card key={domain.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
                    <div>
                      <h2 className="font-bold text-heading">{domain.name}</h2>
                      <p className="mt-1 text-xs text-muted">{domain.slug} · order {domain.display_order} · {domain.is_active ? 'Active' : 'Inactive'}</p>
                      {domain.description && <p className="mt-2 text-sm text-body">{domain.description}</p>}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Button variant="secondary" onClick={() => editDomain(domain)}>Edit</Button>
                      <Button variant="ghost" onClick={() => void runAction(async () => { await updateAdminDomain(domain.id, { is_active: !domain.is_active }); await refreshCore() }, 'Domain visibility updated.')}>
                        {domain.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button variant="ghost" onClick={() => {
                        if (window.confirm(`Delete ${domain.name}? Domains in use cannot be deleted.`)) {
                          void runAction(async () => { await deleteAdminDomain(domain.id); await refreshCore() }, 'Domain deleted.')
                        }
                      }}>Delete</Button>
                    </div>
                  </Card>
                ))}
                {domains.length === 0 && (
                  <Card className="p-5 text-sm text-muted">No domains yet. Create one to get started.</Card>
                )}
              </div>
              <Card className="h-fit p-5">
                <h2 className="mb-4 text-lg font-bold text-heading">{selectedDomain ? 'Edit domain' : 'Create domain'}</h2>
                <form className="space-y-4" onSubmit={submitDomain}>
                  <Input label="Name" value={domainForm.name} onChange={(event) => setDomainForm({ ...domainForm, name: event.target.value })} required />
                  <Input label="Slug" value={domainForm.slug} onChange={(event) => setDomainForm({ ...domainForm, slug: event.target.value })} pattern="[a-z0-9]+(-[a-z0-9]+)*" required />
                  <label className="block space-y-1.5 text-sm font-semibold text-heading">
                    <span>Description</span>
                    <textarea className="min-h-20 w-full resize-y rounded-xl border border-line bg-white p-3 text-sm font-normal text-body outline-none focus:border-teal focus:ring-4 focus:ring-teal/15" value={domainForm.description} onChange={(event) => setDomainForm({ ...domainForm, description: event.target.value })} />
                  </label>
                  <Input label="Display order" type="number" min="0" value={domainForm.display_order} onChange={(event) => setDomainForm({ ...domainForm, display_order: Number(event.target.value) })} required />
                  <label className="flex items-center gap-2 text-sm font-medium text-body">
                    <input type="checkbox" checked={domainForm.is_active} onChange={(event) => setDomainForm({ ...domainForm, is_active: event.target.checked })} className="accent-teal" />
                    Active and available to students
                  </label>
                  <div className="flex flex-wrap justify-end gap-1">
                    <Button type="submit" disabled={busy}>{selectedDomain ? 'Save changes' : 'Create domain'}</Button>
                    {selectedDomain && <Button type="button" variant="secondary" onClick={() => { setSelectedDomain(null); setDomainForm(defaultDomainForm) }}>Cancel</Button>}
                  </div>
                </form>
              </Card>
            </div>
          )}

          {section === 'roadmaps' && (
            <div className="space-y-4">
              <Card className="p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-bold text-heading">{selectedRoadmap !== null ? 'Edit roadmap' : 'Create roadmap'}</h2>
                  {selectedRoadmap === null && (
                    <Button type="button" variant="secondary" onClick={() => void addStarterRoadmapDrafts()} disabled={busy || loading}>
                      Add and publish starter roadmaps
                    </Button>
                  )}
                </div>
                {selectedRoadmap === null && <p className="mb-4 text-sm leading-6 text-muted">Creates missing domains and beginner roadmaps for Web Development, AI and Machine Learning, Data Structures and Algorithms, Python Development, Data Science, and Cybersecurity. Verified official documentation is linked where available. Existing content and publication settings are preserved; newly created roadmaps are published after their steps are saved.</p>}
                <form className="grid gap-4 sm:grid-cols-2" onSubmit={submitRoadmap}>
                  <Input label="Title" value={roadmapForm.title} onChange={(event) => setRoadmapForm({ ...roadmapForm, title: event.target.value })} required />
                  <Input label="Slug" value={roadmapForm.slug} onChange={(event) => setRoadmapForm({ ...roadmapForm, slug: event.target.value })} pattern="[a-z0-9]+(-[a-z0-9]+)*" required />
                  <Select label="Domain" value={roadmapForm.domain_id} options={domains.filter((domain) => domain.is_active).map((domain) => ({ value: domain.id, label: domain.name }))} onChange={(event) => setRoadmapForm({ ...roadmapForm, domain_id: Number(event.target.value) })} />
                  <Select label="Difficulty" value={roadmapForm.difficulty} options={['beginner', 'intermediate', 'advanced'].map((level) => ({ value: level, label: level }))} onChange={(event) => setRoadmapForm({ ...roadmapForm, difficulty: event.target.value as RoadmapPayload['difficulty'] })} />
                  <Input label="Estimated hours" type="number" min="0" step="0.5" value={roadmapForm.estimated_hours} onChange={(event) => setRoadmapForm({ ...roadmapForm, estimated_hours: Number(event.target.value) })} required />
                  <Input label="Display order" type="number" min="0" value={roadmapForm.display_order} onChange={(event) => setRoadmapForm({ ...roadmapForm, display_order: Number(event.target.value) })} required />
                  <label className="space-y-1.5 text-sm font-semibold text-heading sm:col-span-2">
                    <span>Description</span>
                    <textarea className="min-h-20 w-full resize-y rounded-xl border border-line bg-white p-3 text-sm font-normal text-body outline-none focus:border-teal focus:ring-4 focus:ring-teal/15" value={roadmapForm.description} onChange={(event) => setRoadmapForm({ ...roadmapForm, description: event.target.value })} />
                  </label>
                  <div className="flex flex-wrap gap-5 text-sm font-medium text-body sm:col-span-2">
                    <label className="flex items-center gap-2"><input type="checkbox" checked={roadmapForm.is_published} onChange={(event) => setRoadmapForm({ ...roadmapForm, is_published: event.target.checked })} className="accent-teal" />Published</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={roadmapForm.is_archived} onChange={(event) => setRoadmapForm({ ...roadmapForm, is_archived: event.target.checked })} className="accent-teal" />Archived</label>
                    <p className="basis-full text-xs text-muted">A roadmap needs at least one required step before it can be published. Add accurate learning materials before making it available to students.</p>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:col-span-2">
                    <Button type="submit" disabled={busy || domains.length === 0}>{selectedRoadmap !== null ? 'Save roadmap' : 'Create roadmap'}</Button>
                    {selectedRoadmap !== null && <Button type="button" variant="secondary" onClick={() => { setSelectedRoadmap(null); setRoadmapForm(defaultRoadmapForm(domains[0]?.id ?? 0)) }}>Cancel</Button>}
                  </div>
                </form>
              </Card>

              <Card className="grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
                <Input label="Search roadmap title" value={roadmapSearch} onChange={(event) => setRoadmapSearch(event.target.value)} placeholder="Enter a title" />
                <Select
                  label="Filter by domain"
                  value={roadmapDomainFilter}
                  options={[{ value: '', label: 'All domains' }, ...domains.map((domain) => ({ value: domain.id, label: domain.name }))]}
                  onChange={(event) => setRoadmapDomainFilter(event.target.value)}
                />
                <Select
                  label="Filter by publication status"
                  value={roadmapStatusFilter}
                  options={[
                    { value: 'all', label: 'All statuses' },
                    { value: 'published', label: 'Published' },
                    { value: 'draft', label: 'Draft / unpublished' },
                    { value: 'archived', label: 'Archived' },
                  ]}
                  onChange={(event) => setRoadmapStatusFilter(event.target.value)}
                />
                <p className="text-xs text-muted sm:col-span-3">
                  Showing {filteredRoadmaps.length} of {roadmaps.length} roadmaps across all domains and publication states.
                </p>
              </Card>

              {previewLoading && <p className="py-3 text-sm text-muted" role="status">Loading roadmap preview…</p>}
              {previewRoadmap && (
                <Card className="border-violet/20 p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet">Roadmap preview · {previewRoadmap.is_published ? 'Published' : 'Draft'}</p>
                      <h3 className="mt-1 text-xl font-extrabold text-heading">{previewRoadmap.title}</h3>
                    </div>
                    <Button type="button" variant="ghost" onClick={() => setPreviewRoadmap(null)}>Close preview</Button>
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-body">{previewRoadmap.description}</p>
                  <ol className="mt-4 space-y-3">
                    {(previewRoadmap.steps ?? []).map((step) => (
                      <li key={step.id} className="rounded-xl border border-line bg-page p-4">
                        <h4 className="font-semibold text-heading">{step.position}. {step.title}</h4>
                        {step.description && <p className="mt-1 whitespace-pre-line text-sm text-body">{step.description}</p>}
                        {step.resources.length > 0 && (
                          <ul className="mt-2 space-y-1 text-sm">
                            {step.resources.map((resource) => (
                              <li key={resource.id}>
                                {getSafeResourceUrl(resource.url) ? (
                                  <a href={getSafeResourceUrl(resource.url) ?? undefined} target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-hover underline">{resource.title}</a>
                                ) : (
                                  <span className="text-muted">{resource.title} (invalid link)</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                    {previewRoadmap.steps?.length === 0 && <li className="text-sm text-muted">No steps have been added yet.</li>}
                  </ol>
                </Card>
              )}

              <div className="space-y-3">
                {filteredRoadmaps.map((roadmap) => {
                  const isExpanded = selectedRoadmap === roadmap.id
                  const orderedSteps = [...(roadmap.steps ?? [])].sort((left, right) => left.position - right.position)
                  return (
                    <Card key={roadmap.id} className="p-4 sm:p-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap gap-2 text-xs font-semibold">
                            <span className="rounded-full bg-teal-tint px-3 py-1 text-teal-hover">{roadmap.domain.name}</span>
                            <span className="rounded-full bg-violet-tint px-3 py-1 capitalize text-violet">{roadmap.difficulty}</span>
                            <span className="rounded-full bg-page px-3 py-1 text-muted">{roadmap.is_published ? 'Published' : 'Draft'}{roadmap.is_archived ? ' · Archived' : ''}</span>
                          </div>
                          <h3 className="mt-3 text-lg font-bold text-heading">{roadmap.title}</h3>
                          <p className="mt-1 text-sm text-muted">{roadmap.steps?.length ?? 0} steps · {roadmap.estimated_hours} hours</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="secondary" onClick={() => void loadRoadmapPreview(roadmap.id)}>Preview</Button>
                          <Button variant="secondary" onClick={() => beginRoadmapEdit(roadmap)}>Edit</Button>
                          <Button variant="ghost" onClick={() => void runAction(async () => { await updateAdminRoadmap(roadmap.id, { is_published: !roadmap.is_published }); await refreshCore() }, roadmap.is_published ? 'Roadmap unpublished.' : 'Roadmap published.')}>{roadmap.is_published ? 'Unpublish' : 'Publish'}</Button>
                          <Button variant="ghost" onClick={() => void runAction(async () => { await updateAdminRoadmap(roadmap.id, { is_archived: !roadmap.is_archived }); await refreshCore() }, roadmap.is_archived ? 'Roadmap reactivated.' : 'Roadmap archived.')}>{roadmap.is_archived ? 'Reactivate' : 'Archive'}</Button>
                          <Button variant="ghost" onClick={() => {
                            if (window.confirm(`Delete ${roadmap.title}? Student progress prevents deletion.`)) {
                              void runAction(async () => { await deleteAdminRoadmap(roadmap.id); await refreshCore() }, 'Roadmap deleted.')
                            }
                          }}>Delete</Button>
                          <Button variant="ghost" onClick={() => setSelectedRoadmap(isExpanded ? null : roadmap.id)}>{isExpanded ? 'Hide editor' : 'Edit steps'}</Button>
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="mt-6 border-t border-line pt-5">
                          <h4 className="font-bold text-heading">Ordered steps and resources</h4>
                          <div className="mt-4 space-y-4">
                            {orderedSteps.map((step, index) => (
                              <div key={step.id} className="rounded-2xl border border-line bg-page p-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <div>
                                    <p className="font-semibold text-heading">{step.position}. {step.title}</p>
                                    <p className="mt-1 text-xs text-muted">{step.estimated_minutes > 0 ? `${step.estimated_minutes} min · ` : ''}{step.is_required ? 'Required' : 'Optional'}</p>
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    <Button variant="ghost" disabled={index === 0 || busy} onClick={() => void stepOrder(roadmap, step.id, -1)}>Move up</Button>
                                    <Button variant="ghost" disabled={index === orderedSteps.length - 1 || busy} onClick={() => void stepOrder(roadmap, step.id, 1)}>Move down</Button>
                                    <Button variant="ghost" onClick={() => {
                                      setEditingStepId(step.id)
                                        setStepTargetRoadmapId(step.roadmap_id)
                                        setStepForm({
                                        title: step.title,
                                        description: step.description,
                                        instructions: step.instructions,
                                        learning_objectives: step.learning_objectives,
                                        position: step.position,
                                        estimated_minutes: step.estimated_minutes,
                                        is_required: step.is_required,
                                      })
                                    }}>Edit</Button>
                                    <Button variant="ghost" onClick={() => {
                                      if (window.confirm(`Delete step "${step.title}"? Existing progress prevents deletion.`)) {
                                        void runAction(async () => { await deleteAdminStep(step.id); await refreshCore() }, 'Step deleted.')
                                      }
                                    }}>Delete</Button>
                                  </div>
                                </div>
                                <p className="mt-2 whitespace-pre-line text-sm text-body">{step.description}</p>
                                <p className="mt-2 whitespace-pre-line text-sm text-muted">{step.instructions}</p>
                                {step.learning_objectives.length > 0 && <ul className="mt-2 list-inside list-disc text-xs text-muted">{step.learning_objectives.map((objective) => <li key={objective}>{objective}</li>)}</ul>}
                                <div className="mt-3 space-y-2">
                                  {step.resources.map((resource, resourceIndex) => (
                                    <div key={resource.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                                      {getSafeResourceUrl(resource.url) ? (
                                        <a href={getSafeResourceUrl(resource.url) ?? undefined} target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-hover underline">{resource.title}</a>
                                      ) : (
                                        <span className="font-semibold text-muted">{resource.title} (invalid link)</span>
                                      )}
                                      <div className="flex gap-2">
                                        <Button variant="ghost" onClick={() => void runAction(async () => { await updateAdminResource(resource.id, { is_recommended: !resource.is_recommended }); await refreshCore() }, 'Resource updated.')}>{resource.is_recommended ? 'Unrecommend' : 'Recommend'}</Button>
                                        <Button variant="ghost" onClick={() => {
                                          setSelectedStepId(step.id)
                                          setEditingResourceId(resource.id)
                                          setResourceForm({
                                            title: resource.title,
                                            url: resource.url,
                                            description: resource.description,
                                            resource_type: resource.resource_type,
                                            is_recommended: resource.is_recommended,
                                            display_order: resource.display_order,
                                          })
                                        }}>Edit</Button>
                                        <Button variant="ghost" disabled={resourceIndex === 0} onClick={() => {
                                          const ids = step.resources.map((item) => item.id)
                                          if (resourceIndex > 0) [ids[resourceIndex], ids[resourceIndex - 1]] = [ids[resourceIndex - 1], ids[resourceIndex]]
                                          void resourceOrder(step.id, ids)
                                        }}>↑</Button>
                                        <Button variant="ghost" disabled={resourceIndex === step.resources.length - 1} onClick={() => {
                                          const ids = step.resources.map((item) => item.id)
                                          if (resourceIndex < ids.length - 1) [ids[resourceIndex], ids[resourceIndex + 1]] = [ids[resourceIndex + 1], ids[resourceIndex]]
                                          void resourceOrder(step.id, ids)
                                        }}>↓</Button>
                                        <Button variant="ghost" onClick={() => void runAction(async () => { await deleteAdminResource(resource.id); await refreshCore() }, 'Resource removed.')}>Remove</Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <Button variant="ghost" className="mt-2" onClick={() => {
                                  const closing = selectedStepId === step.id
                                  setSelectedStepId(closing ? null : step.id)
                                  setEditingResourceId(null)
                                  setResourceForm(defaultResourceForm)
                                }}>
                                  {selectedStepId === step.id ? 'Close resource form' : 'Add learning resource'}
                                </Button>
                                {selectedStepId === step.id && (
                                  <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={submitResource}>
                                    <Input label="Resource title" value={resourceForm.title} onChange={(event) => setResourceForm({ ...resourceForm, title: event.target.value })} required />
                                    <Input label="HTTPS or HTTP URL" type="url" value={resourceForm.url} onChange={(event) => setResourceForm({ ...resourceForm, url: event.target.value })} required />
                                    <Select label="Resource type" value={resourceForm.resource_type} options={['documentation', 'video', 'tutorial', 'article', 'practice', 'project'].map((value) => ({ value, label: value }))} onChange={(event) => setResourceForm({ ...resourceForm, resource_type: event.target.value as ResourcePayload['resource_type'] })} />
                                    <Input label="Description" value={resourceForm.description} onChange={(event) => setResourceForm({ ...resourceForm, description: event.target.value })} />
                                    <label className="flex items-center gap-2 text-sm text-body"><input type="checkbox" checked={resourceForm.is_recommended} onChange={(event) => setResourceForm({ ...resourceForm, is_recommended: event.target.checked })} className="accent-teal" />Recommended</label>
                                    <Button type="submit" disabled={busy}>{editingResourceId === null ? 'Add resource' : 'Save resource'}</Button>
                                  </form>
                                )}
                              </div>
                            ))}
                          </div>
                          <form className="mt-6 grid gap-3 rounded-2xl border border-teal/20 bg-teal-tint/50 p-4 sm:grid-cols-2" onSubmit={submitStep}>
                            <h4 className="font-bold text-heading sm:col-span-2">{editingStepId === null ? 'Add roadmap step' : 'Edit roadmap step'}</h4>
                            <Input label="Step title" value={stepForm.title} onChange={(event) => setStepForm({ ...stepForm, title: event.target.value })} required />
                            <Input label="Position" type="number" min="1" value={stepForm.position} onChange={(event) => setStepForm({ ...stepForm, position: Number(event.target.value) })} required />
                            <Input label="Estimated minutes" type="number" min="0" value={stepForm.estimated_minutes} onChange={(event) => setStepForm({ ...stepForm, estimated_minutes: Number(event.target.value) })} />
                            {editingStepId !== null && <Select label="Move to roadmap" value={stepTargetRoadmapId ?? selectedRoadmap ?? ''} options={roadmaps.map((item) => ({ value: item.id, label: item.title }))} onChange={(event) => setStepTargetRoadmapId(Number(event.target.value))} />}
                            <label className="flex items-center gap-2 text-sm text-body"><input type="checkbox" checked={stepForm.is_required} onChange={(event) => setStepForm({ ...stepForm, is_required: event.target.checked })} className="accent-teal" />Required step</label>
                            <label className="space-y-1.5 text-sm font-semibold text-heading sm:col-span-2">
                              <span>Description</span>
                              <textarea className="min-h-20 w-full rounded-xl border border-line bg-white p-3 text-sm font-normal text-body" value={stepForm.description} onChange={(event) => setStepForm({ ...stepForm, description: event.target.value })} />
                            </label>
                            <label className="space-y-1.5 text-sm font-semibold text-heading sm:col-span-2">
                              <span>Instructions</span>
                              <textarea className="min-h-20 w-full rounded-xl border border-line bg-white p-3 text-sm font-normal text-body" value={stepForm.instructions} onChange={(event) => setStepForm({ ...stepForm, instructions: event.target.value })} />
                            </label>
                            <label className="space-y-1.5 text-sm font-semibold text-heading sm:col-span-2">
                              <span>Learning objectives (one per line)</span>
                              <textarea className="min-h-20 w-full rounded-xl border border-line bg-white p-3 text-sm font-normal text-body" value={stepForm.learning_objectives.join('\n')} onChange={(event) => setStepForm({ ...stepForm, learning_objectives: event.target.value.split('\n').map((value) => value.trim()).filter(Boolean) })} />
                            </label>
                            <div className="flex gap-2">
                              <Button type="submit" disabled={busy}>{editingStepId === null ? 'Add step' : 'Save step'}</Button>
                              {editingStepId !== null && <Button type="button" variant="secondary" onClick={() => { setEditingStepId(null); setStepForm(defaultStepForm()) }}>Cancel</Button>}
                            </div>
                          </form>
                        </div>
                      )}
                    </Card>
                  )
                })}
                {filteredRoadmaps.length === 0 && (
                  <Card className="p-5 text-sm text-muted">
                    {roadmaps.length === 0 ? 'No roadmaps yet. Create one above.' : 'No roadmaps match these filters.'}
                  </Card>
                )}
              </div>
            </div>
          )}

          {section === 'students' && (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)]">
              <div>
                <Input label="Search students" value={search} onChange={(event) => { setPage(1); setSearch(event.target.value) }} placeholder="Name or email" />
                <div className="mt-4 space-y-3">
                  {studentsLoading && <p className="py-3 text-sm text-muted" role="status">Loading students…</p>}
                  {(students?.items ?? []).map((student) => (
                    <button
                      key={student.id}
                      type="button"
                      aria-pressed={selectedStudent?.id === student.id}
                      className={`w-full rounded-2xl border border-line bg-white p-4 text-left shadow-card transition hover:-translate-y-0.5 hover:border-teal/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 ${selectedStudent?.id === student.id ? 'ring-2 ring-teal' : ''}`}
                      onClick={() => void selectStudent(student)}
                    >
                      <p className="font-semibold text-heading">{student.name}</p>
                      <p className="mt-1 text-sm text-muted">{student.email} · {student.domain.name}</p>
                    </button>
                  ))}
                  {!studentsLoading && students?.items.length === 0 && (
                    <Card className="p-5 text-sm text-muted">No students found.</Card>
                  )}
                </div>
                {students && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
                    <span>{students.total} students · page {students.page}</span>
                    <div className="flex gap-2">
                      <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
                      <Button variant="secondary" disabled={page * students.page_size >= students.total} onClick={() => setPage(page + 1)}>Next</Button>
                    </div>
                  </div>
                )}
              </div>
              {selectedStudent ? (
                <Card className="h-fit p-5">
                  <h2 className="text-xl font-bold text-heading">{selectedStudent.name}</h2>
                  <p className="mt-1 text-sm text-muted">{selectedStudent.email}</p>
                  <div className="mt-4 space-y-3">
                    <Input label="Student name" value={selectedStudent.name} onChange={(event) => setSelectedStudent({ ...selectedStudent, name: event.target.value })} />
                    <Select label="Learning domain" value={selectedStudent.domain.id} options={domains.map((domain) => ({ value: domain.id, label: domain.name }))} onChange={(event) => setSelectedStudent({ ...selectedStudent, domain: domains.find((domain) => domain.id === Number(event.target.value)) ?? selectedStudent.domain })} />
                    <label className="flex items-center gap-2 text-sm text-body">
                      <input type="checkbox" checked={selectedStudent.is_active} onChange={(event) => setSelectedStudent({ ...selectedStudent, is_active: event.target.checked })} className="accent-teal" />
                      Account active
                    </label>
                    <Button onClick={() => void saveStudent({ name: selectedStudent.name, domain_id: selectedStudent.domain.id, is_active: selectedStudent.is_active })} disabled={busy}>Save student profile</Button>
                  </div>
                  <div className="mt-5 border-t border-line pt-4">
                    <h3 className="font-bold text-heading">Roadmap progress</h3>
                    <div className="mt-3 space-y-3">
                      {selectedStudent.roadmap_progress.map((item) => (
                        <div key={item.roadmap_id} className="rounded-xl bg-page p-3">
                          <p className="text-sm font-semibold text-heading">{item.roadmap_title}</p>
                          <p className="mt-1 text-xs text-muted">{item.completed_required_steps}/{item.total_required_steps} required · {Math.round(item.progress_percentage)}%</p>
                          <div
                            className="mt-2 h-2 overflow-hidden rounded-full bg-violet-tint"
                            role="progressbar"
                            aria-label={`${item.roadmap_title} completion`}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={Math.round(item.progress_percentage)}
                          >
                            <div className="h-full rounded-full bg-gradient-brand" style={{ width: `${item.progress_percentage}%` }} />
                          </div>
                        </div>
                      ))}
                      {!selectedStudent.roadmap_progress.length && <p className="text-sm text-muted">No roadmap activity yet.</p>}
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="grid min-h-36 place-items-center p-5 text-center text-sm text-muted">Select a student to view their profile and progress.</Card>
              )}
            </div>
          )}
        </>
      )}
      </section>
      </div>
      </div>
    </div>
  )
}
