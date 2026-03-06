# Ai-Tutor-Bot

Ai-Tutor-Bot is an intelligent, AI-powered learning and tutoring platform designed to help students master subjects with personalized study plans, interactive quizzes, and a comprehensive progress tracking system. Leveraging the power of Google Generative AI, this application provides dynamic, context-aware educational experiences.

## 🌟 Features

- **Personalized Study Plans:** Generate customized learning paths using Google Generative AI (`app/api/generate-study-plan`).
- **Dynamic Quiz Generation:** Create instant, topic-specific quizzes with AI to test your knowledge (`app/api/generate-quiz`).
- **Interactive Chat Interface:** Ask questions, get explanations, and converse with an AI tutor directly in the app.
- **Progress & Learning Tracking:** Monitor your learning milestones and visually track your academic progress.
- **Subject Management:** Organize and manage your different learning topics seamlessly.
- **User Authentication:** Secure login, registration, and session management powered by Supabase.
- **User Dashboard & Profiles:** A dedicated space for tailored learning analytics and personalized settings.
- **Responsive & Modern UI:** Built with Radix UI primitives and TailwindCSS for a beautiful, accessible experience on any device.

## 🛠 Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Library:** [React](https://reactjs.org/) (v18)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [TailwindCSS](https://tailwindcss.com/)
- **UI Components:** [Radix UI](https://www.radix-ui.com/)
- **Database & Authentication:** [Supabase](https://supabase.com/)
- **AI Integration:** [Google Generative AI SDK](https://ai.google.dev/) (`@google/generative-ai`)
- **Forms & Validation:** `react-hook-form` and `zod`
- **Charts:** `recharts` for progress visualization
- **Markdown Rendering:** `react-markdown`, `remark-math`, and `rehype-katex` for formula support

## 🚀 Installation & Setup

To get this project running on your local machine, follow these steps:

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [Git](https://git-scm.com/)
- A package manager: npm, yarn, or pnpm (recommended)

### 1. Clone the repository

```bash
git clone https://github.com/Sam49/Ai-Tutor-Bot.git
cd Ai-Tutor-Bot
```

### 2. Install dependencies

```bash
# Using pnpm (recommended)
pnpm install

# Using npm
npm install
```

### 3. Set up Environment Variables

Create a `.env.local` file in the root of your project and configure your environment variables based on the services used:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key # For server-side operations if required

# Google Generative AI
GEMINI_API_KEY=your_google_gemini_api_key
```

### 4. Start the Development Server

```bash
# Using pnpm
pnpm dev

# Using npm
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application in action.

## 📖 Usage Flow

1. **Register/Login:** Start by creating an account or logging into an existing one via the `/register` or `/login` routes.
2. **Dashboard Overview:** Upon authentication, navigate to your `/dashboard` to view your current subjects and progress.
3. **Generate a Study Plan:** Use the subject manager to pick a topic and request the AI to generate a structured learning path.
4. **Take Quizzes:** Validate your knowledge by requesting an AI-generated quiz on specific sub-topics.
5. **Chat with AI Tutor:** Use the AI Chat feature to clarify doubts, ask for elaborations, or understand complex concepts.
6. **Track Progress:** Regularly check your learning tracker to visualize the milestones you've achieved.

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📫 Contact

Sam49 - [https://github.com/Sam49](https://github.com/Sam49)

Project Link: [https://github.com/Sam49/Ai-Tutor-Bot](https://github.com/Sam49/Ai-Tutor-Bot)
