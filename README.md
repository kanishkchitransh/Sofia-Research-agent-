# Sofia: The AI-Powered Research Workplace

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-Production%20Ready-green.svg)
![Tech](https://img.shields.io/badge/AI-Gemini%202.5%20%26%203.0-purple)

**Sofia** is more than just a chatbot; it is a **comprehensive research workplace** designed to streamline the entire literature review lifecycle. By integrating a competitive PDF viewer, semantic knowledge graphs, and specialized AI agents into a single interface, Sofia transforms how researchers interact with scientific papers.

---

## 🎯 Why I Built This: A Product Management Showcase

> *"I built Sofia to demonstrate how deep domain knowledge (Research/NLP) combined with Program Management execution can create products that actually solve user problems."*

As a researcher myself, I identified a critical fragmentation in the academic workflow: we read PDFs in one app, search authors in a browser, take notes in a doc, and use generic AI for synthesis. Context is lost at every switch.

**This project showcases my ability to:**
1.  **Identify User Needs**: Researchers need a "Workplace," not just a tool. I mapped the user journey from discovery (Corpus) to synthesis (Gap Analysis) to networking (Author Intel).
2.  **Leverage Technical Knowledge**: Using my NLP background, I architected specific agents. For example, the *Citation Analysis* feature doesn't just summarize; it understands the *intent* behind a citation.
3.  **Execute End-to-End**: This is a production-ready application built entirely using **Google AI Studio**, demonstrating rapid prototyping, technical feasibility assessment, and final delivery polish.

---

## 🚀 Key Features

Sofia is architected as a suite of specialized agents working in concert:

### 1. 📚 Smart Corpus Management
*   **Metadata Extraction**: Automatically extracts Titles and Authors from raw PDFs upon upload using Gemini Flash.
*   **Semantic Search**: Filter your personal library by concept, title, or author.
*   **Integrated Workflow**: Switch context instantly without losing your chat history or insights.

### 2. 🧠 Semantic Knowledge Graph
*   **Visual Clustering**: Dynamically clusters your research papers into semantic topics (e.g., "Computer Vision," "LLMs").
*   **Interactive UI**: A physics-based graph allowing you to see how your library connects.

### 3. 🕵️ Author Intelligence Agent
*   **Deep Profiling**: Uses **Google Search Grounding** to build real-time profiles of researchers.
*   **Visual Analytics**: Generates citation impact charts and visualizes collaboration networks.
*   **Headspace Analysis**: Summarizes an author's research trajectory and key interests.

### 4. 📝 Interactive PDF Viewer
*   **Active Reading**: Highlight text in multiple colors and add sticky notes.
*   **Contextual Q&A**: Select any text in a PDF and "Ask Sofia" to explain it immediately.
*   **Zoom & Pan**: A robust, custom-built image viewer for complex scientific figures.

### 5. 🔬 Specialized Research Agents
*   **Gap Analysis Mode**: Uses **Gemini 3.0 Pro** (Reasoning model) to synthesize multiple papers and identify what is missing in the field.
*   **Citation Analyst**: specific agent designed to explain *why* a paper cited another work.
*   **Insight Memory**: A dedicated "Long-term Memory" panel where users can pin key findings. Sofia actively recalls these insights during future conversations.

---

## 🛠️ Technical Architecture

This application is built for performance and reliability.

*   **Frontend**: React 19, TypeScript, Tailwind CSS.
*   **AI Orchestration**: Google GenAI SDK (Gemini 2.5 Flash for latency-sensitive tasks, Gemini 3.0 Pro for reasoning).
*   **PDF Engine**: Custom implementation using `pdf.js` with canvas rendering and overlay layers for annotations.
*   **Data Visualization**: Recharts for analytics, SVG manipulation for Knowledge Graphs.
*   **Tooling**: Google Search Grounding tool for live data fetching.

### Agentic Workflow
When a user asks a question, Sofia routes the request through a decision layer:
1.  **Intent Classification**: Is the user asking for a bio? A gap analysis? A visual enhancement?
2.  **Tool Execution**: 
    *   *Need external info?* -> Call Google Search Tool.
    *   *Need to read a paper?* -> Call `openPaper` function tool.
    *   *Need to find a chart?* -> Use Vision model to crop and enhance figures.
3.  **Synthesis**: The model combines context from the Active Paper, the Corpus Index, and User Insights to generate a response.

---

## 🏁 Getting Started

### Prerequisites
*   Node.js (v18+)
*   A Google AI Studio API Key (with access to Gemini 2.5/3.0)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/sofia-research-agent.git
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up environment variables:
    *   Create a `.env` file.
    *   Add `API_KEY=your_google_ai_studio_key`.
4.  Run the development server:
    ```bash
    npm start
    ```

---

## 🔮 Future Roadmap

*   **Collaborative Workspaces**: Real-time multiplayer mode for research labs.
*   **Zotero/Mendeley Integration**: Direct sync with existing reference managers.
*   **Audio Overviews**: Generating podcast-style summaries of papers using Gemini Audio capabilities.

---

