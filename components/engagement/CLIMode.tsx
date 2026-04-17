'use client';

/**
 * ═══════════════════════════════════════════════════════════
 * CLI Easter Egg Mode — ANTIGRAVITY OS v2 (§26.5)
 * ═══════════════════════════════════════════════════════════
 * 
 * Type "$ sudo aman" in chat → entire UI transforms into a terminal.
 * 
 * Commands: help, ls, cat, git log, skills, whoami, ping, top, ps aux, exit
 * Aesthetic: Hack font, green-on-black, authentic cursor blink, typewriter output
 * 
 * Engineers who find this TELL OTHER ENGINEERS.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';

interface HistoryEntry {
  command: string;
  output: string;
  timestamp: number;
}

interface CLIModeProps {
  isActive: boolean;
  onExit: () => void;
}

const TYPING_SPEED = 15; // ms per character for typewriter effect

const CLIMode: React.FC<CLIModeProps> = ({ isActive, onExit }) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Initial welcome message
  useEffect(() => {
    if (isActive && history.length === 0) {
      setHistory([{
        command: '',
        output: `╔══════════════════════════════════════════════╗
║  ANTIGRAVITY OS v2.0 — Terminal Mode         ║
║  Type 'help' for available commands           ║
║  Type 'exit' to return to normal mode         ║
╚══════════════════════════════════════════════╝`,
        timestamp: Date.now(),
      }]);
    }
  }, [isActive]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history, isTyping]);

  // Focus input
  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive]);

  const typewriterOutput = useCallback(async (text: string): Promise<void> => {
    setIsTyping(true);
    return new Promise((resolve) => {
      let i = 0;
      const interval = setInterval(() => {
        i += 3; // Type 3 chars at a time for speed
        if (i >= text.length) {
          clearInterval(interval);
          setIsTyping(false);
          resolve();
        }
      }, TYPING_SPEED);
    });
  }, []);

  const executeCommand = useCallback(async (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    // Add to command history
    setCommandHistory(prev => [...prev, trimmed]);
    setHistoryIndex(-1);

    // Handle exit
    if (trimmed === 'exit' || trimmed === 'quit') {
      setHistory(prev => [...prev, {
        command: trimmed,
        output: 'Exiting terminal mode... goodbye 👋',
        timestamp: Date.now(),
      }]);
      setTimeout(onExit, 800);
      return;
    }

    // Handle clear
    if (trimmed === 'clear') {
      setHistory([]);
      return;
    }

    // Call backend API
    try {
      const response = await fetch('/api/v2/cli/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: trimmed }),
      });

      const data = await response.json();

      setHistory(prev => [...prev, {
        command: trimmed,
        output: data.output || 'Command executed.',
        timestamp: Date.now(),
      }]);

      await typewriterOutput(data.output || '');
    } catch {
      setHistory(prev => [...prev, {
        command: trimmed,
        output: `Network error: backend unreachable. Try 'help' for local commands.`,
        timestamp: Date.now(),
      }]);
    }
  }, [onExit, typewriterOutput]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(currentInput);
      setCurrentInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 
          ? commandHistory.length - 1 
          : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex >= 0) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setCurrentInput('');
        } else {
          setHistoryIndex(newIndex);
          setCurrentInput(commandHistory[newIndex]);
        }
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Tab completion
      const completions = [
        'help', 'ls', 'cat', 'whoami', 'ping', 'top',
        'ps aux', 'uptime', 'skills', 'exit', 'clear',
        'ls projects/', 'ls skills/',
      ];
      const match = completions.find(c => c.startsWith(currentInput));
      if (match) {
        setCurrentInput(match);
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setHistory([]);
    }
  }, [currentInput, commandHistory, historyIndex, executeCommand]);

  if (!isActive) return null;

  return (
    <div style={styles.overlay} onClick={() => inputRef.current?.focus()}>
      <div style={styles.terminal} ref={terminalRef}>
        {/* History */}
        {history.map((entry, i) => (
          <div key={i} style={styles.entry}>
            {entry.command && (
              <div style={styles.promptLine}>
                <span style={styles.prompt}>aman@antigravity</span>
                <span style={styles.promptSep}>:</span>
                <span style={styles.promptDir}>~</span>
                <span style={styles.promptDollar}>$ </span>
                <span style={styles.commandText}>{entry.command}</span>
              </div>
            )}
            <pre style={styles.output}>{entry.output}</pre>
          </div>
        ))}

        {/* Current input line */}
        <div style={styles.inputLine}>
          <span style={styles.prompt}>aman@antigravity</span>
          <span style={styles.promptSep}>:</span>
          <span style={styles.promptDir}>~</span>
          <span style={styles.promptDollar}>$ </span>
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            style={styles.input}
            spellCheck={false}
            autoComplete="off"
            disabled={isTyping}
          />
          <span style={styles.cursor}>▊</span>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    backgroundColor: '#0d1117',
    display: 'flex',
    flexDirection: 'column',
  },
  terminal: {
    flex: 1,
    padding: '20px',
    overflowY: 'auto',
    fontFamily: '"Hack", "Fira Code", "JetBrains Mono", "Cascadia Code", monospace',
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#c9d1d9',
  },
  entry: {
    marginBottom: '8px',
  },
  promptLine: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  prompt: {
    color: '#7ee787',
    fontWeight: 'bold',
  },
  promptSep: {
    color: '#c9d1d9',
  },
  promptDir: {
    color: '#79c0ff',
    fontWeight: 'bold',
  },
  promptDollar: {
    color: '#c9d1d9',
    marginLeft: '4px',
  },
  commandText: {
    color: '#f0f6fc',
  },
  output: {
    color: '#8b949e',
    margin: '4px 0 0 0',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    lineHeight: 'inherit',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  inputLine: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  input: {
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#f0f6fc',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    flex: 1,
    minWidth: '100px',
    caretColor: 'transparent',
  },
  cursor: {
    color: '#7ee787',
    animation: 'blink 1s step-end infinite',
  },
};

export default CLIMode;
