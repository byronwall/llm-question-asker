# Decisory

Guided questions. Better decisions.

An AI-powered consultation tool that helps you make better decisions through structured, guided question-and-answer sessions.

## Screenshots

### Home Page

![Home page showing recent sessions](./docs/screenshot-home.png)

### Consultation Session

![Active consultation session with questions and analysis](./docs/screenshot-session.png)

## What is Decisory?

Decisory is an intelligent consultation assistant that guides you through complex decisions by asking targeted questions and providing AI-generated analysis. Instead of staring at a blank page, you get a structured conversation that helps you think through your needs and receive tailored recommendations.

## Key Features

### 🎯 Smart Consultation Sessions

- **Start with your goal** - Describe what you want to achieve in plain language
- **AI-generated questions** - Get 8-12 thoughtful questions tailored to your specific situation
- **Multiple choice + custom input** - Answer with predefined options or add your own context
- **Comprehensive analysis** - Receive detailed recommendations based on your answers

### 🔄 Iterative Refinement

- **Multiple rounds** - Refine your consultation with additional question rounds
- **Context-aware follow-ups** - Each round builds on previous answers
- **Track your journey** - See all questions and answers from every round

### 📝 Session Management

- **Auto-generated summaries** - Each session gets an AI-created title (5 words) and description (40 words)
- **Browse past sessions** - Quick access to all your previous consultations
- **Persistent storage** - All sessions saved locally in JSON format

### 💡 Smart UI Features

- **Collapsible sections** - Questions auto-collapse after submission to focus on results
- **Expandable prompts** - Long initial prompts are limited to 7 lines with expand option
- **Gradient previews** - See content previews with smooth fade effects
- **Copy as Markdown** - Export analysis results in markdown format
- **Back navigation** - Easily return to session list from any consultation

### 🎨 Clean Design

- **Card-based layout** - Organized, scannable interface
- **Proper spacing** - Comfortable reading experience
- **Responsive typography** - Clear hierarchy and readable text
- **Smooth interactions** - Hover states and transitions throughout

## How It Works

1. **Create a Session**
   - Enter your goal or question on the home page
   - AI generates a custom title and description
   - Receive your first round of targeted questions

2. **Answer Questions**
   - Select from multiple-choice options
   - Add custom details in the "Other" field for any question
   - Submit when ready

3. **Review Analysis**
   - Get comprehensive AI-generated recommendations
   - Copy results as markdown for use elsewhere
   - View collapsed questions or expand to review your answers

4. **Refine (Optional)**
   - Start another round to dive deeper
   - Questions adapt based on your previous answers
   - Build a complete picture through multiple iterations

## Use Cases

- **Project planning** - Explore ideas and get actionable next steps
- **Decision making** - Compare options and receive recommendations
- **Trip planning** - Get personalized travel suggestions based on preferences
- **Product research** - Find the best solution for your specific needs
- **Learning paths** - Discover resources and approaches for new skills

## Tech Stack

- **Frontend**: SolidJS + SolidStart
- **Styling**: Panda CSS + Ark UI
- **AI**: OpenAI API (GPT-4o)
- **Storage**: File-based JSON database
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+
- OpenAI API key

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/llm-question-asker.git
cd llm-question-asker

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your OPENAI_API_KEY to .env

# Start development server
npm run dev
```

### Environment Variables

```env
OPENAI_API_KEY=your_api_key_here
AI_MODEL=gpt-4o  # Optional, defaults to gpt-4o
```

## Project Structure

```
app/
├── src/
│   ├── components/
│   │   └── consultation/    # Session components
│   ├── routes/              # Page routes
│   ├── server/              # Server actions & AI
│   └── lib/                 # Shared utilities
└── data/
    └── sessions/            # JSON session storage
```

## License

None, I might try to make money off of this later.
