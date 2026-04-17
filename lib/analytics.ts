/**
 * ═══════════════════════════════════════════════════════════
 * ANTIGRAVITY OS v3 — Privacy-First Analytics (§44)
 * ═══════════════════════════════════════════════════════════
 * 
 * Umami-compatible analytics client.
 * Privacy-first: no cookies, no PII, GDPR/CCPA compliant by default.
 * 
 * What we track:
 *   - Page views (which pages are most visited)
 *   - Chat opens (engagement metric)
 *   - Persona detection results (for content optimization)
 *   - Brief downloads (conversion metric)
 *   - CLI mode activations (easter egg engagement)
 *   - Time spent on page (engagement depth)
 */

interface AnalyticsEvent {
  name: string;
  data?: Record<string, string | number | boolean>;
}

class AnalyticsClient {
  private trackingId: string = '';
  private endpoint: string = '';
  private enabled: boolean = false;

  /**
   * Initialize the analytics client.
   * Call once in your app layout/provider.
   */
  configure(trackingId: string, endpoint: string = '') {
    this.trackingId = trackingId;
    this.endpoint = endpoint;
    this.enabled = !!trackingId;
  }

  /**
   * Track a page view.
   */
  pageView(path: string, referrer?: string) {
    if (!this.enabled) return;
    this._send('pageview', { path, referrer: referrer || '' });
  }

  /**
   * Track a custom event.
   */
  event(name: string, data?: Record<string, string | number | boolean>) {
    if (!this.enabled) return;
    this._send('event', { name, ...data });
  }

  // ───────────────────────────────────────────────────────
  // CONVENIENCE METHODS FOR PORTFOLIO EVENTS
  // ───────────────────────────────────────────────────────

  /** Visitor opened the AI chat panel */
  chatOpened() {
    this.event('chat_opened');
  }

  /** Visitor sent a message in chat */
  chatMessageSent(messageLength: number) {
    this.event('chat_message', { length: messageLength });
  }

  /** AI detected visitor persona */
  personaDetected(persona: string, confidence: number) {
    this.event('persona_detected', { persona, confidence });
  }

  /** Visitor downloaded recruiter brief */
  briefDownloaded(visitorPersona: string) {
    this.event('brief_downloaded', { persona: visitorPersona });
  }

  /** CLI easter egg activated */
  cliModeActivated() {
    this.event('cli_activated');
  }

  /** Stump Challenge started */
  stumpChallengeStarted() {
    this.event('stump_challenge_started');
  }

  /** Build-With-Me mode activated */
  buildWithMeActivated() {
    this.event('build_with_me_started');
  }

  /** Voice mode toggled */
  voiceModeToggled(enabled: boolean) {
    this.event('voice_mode', { enabled });
  }

  /** Project card clicked */
  projectViewed(projectId: string) {
    this.event('project_viewed', { project: projectId });
  }

  /** Resume section expanded */
  resumeSectionViewed(section: string) {
    this.event('resume_section', { section });
  }

  /** Session duration milestone */
  sessionMilestone(minutes: number) {
    this.event('session_milestone', { minutes });
  }

  // ───────────────────────────────────────────────────────
  // INTERNAL
  // ───────────────────────────────────────────────────────

  private _send(type: string, data: Record<string, any>) {
    // If Umami is loaded as a script, use its global tracker
    if (typeof window !== 'undefined' && (window as any).umami) {
      try {
        if (type === 'pageview') {
          (window as any).umami.track();
        } else {
          (window as any).umami.track(data.name || type, data);
        }
        return;
      } catch {
        // Fallback to API
      }
    }

    // Direct API fallback (if Umami script not loaded)
    if (this.endpoint) {
      try {
        const payload = {
          type,
          payload: {
            website: this.trackingId,
            url: typeof window !== 'undefined' ? window.location.pathname : '/',
            ...data,
          },
        };

        // Use sendBeacon for reliability (fires even on page unload)
        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
          navigator.sendBeacon(
            `${this.endpoint}/api/send`,
            JSON.stringify(payload)
          );
        } else {
          fetch(`${this.endpoint}/api/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true,
          }).catch(() => {
            // Analytics failure is silent
          });
        }
      } catch {
        // Analytics failure is always silent
      }
    }
  }
}

// Singleton export
export const analytics = new AnalyticsClient();
