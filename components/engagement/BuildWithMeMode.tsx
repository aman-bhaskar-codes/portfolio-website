'use client';

/**
 * ═══════════════════════════════════════════════════════════
 * Build With Me Mode — ANTIGRAVITY OS v2 (§26.4)
 * ═══════════════════════════════════════════════════════════
 * 
 * Split-panel: chat left, live Mermaid diagram right.
 * Visitor describes a system → AI generates architecture diagram in real-time.
 * Diagram updates as conversation evolves.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  diagram?: string; // Mermaid code extracted from response
}

interface BuildWithMeProps {
  isActive: boolean;
  onExit: () => void;
}

// Extract mermaid diagram from AI response
function extractDiagram(text: string): { cleanText: string; diagram: string | null } {
  const mermaidRegex = /```mermaid\n([\s\S]*?)```/;
  const diagramTagRegex = /<diagram>([\s\S]*?)<\/diagram>/;

  let diagram: string | null = null;
  let cleanText = text;

  const mermaidMatch = text.match(mermaidRegex);
  if (mermaidMatch) {
    diagram = mermaidMatch[1].trim();
    cleanText = text.replace(mermaidRegex, '').trim();
  }

  const tagMatch = text.match(diagramTagRegex);
  if (tagMatch) {
    diagram = tagMatch[1].trim();
    cleanText = text.replace(diagramTagRegex, '').trim();
  }

  return { cleanText, diagram };
}

const BuildWithMeMode: React.FC<BuildWithMeProps> = ({ isActive, onExit }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [currentDiagram, setCurrentDiagram] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [diagramError, setDiagramError] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isActive && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: "Welcome to Build With Me mode! 🏗️\n\nDescribe a system you want to design, and I'll help you architect it with live diagrams.\n\nTry: \"Design a real-time leaderboard for 1M concurrent users\"",
      }]);
    }
  }, [isActive]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  // Render Mermaid diagram
  useEffect(() => {
    if (currentDiagram && typeof window !== 'undefined') {
      const renderDiagram = async () => {
        try {
          const mermaid = (await import('mermaid')).default;
          mermaid.initialize({
            startOnLoad: false,
            theme: 'dark',
            themeVariables: {
              primaryColor: '#7c3aed',
              primaryTextColor: '#f0f6fc',
              lineColor: '#8b949e',
              secondaryColor: '#1f2937',
              tertiaryColor: '#0d1117',
            },
          });

          const container = document.getElementById('mermaid-output');
          if (container) {
            const { svg } = await mermaid.render('diagram-svg', currentDiagram);
            container.innerHTML = svg;
            setDiagramError('');
          }
        } catch (err) {
          setDiagramError('Diagram rendering failed — updating on next response');
        }
      };
      renderDiagram();
    }
  }, [currentDiagram]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setIsLoading(true);

    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);

    try {
      // Build context with diagram state
      const systemPrompt = `You are Aman Bhaskar in Build-With-Me mode. 
You are co-designing a system architecture with the visitor.
Your response MUST include a Mermaid diagram wrapped in \`\`\`mermaid\`\`\` code block.
Use flowchart TD or graph TD for system architectures.
Keep explanations under 150 words. Focus on the diagram evolving.
${currentDiagram ? `\nCurrent diagram state:\n\`\`\`mermaid\n${currentDiagram}\n\`\`\`` : ''}`;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          system_prompt: systemPrompt,
          model: 'phi4-mini',
          mode: 'build_with_me',
        }),
      });

      const data = await response.json();
      const aiText = data.response || data.message || 'Let me think about that architecture...';

      const { cleanText, diagram } = extractDiagram(aiText);

      if (diagram) {
        setCurrentDiagram(diagram);
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: cleanText,
        diagram: diagram || undefined,
      }]);

    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Connection issue — let me try again. What aspect of the design should we focus on?',
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, currentDiagram]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isActive) return null;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.modeBadge}>🏗️ Build With Me</span>
          <span style={styles.headerHint}>Co-design system architecture with live diagrams</span>
        </div>
        <button style={styles.exitBtn} onClick={onExit}>✕ Exit</button>
      </div>

      {/* Split Panel */}
      <div style={styles.splitPanel}>
        {/* Left: Chat */}
        <div style={styles.chatPanel}>
          <div style={styles.chatMessages} ref={chatRef}>
            {messages.map((msg, i) => (
              <div key={i} style={msg.role === 'user' ? styles.userMsg : styles.aiMsg}>
                <div style={styles.msgRole}>
                  {msg.role === 'user' ? '🧑 You' : '🤖 Aman'}
                </div>
                <div style={styles.msgContent}>{msg.content}</div>
              </div>
            ))}
            {isLoading && (
              <div style={styles.aiMsg}>
                <div style={styles.msgRole}>🤖 Aman</div>
                <div style={styles.loadingDots}>Designing...</div>
              </div>
            )}
          </div>

          {/* Input */}
          <div style={styles.inputArea}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              style={styles.textarea}
              placeholder="Describe your system or ask 'what if we used...' "
              rows={2}
              disabled={isLoading}
            />
            <button
              style={styles.sendBtn}
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
            >
              Send
            </button>
          </div>
        </div>

        {/* Right: Diagram */}
        <div style={styles.diagramPanel}>
          <div style={styles.diagramHeader}>
            <span>📐 Architecture Diagram</span>
            {currentDiagram && (
              <span style={styles.diagramStatus}>● Live</span>
            )}
          </div>
          <div style={styles.diagramContent}>
            {currentDiagram ? (
              <>
                <div id="mermaid-output" style={styles.mermaidOutput} />
                {diagramError && (
                  <div style={styles.diagramError}>{diagramError}</div>
                )}
              </>
            ) : (
              <div style={styles.diagramPlaceholder}>
                <div style={styles.placeholderIcon}>📐</div>
                <div>Start describing a system</div>
                <div style={styles.placeholderHint}>
                  The diagram will appear here and evolve as we discuss
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed', inset: 0, zIndex: 9998,
    backgroundColor: '#0d1117', display: 'flex', flexDirection: 'column',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 20px', borderBottom: '1px solid #21262d',
    background: 'linear-gradient(135deg, #161b22, #0d1117)',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  modeBadge: {
    background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
    padding: '4px 12px', borderRadius: '12px',
    color: '#fff', fontWeight: 600, fontSize: '13px',
  },
  headerHint: { color: '#8b949e', fontSize: '13px' },
  exitBtn: {
    background: 'transparent', border: '1px solid #30363d',
    color: '#8b949e', padding: '6px 14px', borderRadius: '8px',
    cursor: 'pointer', fontSize: '13px',
  },
  splitPanel: { display: 'flex', flex: 1, overflow: 'hidden' },
  chatPanel: {
    width: '45%', display: 'flex', flexDirection: 'column',
    borderRight: '1px solid #21262d',
  },
  chatMessages: {
    flex: 1, overflowY: 'auto', padding: '16px',
    display: 'flex', flexDirection: 'column', gap: '12px',
  },
  userMsg: {
    background: '#161b22', borderRadius: '12px', padding: '12px 16px',
    borderLeft: '3px solid #2563eb',
  },
  aiMsg: {
    background: '#0d1117', borderRadius: '12px', padding: '12px 16px',
    borderLeft: '3px solid #7c3aed',
  },
  msgRole: { fontSize: '12px', color: '#8b949e', marginBottom: '4px', fontWeight: 600 },
  msgContent: { color: '#c9d1d9', fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' },
  loadingDots: { color: '#7c3aed', fontStyle: 'italic' },
  inputArea: {
    padding: '12px', borderTop: '1px solid #21262d',
    display: 'flex', gap: '8px', alignItems: 'flex-end',
  },
  textarea: {
    flex: 1, background: '#161b22', border: '1px solid #30363d',
    borderRadius: '10px', padding: '10px 14px',
    color: '#c9d1d9', fontSize: '14px', resize: 'none',
    fontFamily: 'Inter, system-ui, sans-serif',
    outline: 'none',
  },
  sendBtn: {
    background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
    border: 'none', borderRadius: '10px', padding: '10px 20px',
    color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '14px',
  },
  diagramPanel: {
    width: '55%', display: 'flex', flexDirection: 'column',
    background: '#0d1117',
  },
  diagramHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 20px', borderBottom: '1px solid #21262d',
    color: '#c9d1d9', fontSize: '14px', fontWeight: 600,
  },
  diagramStatus: { color: '#7ee787', fontSize: '12px' },
  diagramContent: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '20px', overflowY: 'auto',
  },
  mermaidOutput: { width: '100%', maxHeight: '100%' },
  diagramError: {
    color: '#f85149', fontSize: '12px', marginTop: '8px', textAlign: 'center',
  },
  diagramPlaceholder: {
    textAlign: 'center', color: '#484f58',
  },
  placeholderIcon: { fontSize: '48px', marginBottom: '16px', opacity: 0.5 },
  placeholderHint: { fontSize: '13px', marginTop: '8px', color: '#30363d' },
};

export default BuildWithMeMode;
