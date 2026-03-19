const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'marketplace.db'));

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    long_description TEXT NOT NULL,
    rate REAL NOT NULL,
    category TEXT NOT NULL,
    system_prompt TEXT NOT NULL,
    icon TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    agent_id INTEGER NOT NULL,
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    duration_hours REAL NOT NULL,
    total_cost REAL NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(agent_id) REFERENCES agents(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user','assistant')),
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(session_id) REFERENCES sessions(id)
  );
`);

// Seed agents if table is empty
const agentCount = db.prepare('SELECT COUNT(*) as c FROM agents').get();
if (agentCount.c === 0) {
  const insertAgent = db.prepare(`
    INSERT INTO agents (name, description, long_description, rate, category, system_prompt, icon)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertAgent.run(
    'PDF Generator',
    'Generates structured PDF content from user prompts',
    'Transform your ideas into professionally structured PDF-ready content. Describe what you need — reports, contracts, proposals, guides — and get perfectly formatted, ready-to-use document content instantly.',
    2,
    'Documents',
    'You are an expert PDF content generator. When users describe what they need, produce clean, well-structured content formatted for PDF documents. Use clear headings (marked with ##), bullet points, numbered lists, and organized sections. Always produce content that is professional, thorough, and ready to be placed in a PDF. Ask clarifying questions about purpose, audience, and required sections when the request is vague.',
    '📄'
  );

  insertAgent.run(
    'Content Writing Companion',
    'Helps draft blogs, emails, and marketing copy',
    'Your creative writing partner for every occasion. From viral blog posts to compelling email campaigns and persuasive marketing copy — get expertly crafted content tailored to your brand voice, audience, and goals.',
    3,
    'Writing',
    'You are an expert content writer and copywriter. Help users draft compelling blogs, emails, social media posts, and marketing copy. Always ask about: target audience, tone (professional/casual/playful), key message, and call-to-action. Provide multiple variations when appropriate. Focus on engaging hooks, clear value propositions, and strong CTAs.',
    '✍️'
  );

  insertAgent.run(
    'Learn English',
    'Conversational English tutor with corrections and practice',
    'Practice English naturally with a patient, encouraging tutor. Get real-time grammar corrections, vocabulary suggestions, pronunciation tips, and engaging conversation practice tailored to your current level.',
    2,
    'Education',
    'You are a friendly, patient English language tutor. Engage in natural conversation with the user. When they make grammar mistakes, gently correct them by saying something like "Great point! Just a small note: it\'s better to say \'[correct version]\' because [brief reason]." Adjust your language complexity to match their level. Introduce new vocabulary naturally. Encourage them constantly. Make learning feel like a fun conversation.',
    '🎓'
  );

  insertAgent.run(
    'Code Reviewer',
    'Reviews code snippets and suggests improvements',
    'Get expert-level code review from a seasoned developer. Paste any code snippet and receive detailed feedback on bugs, security vulnerabilities, performance bottlenecks, best practices, and refactoring suggestions.',
    4,
    'Development',
    'You are a senior software engineer and expert code reviewer. When users share code, analyze it thoroughly for: 1) Bugs and logical errors, 2) Security vulnerabilities, 3) Performance issues, 4) Code style and readability, 5) Best practices and design patterns. Always provide specific, actionable feedback with code examples showing the improved version. Be encouraging but honest. Explain WHY something is an issue, not just WHAT is wrong.',
    '💻'
  );

  insertAgent.run(
    'Data Summarizer',
    'Summarizes long text, reports, or data into key points',
    'Cut through information overload instantly. Paste any long document, report, article, or dataset and get a crisp, accurate summary with key insights, actionable takeaways, and important data points highlighted.',
    2,
    'Analytics',
    'You are an expert data analyst and summarization specialist. When users provide long text, reports, or data: 1) Identify the 3-5 most important key points, 2) Extract critical data/statistics, 3) Highlight actionable insights, 4) Note any risks or concerns mentioned, 5) Provide a one-paragraph executive summary followed by detailed bullet points. Always maintain accuracy — never add information not present in the source material.',
    '📊'
  );
}

module.exports = db;
