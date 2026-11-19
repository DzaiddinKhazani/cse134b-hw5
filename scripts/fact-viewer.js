"use strict";

/*
 * <fact-viewer> custom element.
 * - Shows one fact at a time from a local array (Part 1).
 * - An internal "Next fact" button cycles through the facts.
 * - The "compact" attribute hides the extra details. A native button on the
 *   page toggles it (see the inline script in index.html).
 * - In Part 2, replace SAMPLE_FACTS / the click handler with a fetch() to the
 *   useless-facts API. Only showFact() needs to change: it already takes a
 *   {text, topic} object.
 */
const SAMPLE_FACTS = [
  { text: "Honey never spoils. Edible honey has been found in ancient Egyptian tombs.", topic: "Food" },
  { text: "A day on Venus is longer than a year on Venus.", topic: "Space" },
  { text: "Octopuses have three hearts.", topic: "Animals" },
  { text: "Botanically, bananas are berries, but strawberries are not.", topic: "Plants" },
  { text: "Wombat droppings are cube-shaped.", topic: "Animals" }
];

class FactViewer extends HTMLElement {
  // The page can toggle "compact"; the component reacts in attributeChangedCallback
  static get observedAttributes() {
    return ["compact"];
  }

  constructor() {
    super();
    this._facts = SAMPLE_FACTS;
    this._index = 0;
    this._built = false;
  }

  connectedCallback() {
    if (this._built) return; // do not rebuild if the element is moved
    this._built = true;

    // Heading
    const heading = document.createElement("h3");
    heading.textContent = "Did you know?";

    // Current fact. aria-live announces the new fact to screen readers.
    this._factEl = document.createElement("p");
    this._factEl.className = "fact-text";
    this._factEl.setAttribute("aria-live", "polite");

    // Extra details, hidden in compact mode
    this._detailsEl = document.createElement("p");
    this._detailsEl.className = "fact-details";

    // Internal control
    this._nextBtn = document.createElement("button");
    this._nextBtn.type = "button";
    this._nextBtn.textContent = "Next fact";
    this._nextBtn.addEventListener("click", () => this.next());

    // Status message
    this._statusEl = document.createElement("p");
    this._statusEl.className = "fact-status";

    // replaceChildren also removes any "JavaScript required" fallback text
    this.replaceChildren(heading, this._factEl, this._detailsEl, this._nextBtn, this._statusEl);

    this.showFact(this._index);
    this._applyCompact();
  }

  attributeChangedCallback() {
    if (this._built) this._applyCompact();
  }

  next() {
    this._index = (this._index + 1) % this._facts.length;
    this.showFact(this._index);
  }

  showFact(i) {
    const fact = this._facts[i];
    this._factEl.textContent = fact.text;
    this._detailsEl.textContent = "Topic: " + fact.topic;
    this._statusEl.textContent = "Fact " + (i + 1) + " of " + this._facts.length;
  }

  // Both states are visible: details show when expanded, disappear when compact.
  // The current fact is never touched, so the selection survives a toggle.
  _applyCompact() {
    this._detailsEl.hidden = this.hasAttribute("compact");
  }
}

customElements.define("fact-viewer", FactViewer);