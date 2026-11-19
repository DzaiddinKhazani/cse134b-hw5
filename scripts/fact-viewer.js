"use strict";

/*
 * <fact-viewer> custom element (Part 2: live data).
 * - The internal button requests a random fact from the Useless Facts API.
 * - The page can toggle the "compact" attribute to hide the source line.
 * - A role="status" element reports loading, success, and failure.
 * - After a failure the same button becomes "Try again".
 * - Remote text is only ever inserted with textContent.
 */
const API_URL = "https://uselessfacts.jsph.pl/api/v2/facts/random";
const TIMEOUT_MS = 8000;

// Create an Error that carries a message that is safe to show to the visitor
function fail(userMessage) {
  const error = new Error(userMessage);
  error.userMessage = userMessage;
  return error;
}

// Only allow absolute https URLs; anything else returns null
function safeHttpsUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : null;
  } catch (err) {
    return null;
  }
}

class FactViewer extends HTMLElement {
  static get observedAttributes() {
    return ["compact"];
  }

  constructor() {
    super();
    this._built = false;
    this._pending = false;
  }

  connectedCallback() {
    if (this._built) return; // do not rebuild if the element is moved
    this._built = true;

    const heading = document.createElement("h3");
    heading.textContent = "Did you know?";

    this._factEl = document.createElement("p");
    this._factEl.className = "fact-text";
    this._factEl.textContent = "Select the button to load a fact.";

    this._detailsEl = document.createElement("p");
    this._detailsEl.className = "fact-details";

    this._btn = document.createElement("button");
    this._btn.type = "button";
    this._btn.textContent = "Get a fact";
    this._btn.addEventListener("click", () => this.loadFact());

    // The live region exists from the start, so later changes are announced
    this._statusEl = document.createElement("p");
    this._statusEl.className = "fact-status";
    this._statusEl.setAttribute("role", "status");

    // replaceChildren also removes the "JavaScript required" fallback text
    this.replaceChildren(heading, this._factEl, this._detailsEl, this._btn, this._statusEl);
    this._applyCompact();
  }

  attributeChangedCallback() {
    if (this._built) this._applyCompact();
  }

  async loadFact() {
    if (this._pending) return; // ignore clicks while a request is running
    this._pending = true;

    // A disabled button can lose focus, so remember it and restore it later
    const hadFocus = document.activeElement === this._btn;
    this._btn.disabled = true;
    this._setStatus("loading", "Loading a new fact...");

    // Give up if the server takes too long
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      // no-store makes sure each click is a real network request
      const response = await fetch(API_URL, {
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: controller.signal
      });

      // Even a 404 or 500 returns a response, so check the status
      if (!response.ok) {
        throw fail("The fact service returned an error (status " + response.status + ").");
      }

      const data = await response.json();

      // Check the fields we use before touching the page
      if (typeof data?.text !== "string" || data.text.trim() === "") {
        throw fail("The fact service sent a response without a fact.");
      }

      this._showFact(data);
      this._btn.textContent = "Get another fact";
      this._setStatus("success", "New fact loaded.");
    } catch (error) {
      console.error("Could not load a fact.", error);
      this._btn.textContent = "Try again";
      this._setStatus("error", this._messageFor(error));
    } finally {
      clearTimeout(timer);
      this._pending = false;
      this._btn.disabled = false;
      if (hadFocus) this._btn.focus();
    }
  }

  _messageFor(error) {
    if (error.userMessage) return error.userMessage;
    if (error.name === "AbortError") return "The request took too long. Please try again.";
    if (error instanceof SyntaxError) return "The fact service sent data that could not be read.";
    if (error instanceof TypeError) return "Could not reach the fact service. Check your connection and try again.";
    return "Something went wrong. Please try again.";
  }

  _showFact(data) {
    this._factEl.textContent = data.text; // textContent: remote text is never parsed as HTML

    this._detailsEl.replaceChildren();
    const source = typeof data.source === "string" ? data.source.trim() : "";
    if (source) {
      this._detailsEl.append("Source: ");
      const href = typeof data.source_url === "string" ? safeHttpsUrl(data.source_url) : null;
      if (href) {
        const link = document.createElement("a");
        link.href = href;
        link.rel = "noopener noreferrer";
        link.textContent = source;
        this._detailsEl.append(link);
      } else {
        this._detailsEl.append(source);
      }
    }
    this._applyCompact();
  }

  _setStatus(state, message) {
    this._statusEl.dataset.state = state;
    // "Error:" is real text so the failure never relies on color alone
    this._statusEl.textContent = state === "error" ? "Error: " + message : message;
  }

  // The source line is hidden in compact mode, or when there is no source yet
  _applyCompact() {
    this._detailsEl.hidden = this.hasAttribute("compact") || !this._detailsEl.hasChildNodes();
  }
}

customElements.define("fact-viewer", FactViewer);