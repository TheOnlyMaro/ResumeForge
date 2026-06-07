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
          paragraph: 'A *highly motivated* and *innovative* Senior UX Architect and Frontend Engineer with 6+ years of experience crafting *modular design systems* and *premium web experiences*. Specializes in balancing technical feasibility with aesthetic elegance to build solutions that users *love*.\n\nDemonstrated history of leading cross-functional teams to deliver high-impact software products with *vibrant design aesthetics* and clean UI architectures.',
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
            'Graduated _summa cum laude_ with honors thesis on *accessible product architectures*.',
            'Mentored under Prof. Marcus Vance in *Advanced User Interface Systems*.'
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
            'Led a cross-functional team of *8 engineers* and *3 designers* to ship a modern SaaS editor.',
            'Shipped *12 premium resume templates* in *React/Vanilla CSS*, boosting signups by *45%*.',
            'Crafted *interactive micro-interactions* that improved active user retention by *18%*.'
          ]
        },
        {
          title: 'Senior UI/UX Designer',
          location: 'Boston, MA',
          subtitle: 'Design Guild',
          dates: '2020 - 2022',
          details: [
            'Designed complex B2B dashboards with *dense data visualization* and customizable widgets.',
            'Established the company’s first unified *Design Token System*, reducing frontend handoff time by *30%*.',
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
            'Created a client-side *modular builder* utilizing *Dnd-kit* for smooth drag-and-drop actions.',
            'Implemented instant *PDF rendering* in *jsPDF* with real-time preview updating.',
            'Engineered *smart overflow detection* and dynamic section layout balancing.'
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
            '*Core Design:* Figma, design tokens, *micro-animations*, glassmorphic UI, responsive layouts',
            '*Web Development:* HTML5, CSS3 Flexbox/Grid, Javascript (ES6+), React, *TailwindCSS*',
            '*Product Strategy:* Rapid prototyping, A/B testing, user journey mapping, usability testing'
          ]
        }
      ]
    },
    {
      title: 'EMBEDDED SYSTEMS (TEST FORMATTING)',
      kind: 'custom',
      items: [
        {
          title: 'Embedded Systems Project',
          location: 'Electronics Lab',
          subtitle: 'Microcontroller Development',
          dates: '2024',
          details: [
            'Built an interrupt-driven embedded *C* application on *TM4C123GH6PM* implementing a 4-mode *finite state machine*: temperature monitor, countdown timer, stopwatch, and *UART* calculator.',
            'Implemented non-blocking button debounce and centralized *NVIC* interrupt management; structured code into separate driver, mode-logic, and orchestration modules.',
            '*Technologies:* *Keil MDK*, *ADC*, *SysTick*, hardware timers.'
          ]
        },
        {
          title: 'Two-Board System Design',
          location: 'Embedded Lab',
          subtitle: 'Secure Access Control',
          dates: '2024',
          details: [
            'Designed a two-board embedded system on *TM4C123GH6PM*: an *HMI_ECU* handling user input and display, and a *CONTROL_ECU* managing password verification, door actuation, and brute-force lockout.',
            'Established inter-board communication over *UART*; concentrated hardware mappings in a *HAL* layer for portability across pin configurations.'
          ]
        }
      ]
    },
    {
      title: 'LANGUAGES',
      kind: 'language',
      items: ['English (Native)', 'Spanish (Fluent)', 'Arabic (Bilingual)', 'French (Conversational)']
    }
  ]
}
