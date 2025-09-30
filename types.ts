// --- TYPE DEFINITIONS ---
export interface Source {
  name: string;
  content: string; // text content or base64 data URL
  mimeType: string;
  type: 'text' | 'image' | 'pdf';
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface PodcastGeneration {
    status: 'idle' | 'generating_script' | 'generating_video' | 'polling' | 'done' | 'error';
    videoUrl?: string;
    script?: string;
    error?: string;
    pollingMessages?: string[];
}

export const POLLING_MESSAGES = [
    "Analyzing the source material...",
    "Drafting the storyboard...",
    "Generating initial video frames...",
    "Rendering the scenes...",
    "Adding audio and effects...",
    "Finalizing the video, almost there!",
];
