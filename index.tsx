import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Chat, Part, Type } from '@google/genai';

import { SourcePanel } from './sourcePanel';
import { ChatPanel } from './chatPanel';
import { ToolsPanel } from './toolsPanel';
import { Source, ChatMessage, PodcastGeneration, POLLING_MESSAGES } from './types';


// --- MAIN APP COMPONENT ---
const App: React.FC = () => {
  const [sources, setSources] = useState<Source[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chat, setChat] = useState<Chat | null>(null);
  const [podcastState, setPodcastState] = useState<PodcastGeneration>({ status: 'idle' });
  const [isPodcastScriptVisible, setIsPodcastScriptVisible] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatHistoryRef = useRef<HTMLDivElement>(null);

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const fileToGenerativePart = (content: string, mimeType: string): Part => {
    return {
      inlineData: {
        data: content.split(',')[1],
        mimeType
      },
    };
  };

  const initializeChat = () => {
    const textSources = sources.filter(s => s.type === 'text');
    const knowledgeBase = textSources.map(s => `## Source: ${s.name}\n\n${s.content}`).join('\n\n---\n\n');
    const systemInstruction = `You are a helpful AI assistant. Your name is NotebookAI. You will answer user questions based *only* on the provided sources (text, images, and PDFs). If the answer is not in the sources, say "I cannot answer this question based on the provided sources." Do not use any external knowledge. Here are the text sources:\n\n${knowledgeBase}`;

    const newChat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction,
      },
    });
    setChat(newChat);
    return newChat;
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      const mimeType = file.type;

      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (mimeType.startsWith('image/')) {
          setSources(prev => [...prev, { name: file.name, content: result, mimeType, type: 'image' }]);
        } else if (mimeType === 'application/pdf') {
          setSources(prev => [...prev, { name: file.name, content: result, mimeType, type: 'pdf' }]);
        } else if (mimeType.startsWith('text/')) {
          setSources(prev => [...prev, { name: file.name, content: result, mimeType, type: 'text' }]);
        }
      };

      if (mimeType.startsWith('image/') || mimeType === 'application/pdf') {
        reader.readAsDataURL(file);
      } else if (mimeType.startsWith('text/')) {
        reader.readAsText(file);
      } else {
        console.warn(`File ${file.name} has an unsupported type (${mimeType}) and will be ignored.`);
      }
    });

    setChat(null);
    setChatHistory([]);
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', text: currentMessage };
    setChatHistory(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    try {
        const currentChat = chat || initializeChat();
        
        const fileParts = sources
          .filter(s => s.type === 'image' || s.type === 'pdf')
          .map(s => fileToGenerativePart(s.content, s.mimeType));

        const textPart = { text: currentMessage };
        const allParts = [textPart, ...fileParts];
        
        const responseStream = await currentChat.sendMessageStream({ message: allParts });

        let modelResponse = '';
        setChatHistory(prev => [...prev, { role: 'model', text: '' }]);

        for await (const chunk of responseStream) {
            modelResponse += chunk.text;
            setChatHistory(prev => {
                const newHistory = [...prev];
                newHistory[newHistory.length - 1].text = modelResponse;
                return newHistory;
            });
        }
    } catch (error) {
        console.error("Error sending message:", error);
        setChatHistory(prev => [...prev, { role: 'model', text: 'Sorry, an error occurred.' }]);
    } finally {
        setIsLoading(false);
    }
  };

    const handleGeneratePodcast = async () => {
        setPodcastState({ status: 'generating_script', pollingMessages: ["Generating conversational script..."] });
        setIsPodcastScriptVisible(false);

        const textSources = sources.filter(s => s.type === 'text');
        const fileSources = sources.filter(s => s.type === 'image' || s.type === 'pdf');
        const knowledgeBase = textSources.map(s => `## Source: ${s.name}\n\n${s.content}`).join('\n\n---\n\n');
        const fileParts = fileSources.map(s => fileToGenerativePart(s.content, s.mimeType));

        const scriptGenPrompt = `Based on the following source material (text, images, PDFs), generate a JSON object with two keys: "script" and "videoPrompt".
1.  "script": A detailed, conversational podcast script in THAI language between a male host (พิธีกรชาย) and a female host (พิธีกรหญิง). The script should be comprehensive, aiming for a duration of up to 20 minutes, summarizing all key information from the sources in an engaging way.
2.  "videoPrompt": A detailed, multi-paragraph descriptive prompt in ENGLISH for an AI video generator. This prompt should guide the creation of a long-form narrated video, potentially up to 20 minutes long. It must summarize all core themes and visuals from the podcast script. Describe scenes, pacing, and visual elements to match a long-form, documentary-style format.

Source Material:
${knowledgeBase}`;

        const scriptGenContents = { parts: [{ text: scriptGenPrompt }, ...fileParts] };

        try {
            // 1. Generate script and video prompt
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: scriptGenContents,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            script: { type: Type.STRING },
                            videoPrompt: { type: Type.STRING }
                        },
                        required: ["script", "videoPrompt"]
                    }
                }
            });
            
            const resultJson = JSON.parse(response.text);
            const { script, videoPrompt } = resultJson;

            setPodcastState(prev => ({ ...prev, status: 'generating_video', script, pollingMessages: [...(prev.pollingMessages || []), "Generating podcast video..."] }));

            // 2. Generate Video
            let operation = await ai.models.generateVideos({
                model: 'veo-2.0-generate-001',
                prompt: videoPrompt,
                config: { numberOfVideos: 1 }
            });

            setPodcastState(prev => ({...prev, status: 'polling', pollingMessages: [...(prev.pollingMessages || []), POLLING_MESSAGES[0]]}));

            // 3. Poll for video
            let messageIndex = 1;
            while (!operation.done) {
                await new Promise(resolve => setTimeout(resolve, 10000));
                operation = await ai.operations.getVideosOperation({ operation: operation });
                if (messageIndex < POLLING_MESSAGES.length) {
                    setPodcastState(prev => ({...prev, pollingMessages: [...(prev.pollingMessages || []), POLLING_MESSAGES[messageIndex]]}));
                    messageIndex++;
                }
            }

            // 4. Process and display
            const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
            if (downloadLink) {
                const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
                if (!videoResponse.ok) {
                    const errorText = await videoResponse.text();
                    throw new Error(`Failed to download video. Status: ${videoResponse.status}. Message: ${errorText}`);
                }
                const blob = await videoResponse.blob();
                 if (blob.size === 0) {
                    throw new Error("Downloaded video file is empty.");
                }
                const videoUrl = URL.createObjectURL(blob);
                setPodcastState(prev => ({ ...prev, status: 'done', videoUrl, script: prev.script }));
            } else {
                throw new Error("Video generation completed but no download link was found.");
            }
        } catch(e) {
            console.error("Error generating podcast:", e);
            setPodcastState(prev => ({ ...prev, status: 'error', error: (e as Error).message, script: prev.script }));
        }
    };

  const sourcesAvailable = sources.length > 0;

  return (
    <div className="main-container">
      <SourcePanel 
        sources={sources}
        fileInputRef={fileInputRef}
        handleFileChange={handleFileChange}
      />
      <ChatPanel
        chatHistory={chatHistory}
        chatHistoryRef={chatHistoryRef}
        currentMessage={currentMessage}
        setCurrentMessage={setCurrentMessage}
        handleSendMessage={handleSendMessage}
        isLoading={isLoading}
        sourcesAvailable={sourcesAvailable}
      />
      <ToolsPanel
        sourcesAvailable={sourcesAvailable}
        podcastState={podcastState}
        handleGeneratePodcast={handleGeneratePodcast}
        isPodcastScriptVisible={isPodcastScriptVisible}
        setIsPodcastScriptVisible={setIsPodcastScriptVisible}
      />
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);