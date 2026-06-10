import { Clipboard, FileImage, Link, Type } from 'lucide-react';
import { useRef, useState } from 'react';
import type { SavedItem } from '../../domain/savedItem';

interface CapturePanelProps {
  onCreate: (input: {
    type: SavedItem['type'];
    title: string;
    url?: string;
    text?: string;
    extractedText?: string;
    imageDataUrl?: string;
    mimeType?: string;
    sizeBytes?: number;
    tags?: string[];
    thumbnailColor?: string;
  }) => Promise<unknown>;
}

export function CapturePanel({ onCreate }: CapturePanelProps) {
  const [linkValue, setLinkValue] = useState('');
  const [snippetValue, setSnippetValue] = useState('');
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function saveLink() {
    if (!linkValue.trim()) {
      setMessage('Paste a URL first.');
      return;
    }

    const url = normalizeUrl(linkValue);
    await onCreate({
      type: 'link',
      title: titleFromUrl(url),
      url,
      text: `Saved link from ${new URL(url).hostname}`,
      tags: ['link'],
      thumbnailColor: 'link'
    });
    setLinkValue('');
    setMessage('Link saved.');
  }

  async function saveSnippet() {
    if (!snippetValue.trim()) {
      setMessage('Write a snippet first.');
      return;
    }

    await onCreate({
      type: 'snippet',
      title: snippetValue.split(/\s+/).slice(0, 5).join(' '),
      text: snippetValue,
      tags: ['snippet'],
      thumbnailColor: 'snippet'
    });
    setSnippetValue('');
    setMessage('Snippet saved.');
  }

  async function saveFile(file: File) {
    const imageDataUrl = await fileToDataUrl(file);
    await onCreate({
      type: file.name.toLowerCase().includes('screen') ? 'screenshot' : 'image',
      title: file.name.replace(/\.[^.]+$/, '') || 'Uploaded image',
      text: `Uploaded image ${file.name}`,
      extractedText: file.name,
      imageDataUrl,
      mimeType: file.type,
      sizeBytes: file.size,
      tags: ['image'],
      thumbnailColor: 'hero'
    });
    setMessage('Image saved.');
  }

  return (
    <section className="capture-panel" aria-labelledby="capture-title">
      <div className="capture-heading">
        <Clipboard size={22} aria-hidden="true" />
        <div>
          <h2 id="capture-title">Capture anything to add to your inbox</h2>
          <p>Save links, screenshots, images, and text without leaving the workspace.</p>
        </div>
      </div>

      <div className="capture-grid">
        <div className="capture-tile">
          <span className="tile-icon tile-link" aria-hidden="true">
            <Link size={25} />
          </span>
          <label htmlFor="link-input">Paste link</label>
          <div className="input-row">
            <input
              id="link-input"
              value={linkValue}
              onChange={(event) => setLinkValue(event.target.value)}
              placeholder="https://www.notion.so/..."
            />
            <button type="button" onClick={() => void saveLink()}>
              Save
            </button>
          </div>
        </div>

        <div
          className="capture-tile drop-tile"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const file = event.dataTransfer.files[0];
            if (file) {
              void saveFile(file);
            }
          }}
        >
          <span className="tile-icon tile-image" aria-hidden="true">
            <FileImage size={25} />
          </span>
          <label htmlFor="image-input">Drop screenshot</label>
          <p>or image here</p>
          <input
            ref={fileInputRef}
            id="image-input"
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void saveFile(file);
              }
            }}
          />
          <button type="button" onClick={() => fileInputRef.current?.click()}>
            Choose image
          </button>
        </div>

        <div className="capture-tile">
          <span className="tile-icon tile-snippet" aria-hidden="true">
            <Type size={25} />
          </span>
          <label htmlFor="snippet-input">Save snippet</label>
          <textarea
            id="snippet-input"
            value={snippetValue}
            onChange={(event) => setSnippetValue(event.target.value)}
            placeholder="Capture text"
            rows={3}
          />
          <button type="button" onClick={() => void saveSnippet()}>
            Save text
          </button>
        </div>
      </div>

      <p className="capture-message" role="status">
        {message}
      </p>
    </section>
  );
}

function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function titleFromUrl(value: string): string {
  const url = new URL(value);
  return url.hostname.replace(/^www\./, '');
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
