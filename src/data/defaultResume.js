export const defaultResume = {
  name: 'Jordan Taylor',
  subtitle: 'Lead User Experience Architect & Frontend Engineer',
  contacts: [
    { label: 'jordan.taylor@resumeforge.dev', link: 'mailto:jordan.taylor@resumeforge.dev' },
    { label: 'linkedin.com/in/jordantaylor', link: 'https://linkedin.com/in/jordantaylor' },
    { label: '+1 (555) 762-0943', link: '' },
    { label: 'San Francisco, CA', link: '' },
  ],
  sections: [
    {
      title: 'PROFILE SUMMARY',
      kind: 'paragraph',
      indented: true,
      items: [
        {
          paragraph: 'A __highly motivated__ and *innovative* Senior UX Architect and Frontend Engineer with 6+ years of experience crafting *modular design systems* and *premium web experiences*. Specializes in balancing technical feasibility with aesthetic elegance to build solutions that users __love__.\n\nDemonstrated history of leading cross-functional teams to deliver high-impact software products with *vibrant design aesthetics* and clean UI architectures.',
        }
      ]
    },
    {
      title: 'EDUCATION',
      kind: 'education',
      items: [
        {
          degree: 'School of Design',
          school: 'Harvard University',
          location: 'Cambridge, MA',
          subtitle: 'B.Sc. in Visual Communication',
          dates: '2016 - 2020',
          bullets: [
            'Graduated __summa cum laude__ with honors thesis on *accessible product architectures*.',
            'Mentored under Prof. Marcus Vance in __Advanced User Interface Systems__.'
          ]
        }
      ]
    },
    {
      title: 'PROFESSIONAL EXPERIENCE',
      kind: 'custom',
      items: [
        {
          title: 'Lead Product Designer',
          location: 'Remote',
          subtitle: 'Forge Studio',
          dates: '2022 - Present',
          details: [
            'Led a cross-functional team of __8 engineers__ and *3 designers* to ship a modern SaaS editor.',
            'Shipped *12 premium resume templates* in __React/Vanilla CSS__, boosting signups by *45%*.',
            'Crafted *interactive micro-interactions* that improved active user retention by __18%__.'
          ]
        },
        {
          title: 'Senior UI/UX Designer',
          location: 'Boston, MA',
          subtitle: 'Design Guild',
          dates: '2020 - 2022',
          details: [
            'Designed complex B2B dashboards with *dense data visualization* and customizable widgets.',
            'Established the company’s first unified __Design Token System__, reducing frontend handoff time by *30%*.',
            'Conducted *30+ deep-dive user interviews* to restructure core navigation workflows.'
          ]
        }
      ]
    },
    {
      title: 'KEY PROJECTS',
      kind: 'custom',
      items: [
        {
          title: 'ResumeForge App',
          location: 'Remote',
          subtitle: 'Open-Source Creator',
          dates: '2023 - Present',
          details: [
            'Created a client-side *modular builder* utilizing __Dnd-kit__ for smooth drag-and-drop actions.',
            'Implemented instant *PDF rendering* in __jsPDF__ with real-time preview updating.',
            'Engineered __smart overflow detection__ and dynamic section layout balancing.'
          ]
        }
      ]
    },
    {
      title: 'CORE SKILLS',
      kind: 'list',
      items: [
        {
          title: 'Technical & Design Proficiencies',
          subtitle: '',
          location: '',
          dates: '',
          details: [
            '__Core Design:__ Figma, design tokens, *micro-animations*, glassmorphic UI, responsive layouts',
            '__Web Development:__ HTML5, CSS3 Flexbox/Grid, Javascript (ES6+), React, *TailwindCSS*',
            '__Product Strategy:__ Rapid prototyping, A/B testing, user journey mapping, usability testing'
          ]
        }
      ]
    },
    {
      title: 'LANGUAGES',
      kind: 'language',
      items: ['English (Native)', 'Spanish (Fluent)', 'Arabic (Bilingual)', 'French (Conversational)']
    },
    {
      title: 'PROFESSIONAL PHILOSOPHY',
      kind: 'paragraph',
      indented: false,
      items: [
        {
          paragraph: 'I believe that great design is invisible. It should feel __natural__, *effortless*, and __completely intuitive__. My goal is to build interfaces that do not require an explanation, but rather guide the user through *delightful micro-interactions* and __sleek typography__.'
        }
      ]
    }
  ]
}
