import React from 'react';
import { Source } from './types';

interface SourcePanelProps {
  sources: Source[];
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const SourcePanel: React.FC<SourcePanelProps> = ({ sources, fileInputRef, handleFileChange }) => {
  const sourcesAvailable = sources.length > 0;

  return (
    <div className="panel source-panel">
      <div className="panel-header">
        <span className="material-symbols-outlined">source</span>
        <h2>Sources</h2>
      </div>
      <button className="add-source-btn" onClick={() => fileInputRef.current?.click()}>
        <span className="material-symbols-outlined">add</span>
        Add Sources
      </button>
      <input type="file" id="file-input" ref={fileInputRef} onChange={handleFileChange} multiple accept="text/*,image/*,application/pdf"/>
      <div className="panel-content">
        {sourcesAvailable ? (
          <ul className="source-list">
            {sources.map((source, index) => (
              <li key={index} className="source-item">
                <span className="material-symbols-outlined">
                  {source.type === 'image' ? 'image' : source.type === 'pdf' ? 'picture_as_pdf' : 'description'}
                </span>
                {source.name}
              </li>
            ))}
          </ul>
        ) : (
           <div className="placeholder-text">
              <span className="material-symbols-outlined">upload_file</span>
              <p>Upload files to start</p>
          </div>
        )}
      </div>
    </div>
  );
};