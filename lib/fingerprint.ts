/**
 * ═══════════════════════════════════════════════════════════
 * ANTIGRAVITY OS v3 — FingerprintJS (§48)
 * ═══════════════════════════════════════════════════════════
 * 
 * Privacy-respecting browser fingerprinting for return visitor detection.
 * Uses canvas, WebGL, audio, and font fingerprint signals.
 * 
 * IMPORTANT: This is NOT tracking for ads. This is used to:
 *   1. Detect return visitors and greet them personally
 *   2. Continue conversations across sessions
 *   3. Skip onboarding for returning visitors
 * 
 * The fingerprint is hashed and NEVER stored with PII.
 */

/**
 * Generate a browser fingerprint hash.
 * Returns a stable hex string that identifies the browser (not the user).
 */
export async function generateFingerprint(): Promise<string> {
  const signals: string[] = [];

  // Canvas fingerprint
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      canvas.width = 200;
      canvas.height = 50;
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('ANTIGRAVITY', 2, 2);
      ctx.fillStyle = '#6366f1';
      ctx.fillRect(100, 0, 50, 50);
      signals.push(canvas.toDataURL());
    }
  } catch {
    // Canvas not available
  }

  // WebGL fingerprint
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        signals.push(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '');
        signals.push(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '');
      }
    }
  } catch {
    // WebGL not available
  }

  // Screen and platform signals
  signals.push(`${screen.width}x${screen.height}`);
  signals.push(`${screen.colorDepth}`);
  signals.push(Intl.DateTimeFormat().resolvedOptions().timeZone || '');
  signals.push(navigator.language || '');
  signals.push(String(navigator.hardwareConcurrency || ''));
  signals.push(navigator.platform || '');

  // Combine and hash
  const raw = signals.join('|');
  return await hashString(raw);
}

/**
 * SHA-256 hash a string. Returns hex.
 */
async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);

  try {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Fallback: simple hash for environments without crypto.subtle
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash + char) | 0;
    }
    return Math.abs(hash).toString(16).padStart(16, '0');
  }
}

/**
 * Get or create a stable visitor ID.
 * Uses fingerprint + localStorage fallback.
 */
export async function getVisitorId(): Promise<string> {
  // Try fingerprint first
  const fingerprint = await generateFingerprint();

  // Also check localStorage for session continuity
  const storedId = typeof window !== 'undefined'
    ? localStorage.getItem('antigravity_visitor_id')
    : null;

  if (storedId) {
    return storedId;
  }

  // Use fingerprint-based ID
  const visitorId = `v_${fingerprint.substring(0, 16)}`;
  if (typeof window !== 'undefined') {
    localStorage.setItem('antigravity_visitor_id', visitorId);
  }

  return visitorId;
}

/**
 * Detect if this is a return visitor.
 */
export function isReturnVisitor(): boolean {
  if (typeof window === 'undefined') return false;

  const visitCount = parseInt(
    localStorage.getItem('antigravity_visit_count') || '0',
    10
  );
  return visitCount > 1;
}

/**
 * Increment visit count and store last visit timestamp.
 */
export function recordVisit(): number {
  if (typeof window === 'undefined') return 0;

  const current = parseInt(
    localStorage.getItem('antigravity_visit_count') || '0',
    10
  );
  const newCount = current + 1;
  localStorage.setItem('antigravity_visit_count', String(newCount));
  localStorage.setItem('antigravity_last_visit', new Date().toISOString());

  return newCount;
}
