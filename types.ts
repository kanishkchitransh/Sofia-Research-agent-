
export interface Paper {
  id: string;
  title: string;
  authors: string[]; // New field for author search/intel
  abstract?: string;
  url: string; // Blob URL
  fileName: string;
  uploadDate: Date;
  category?: string;
  citations: Citation[];
  highlights?: Highlight[];
  fileData?: string; // Base64 encoded data
  mimeType?: string;
}

export interface Highlight {
  id: string;
  pageNum: number;
  rects: { x: number; y: number; width: number; height: number }[]; // Normalized coordinates (0-1)
  text: string;
  color: 'yellow' | 'green' | 'red' | 'blue';
  comment?: string;
}

export interface Citation {
  id: string;
  text: string;
  status: 'unverified' | 'verified' | 'analyzing';
  explanation?: string;
  link?: string;
}

export interface Insight {
  id: string;
  content: string;
  source: 'manual' | 'chat_response';
  date: Date;
  tags?: string[];
  relatedPaperId?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: Date;
  isThinking?: boolean;
  citations?: string[]; // URLs from grounding
  type?: 'text' | 'visualization' | 'author_profile';
  data?: any; // For flexible payloads like author info or charts
  isStarred?: boolean; // For "starting" a response to find it easily
}

export interface AuthorProfile {
  name: string;
  affiliation: string;
  hIndex?: number;
  citationCount?: number;
  interests: string[];
  summary: string;
  imageUrl?: string;
  // New fields for deep dive
  education?: string[];
  collaborators?: string[];
  recentWork?: string[];
  sources?: string[]; // To list where info came from
}

export enum AgentMode {
  CHAT = 'CHAT',
  CITATION_ANALYSIS = 'CITATION_ANALYSIS',
  RESEARCH_GAP = 'RESEARCH_GAP',
  AUTHOR_INTELLIGENCE = 'AUTHOR_INTELLIGENCE',
  VISUALIZE = 'VISUALIZE'
}

export interface VisualizationData {
  type: 'protein' | 'tree' | 'chart';
  title: string;
  description: string;
}

export interface GraphCluster {
  topic: string;
  paperIds: string[];
}
