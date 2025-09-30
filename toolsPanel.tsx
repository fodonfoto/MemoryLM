import React from 'react';
import { marked } from 'marked';
import { PodcastGeneration } from './types';

interface ToolsPanelProps {
    sourcesAvailable: boolean;
    podcastState: PodcastGeneration;
    handleGeneratePodcast: () => void;
    isPodcastScriptVisible: boolean;
    setIsPodcastScriptVisible: (visible: boolean) => void;
}

export const ToolsPanel: React.FC<ToolsPanelProps> = ({
    sourcesAvailable,
    podcastState,
    handleGeneratePodcast,
    isPodcastScriptVisible,
    setIsPodcastScriptVisible
}) => {
    return (
        <div className="panel tools-panel">
            <div className="panel-header">
            <span className="material-symbols-outlined">auto_awesome</span>
            <h2>Generative Tools</h2>
            </div>
            <div className="panel-content">
                <div className="tool-section">
                    <div className="tool-header">
                        <h3><span className="material-symbols-outlined">podcasts</span>Podcast</h3>
                        <button 
                            className="tool-btn" 
                            onClick={handleGeneratePodcast} 
                            disabled={!sourcesAvailable || (podcastState.status !== 'idle' && podcastState.status !== 'done' && podcastState.status !== 'error')}
                        >
                            {podcastState.status === 'idle' || podcastState.status === 'done' || podcastState.status === 'error' ? 'Generate Podcast' : 'Generating...'}
                        </button>
                    </div>
                    {(podcastState.status !== 'idle' && podcastState.status !== 'done' && podcastState.status !== 'error') && (
                        <div className="loading-container">
                            <div className="loader"></div>
                            <p>{podcastState.pollingMessages?.[podcastState.pollingMessages.length - 1]}</p>
                        </div>
                    )}
                    {podcastState.status === 'done' && podcastState.videoUrl && (
                        <div className="tool-output">
                            <div className="tool-output-header">
                                <h4>Podcast Audio</h4>
                                {podcastState.script && (
                                    <button className="toggle-script-btn" onClick={() => setIsPodcastScriptVisible(!isPodcastScriptVisible)}>
                                        {isPodcastScriptVisible ? 'Hide Script' : 'Show Script'}
                                    </button>
                                )}
                            </div>
                            <audio controls src={podcastState.videoUrl}></audio>
                        </div>
                    )}
                    {podcastState.script && isPodcastScriptVisible && (
                        <div 
                            className="tool-output" 
                            style={{ marginTop: 'var(--spacing-s)'}}
                        >
                            <h4>Full Script</h4>
                            <div dangerouslySetInnerHTML={{ __html: marked.parse(podcastState.script) as string }}></div>
                        </div>
                    )}
                    {podcastState.status === 'error' && (
                        <div className="tool-output">
                            <p style={{color: 'var(--danger-color)'}}>Error generating podcast: {podcastState.error}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};