
import { GoogleGenAI, GenerateContentResponse, Chat, FunctionDeclaration, Type } from "@google/genai";
import { Message, AuthorProfile, Paper, GraphCluster, Insight } from "../types";

// Ensure API Key exists
const API_KEY = process.env.API_KEY || '';

// Access global PDF.js
const getPdfLib = () => (window as any).pdfjsLib;

// Tool Definition for Opening Papers
const openPaperTool: FunctionDeclaration = {
  name: "openPaper",
  description: "Opens a specific research paper in the viewer. Use this when the user explicitly asks to read, view, or open a paper from the corpus list.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      paperId: {
        type: Type.STRING,
        description: "The exact ID of the paper to open from the Corpus Index.",
      },
    },
    required: ["paperId"],
  },
};

class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: API_KEY });
  }

  // --- NEW: EXTRACT METADATA (Title/Authors) ---
  async extractPaperMetadata(firstPageText: string, originalFilename: string): Promise<{title: string, authors: string[]}> {
      const prompt = `
        Analyze the following text from the first page of a research paper.
        Extract the **Title** and the list of **Authors**.
        
        Text: "${firstPageText.substring(0, 2000)}"
        
        Return ONLY valid JSON:
        {
          "title": "Full Paper Title",
          "authors": ["Author 1", "Author 2", "Author 3"]
        }
        
        If you cannot find the title, use "${originalFilename}".
        If you cannot find authors, return an empty array.
      `;

      try {
          const response = await this.ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt,
              config: { responseMimeType: 'application/json' }
          });
          
          const text = response.text || "{}";
          const data = JSON.parse(text);
          return {
              title: data.title || originalFilename,
              authors: Array.isArray(data.authors) ? data.authors : []
          };
      } catch (e) {
          console.warn("Metadata extraction failed", e);
          return { title: originalFilename, authors: [] };
      }
  }

  // --- NEW: SEMANTIC CLUSTERING FOR KNOWLEDGE GRAPH ---
  async generateKnowledgeGraph(papers: Paper[]): Promise<GraphCluster[]> {
    if (papers.length === 0) return [];
    
    // Prepare a lightweight list for the LLM
    const paperList = papers.map(p => `ID: ${p.id}, Title: ${p.title}`).join('\n');

    const prompt = `
      You are an expert research librarian. I have a list of ${papers.length} research papers.
      
      Task: Group these papers into distinct, high-level Semantic Research Topics based on their titles.
      
      Rules:
      1. Create between 3 to 6 topics maximum.
      2. Topics should be short (2-3 words, e.g., "Large Language Models", "Computer Vision", "Reinforcement Learning").
      3. Assign EVERY paper ID to exactly one topic.
      4. Return ONLY a valid JSON array.
      
      Input Papers:
      ${paperList}
      
      Expected Output Format:
      [
        { "topic": "Topic Name", "paperIds": ["id1", "id2"] },
        ...
      ]
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      
      const text = response.text || "[]";
      const clusters = JSON.parse(text) as GraphCluster[];
      return clusters;
    } catch (e) {
      console.error("Graph generation failed", e);
      // Fallback: Return a single "General" cluster containing all papers
      return [{ topic: "General Collection", paperIds: papers.map(p => p.id) }];
    }
  }

  // Helper to extract specific figure identifiers from a query
  private async extractFigureTargets(query: string): Promise<string[]> {
      try {
        const response = await this.ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Extract all specific figure, table, or chart identifiers from this user query: "${query}". 
            Return ONLY a JSON array of strings. 
            Example Output: ["Figure 1", "Figure 2"]. 
            If no specific numbers are mentioned, but "figures" is asked, try to infer or return ["Figure 1"].
            If the query implies "Figure 1 and 2", return ["Figure 1", "Figure 2"].
            If "Figure 1, 2, and 3" -> ["Figure 1", "Figure 2", "Figure 3"].`,
            config: { responseMimeType: 'application/json' }
        });
        const text = response.text || "[]";
        const targets = JSON.parse(text);
        return Array.isArray(targets) && targets.length > 0 ? targets : [query]; 
      } catch (e) {
          console.warn("Target extraction failed, using raw query", e);
          return [query];
      }
  }

  // Helper to find which page a figure/table is on
  private async findPageForQuery(pdfUrl: string, query: string): Promise<number> {
    const pdfjs = getPdfLib();
    if (!pdfjs) return 1;

    const match = query.match(/(Figure|Fig\.?|Table)\s*(\d+)/i);
    if (!match) return 1;

    const labelType = match[1].toLowerCase().startsWith('t') ? 'table' : 'figure';
    const number = match[2];
    
    // Strict regex for Caption: Start of line or sentence, followed by number and colon/period
    // e.g. "Figure 1:" or "Fig. 1."
    const captionPattern = new RegExp(`(${labelType}|fig\\.?)\\s*${number}[.:]`, 'i');
    
    // Loose fallback
    const loosePattern = new RegExp(`(${labelType}|fig\\.?)\\s*${number}`, 'i');

    try {
      const loadingTask = pdfjs.getDocument(pdfUrl);
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      const maxScan = Math.min(numPages, 30); 
      
      let bestPage = 1;
      let foundStrict = false;

      for (let i = 1; i <= maxScan; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        // Join items with some separation to detect starts
        const text = textContent.items.map((item: any) => item.str).join(' '); 
        
        if (captionPattern.test(text)) {
            return i; // Found strict caption match, return immediately
        }
        
        if (!foundStrict && loosePattern.test(text)) {
            bestPage = i; // Keep as backup
            // Don't return yet, keep looking for strict match
        }
      }
      return bestPage;
    } catch (e) {
      console.error("Error searching PDF", e);
    }
    return 1;
  }

  private async renderPageAsImage(pdfUrl: string, pageNum: number): Promise<string> {
    const pdfjs = getPdfLib();
    const loadingTask = pdfjs.getDocument(pdfUrl);
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2.0 }); 
    
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    const context = canvas.getContext('2d');
    if (!context) throw new Error("Canvas context not available");
    
    await page.render({ canvasContext: context, viewport }).promise;
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    return dataUrl.split(',')[1];
  }

  // Helper to crop an image based on normalized [ymin, xmin, ymax, xmax] 0-1000
  private async cropImage(base64Image: string, box: number[]): Promise<string> {
      return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
              const [ymin, xmin, ymax, xmax] = box;
              const width = img.width;
              const height = img.height;
              
              const rY = ymin / 1000;
              const rX = xmin / 1000;
              const rH = (ymax - ymin) / 1000;
              const rW = (xmax - xmin) / 1000;

              if (rW <= 0 || rH <= 0) {
                  resolve(base64Image);
                  return;
              }

              const canvas = document.createElement('canvas');
              canvas.width = width * rW;
              canvas.height = height * rH;
              const ctx = canvas.getContext('2d');
              
              if(ctx) {
                  ctx.drawImage(
                      img, 
                      width * rX, height * rY, width * rW, height * rH, 
                      0, 0, canvas.width, canvas.height
                  );
                  resolve(canvas.toDataURL('image/jpeg').split(',')[1]);
              } else {
                  resolve(base64Image); 
              }
          };
          img.onerror = () => {
              resolve(base64Image);
          };
          img.src = `data:image/jpeg;base64,${base64Image}`;
      });
  }

  async sendMessage(text: string, papers: Paper[], activePaper: Paper | null, insights: Insight[] = []): Promise<Message> {
    // Construct corpus summary so the model knows what papers are available
    // NOTE: Includes ID, Title AND AUTHORS to allow finding papers by author.
    const corpusSummary = papers.length > 0 
        ? `\n\n--- CORPUS INDEX ---\nThe user has the following ${papers.length} papers available:\n${papers.map((p, i) => `ID: ${p.id} | Title: ${p.title} | Authors: ${p.authors.join(', ')}`).join('\n')}\n--- END CORPUS ---`
        : '\n\n--- CORPUS INDEX ---\n(Empty)\n--- END CORPUS ---';

    // Construct Insights Context
    const insightsContext = insights.length > 0
        ? `\n\n--- USER SAVED INSIGHTS ---\n(These are key thoughts the user wants to remember. If the current query relates to these, explicitly remind the user: "This relates to your insight: [Insight content]")\n${insights.map((ins, i) => `Insight ${i+1}: ${ins.content}`).join('\n')}\n--- END INSIGHTS ---`
        : '';

    const context = activePaper 
      ? `Current Active Paper: ${activePaper.title}\nAbstract: ${activePaper.abstract || 'N/A'}${corpusSummary}${insightsContext}\n\nUser Query: ${text}`
      : `User Query: ${text}${corpusSummary}${insightsContext}`;

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: context,
      config: {
        systemInstruction: `You are Sofia, an elite research assistant. 
        
        GUIDELINES:
        1. **Format**: Use Markdown. Always use **numbered lists** (1. 2. 3.) when enumerating papers, key points, or reasons. Use **bold** for emphasis.
        2. **Corpus Awareness**: You have access to the "Corpus Index". If asked to list papers or find a paper by a specific AUTHOR, search the "Authors" field in the index.
        3. **Opening Papers**: If the user asks to "open", "read", or "show" a specific paper (by Title OR Author) from the corpus, USE the 'openPaper' tool with the correct ID from the index.
        4. **Insight Recall**: You have access to "USER SAVED INSIGHTS". **Aggressively check** if the user's current query or the paper being analyzed supports, contradicts, or relates to any saved insight. If it does, add a dedicated section "💡 Insight Recall" and explain the connection.
        5. **Tone**: Precise, concise, and academic. 
        6. **Reasoning**: When answering questions, provide structured, step-by-step reasoning.`,
        tools: [{ functionDeclarations: [openPaperTool] }]
      }
    });

    // Check for Tool Calls (Open Paper)
    if (response.functionCalls && response.functionCalls.length > 0) {
        const call = response.functionCalls[0];
        if (call.name === 'openPaper') {
            const paperId = (call.args as any).paperId;
            // Return a special message that the UI will intercept to switch papers
            return {
                id: crypto.randomUUID(),
                role: 'model',
                content: `Opening paper...`,
                timestamp: new Date(),
                data: { action: 'open_paper', paperId }
            };
        }
    }

    return {
      id: crypto.randomUUID(),
      role: 'model',
      content: response.text || "I didn't get that.",
      timestamp: new Date()
    };
  }

  async findResearchGap(query: string, papers: Paper[]): Promise<Message> {
    const titles = papers.map(p => p.title).join(', ');
    const prompt = `Analyze these papers: ${titles}. Identify a research gap related to: "${query}". Provide a structured gap analysis.`;
    
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-pro-preview', 
      contents: prompt
    });

    return {
      id: crypto.randomUUID(),
      role: 'model',
      content: response.text || "Could not identify gaps.",
      timestamp: new Date(),
      isThinking: true 
    };
  }

  // Updated to use Google Search Tool for Author Intelligence
  async analyzeAuthor(name: string): Promise<AuthorProfile> {
    const prompt = `Research the author "${name}" using Google Search.
    
    GOAL: Create a professional profile to help a user understand their "research headspace" and background.
    
    PRIVACY WARNING: 
    - Do NOT include personal information (family, home address, marriage, children).
    - Focus ONLY on: Academic history (degrees, universities), Professional Roles, Research Interests, and Key Collaborators.

    RETURN JSON FORMAT:
    {
      "name": "${name}",
      "affiliation": "Current University or Lab",
      "hIndex": number (estimate if not found),
      "citationCount": number (estimate if not found),
      "interests": ["topic1", "topic2", "topic3"],
      "education": ["PhD from X", "BS from Y"],
      "collaborators": ["Name 1", "Name 2"],
      "recentWork": ["Title of recent paper 1", "Title of recent paper 2"],
      "summary": "2-3 sentence summary of their research trajectory and impact."
    }`;

    try {
        const response = await this.ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { 
                tools: [{googleSearch: {}}],
                // responseMimeType: 'application/json' - REMOVED: Cannot use with tools
            }
        });

        let text = response.text || "{}";
        // Clean markdown code blocks if present (since we can't enforce JSON mode)
        text = text.replace(/```json\n?|```/g, '');
        // Extract JSON object if surrounded by other text
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            text = text.substring(firstBrace, lastBrace + 1);
        }

        const profile = JSON.parse(text) as AuthorProfile;
        
        // Extract grounding sources if available to attribute info
        const sources: string[] = [];
        if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
            response.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
                if (chunk.web?.uri) {
                    sources.push(chunk.web.uri);
                }
            });
        }
        profile.sources = sources;

        return profile;
    } catch (e) {
        console.error("Author analysis failed", e);
        return {
            name: name,
            affiliation: "Unknown",
            interests: [],
            summary: "Could not load detailed profile. Please try again."
        };
    }
  }

  async explainCitation(citation: string, paperTitle: string): Promise<string> {
    const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `In the context of the paper "${paperTitle}", explain the significance of this citation: "${citation}". Keep it brief.`
    });
    return response.text || "Analysis unavailable.";
  }

  private async processSingleFigure(target: string, paperUrl: string): Promise<{imageUrl: string, label: string, error?: string}> {
      try {
        const pageNum = await this.findPageForQuery(paperUrl, target);
        const pageImageBase64 = await this.renderPageAsImage(paperUrl, pageNum);

        let croppedImageBase64 = pageImageBase64;
        
        try {
            // Updated prompt to explicitly target GRAPHICS and exclude text labels
            // Add instructions to return empty box if not found
            const boxPrompt = `Detect the bounding box of the VISUAL CONTENT (chart, graph, plot, diagram, or image) labeled "${target}".
            CRITICAL: Do NOT box the text label "${target}" itself. Box only the graphic.
            If the figure consists of multiple sub-plots, box the entire area containing them.
            If you cannot definitively find the figure, return "box_2d": [0,0,0,0].
            Return ONLY JSON: { "box_2d": [ymin, xmin, ymax, xmax] } (0-1000 scale).`;
            
            const detectionResponse = await this.ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: {
                    parts: [
                        { inlineData: { mimeType: 'image/jpeg', data: pageImageBase64 } },
                        { text: boxPrompt }
                    ]
                },
                config: { responseMimeType: 'application/json' }
            });
            const cleanText = (detectionResponse.text || "{}").replace(/```json\n|\n```/g, '').replace(/```/g, '');
            const json = JSON.parse(cleanText);

            if (json.box_2d && Array.isArray(json.box_2d) && json.box_2d.length === 4) {
                 const [y1, x1, y2, x2] = json.box_2d;
                 const h = y2 - y1;
                 const w = x2 - x1;

                 // Safety checks:
                 // 1. Box is empty or 0,0,0,0
                 // 2. Box is too small (likely text)
                 // 3. Box is almost full page (likely failure) e.g. > 90% of page
                 if (h <= 0 || w <= 0) {
                     console.warn(`No valid box returned for ${target}.`);
                 } else if (h < 20) {
                     console.warn(`Detected box too small for figure ${target}, likely text label.`);
                 } else if (h > 950 && w > 950) {
                      console.warn(`Detected box is full page, likely failure to localize ${target}.`);
                 } else {
                    croppedImageBase64 = await this.cropImage(pageImageBase64, json.box_2d);
                 }
            }
        } catch (e) {
            console.warn(`Detection failed for ${target}, using full page.`);
        }

        let finalImageUrl = `data:image/jpeg;base64,${croppedImageBase64}`;
        try {
            const vizPrompt = `Enhance this scientific figure for clarity.
            Preserve all data points, axes, and legends exactly.
            Make lines sharper and text more readable.
            Do not add new information.`;

            const vizResponse = await this.ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: {
                    parts: [
                        { inlineData: { mimeType: 'image/jpeg', data: croppedImageBase64 } },
                        { text: vizPrompt }
                    ]
                }
            });
            
            if (vizResponse.candidates?.[0]?.content?.parts) {
                for (const part of vizResponse.candidates[0].content.parts) {
                    if (part.inlineData && part.inlineData.data) {
                        const mimeType = part.inlineData.mimeType || 'image/png';
                        finalImageUrl = `data:${mimeType};base64,${part.inlineData.data}`;
                    }
                }
            }
        } catch (e) {
            console.warn(`Enhancement failed for ${target}, using cropped.`);
        }

        return { imageUrl: finalImageUrl, label: target };

      } catch (e) {
          console.error(`Error processing ${target}`, e);
          return { imageUrl: '', label: target, error: 'Failed to process' };
      }
  }

  async visualizeFigure(query: string, paper: Paper | null): Promise<Message> {
     if (!paper) {
         return {
             id: crypto.randomUUID(),
             role: 'model',
             content: "Please select a paper first.",
             timestamp: new Date()
         };
     }
     
     try {
        const targets = await this.extractFigureTargets(query);
        const results = await Promise.all(targets.map(t => this.processSingleFigure(t, paper.url)));
        
        let content = `Here is your visualization.\n\n`;
        let hasSuccess = false;

        for (const res of results) {
            if (res.imageUrl) {
                // Minimal output: Figure Name + Image
                content += `**${res.label}**\n\n![${res.label}](${res.imageUrl})\n\n`;
                hasSuccess = true;
            } else {
                content += `*Could not visualize ${res.label}*\n\n`;
            }
        }

        if (!hasSuccess) {
            content = "I could not locate or process the requested figures in this paper.";
        } else {
            content += `Do you want me to **give an analysis** of these figures or **describe** them?`;
        }

        return {
            id: crypto.randomUUID(),
            role: 'model',
            content: content,
            timestamp: new Date(),
            citations: [],
            type: 'visualization'
        };

     } catch (e) {
         console.error("Critical visualization error:", e);
         return {
             id: crypto.randomUUID(),
             role: 'model',
             content: `I encountered a critical error while processing the request.`,
             timestamp: new Date()
         };
     }
  }
}

export const geminiService = new GeminiService();
