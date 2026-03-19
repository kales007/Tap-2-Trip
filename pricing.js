/**
 * pricing.js — Tap to Trip
 * ─────────────────────────────────────────────────────────────
 * Central pricing config for all 16 destinations.
 * Price = ratePerDay[destination][days] × travellerCount
 *
 * HOW TO USE:
 *   1. Add <script src="pricing.js"></script> to every page that
 *      needs pricing (destination detail pages, payment.html,
 *      confirmation.html).
 *   2. Call TapToTrip.getPrice(destination, days, count) anywhere.
 *   3. On destination detail pages call TapToTrip.saveTripDetails()
 *      before navigating to travellers.html.
 *   4. On payment.html call TapToTrip.renderPaymentSummary() to
 *      auto-populate the price and summary.
 * ─────────────────────────────────────────────────────────────
 */

const TapToTrip = (() => {

  // ── Per-person per-day rates (₹) for each destination ──────
  // Each destination has rates for 1–5 days.
  // Longer stays get a slight discount per day (bulk saving).
const RATES = {
    "Dubai": {
      1: 15000,
      2: 13500,
      3: 12000,
      4: 11000,
      5: 10000
    },
    "Paris": {
      1: 28000,
      2: 25000,
      3: 22000,
      4: 20000,
      5: 18000
    },
    "Bali": {
      1: 10000,
      2: 9000,
      3: 8000,
      4: 7500,
      5: 7000
    },
    "Switzerland": {
      1: 35000,
      2: 32000,
      3: 29000,
      4: 26000,
      5: 24000
    },
    "Tokyo": {
      1: 26000,
      2: 23000,
      3: 20000,
      4: 18000,
      5: 16500
    },
    "New York": {
      1: 32000,
      2: 29000,
      3: 26000,
      4: 23000,
      5: 21000
    },
    "Norway": {
      1: 36000,
      2: 33000,
      3: 30000,
      4: 27000,
      5: 25000
    },
    "Iceland": {
      1: 38000,
      2: 34000,
      3: 30000,
      4: 27000,
      5: 25000
    },
    "Maldives": {
      1: 18000,
      2: 16000,
      3: 14500,
      4: 13000,
      5: 12000
    },
    "Santorini": {
      1: 30000,
      2: 27000,
      3: 24000,
      4: 22000,
      5: 20000
    },
    "Scotland": {
      1: 28000,
      2: 25000,
      3: 22000,
      4: 20000,
      5: 18000
    },
    "Thailand": {
      1: 9000,
      2: 8000,
      3: 7000,
      4: 6500,
      5: 6000
    },
    "Nepal": {
      1: 5500,
      2: 5000,
      3: 4500,
      4: 4000,
      5: 3500
    },
    "Mauritius": {
      1: 20000,
      2: 18000,
      3: 16000,
      4: 14500,
      5: 13000
    },
    "Seychelles": {
      1: 28000,
      2: 25000,
      3: 22000,
      4: 20000,
      5: 18000
    },
    "New Zealand": {
      1: 33000,
      2: 30000,
      3: 27000,
      4: 24000,
      5: 22000
    }
  };

  // traveller-type → count mapping (fallback if count not stored)
  const TYPE_COUNT = {
    "Solo":   1,
    "Couple": 2,
    "Friends": null,  // uses stored travellerCount
    "Family":  null
  };

  // ── Helpers ─────────────────────────────────────────────────

  /**
   * Returns the rate-per-day for a destination + day count.
   * Falls back gracefully if destination/days is unknown.
   */
  function getRatePerDay(destination, days) {
    const dest = RATES[destination];
    if (!dest) return 15000; // safe default
    const d = Math.min(Math.max(parseInt(days) || 1, 1), 5);
    return dest[d] || dest[Object.keys(dest).pop()];
  }

  /**
   * Returns total trip price in ₹.
   * @param {string} destination
   * @param {number} days        - 1 to 5
   * @param {number} count       - number of travellers
   */
  function getPrice(destination, days, count) {
    const rate = getRatePerDay(destination, days);
    return rate * (parseInt(days) || 1) * (parseInt(count) || 1);
  }

  /**
   * Formats a number as Indian currency string e.g. "1,80,000"
   */
  function formatINR(amount) {
    return amount.toLocaleString("en-IN");
  }

  // ── localStorage helpers ─────────────────────────────────────

  function getTravellerCount() {
    const type  = localStorage.getItem("travellerType")  || "Solo";
    const saved = localStorage.getItem("travellerCount");
    if (TYPE_COUNT[type] !== null && TYPE_COUNT[type] !== undefined) {
      return TYPE_COUNT[type];
    }
    return parseInt(saved) || 1;
  }

  function getDays() {
    return parseInt(localStorage.getItem("tripDuration")) || 1;
  }

  function getDestination() {
    return localStorage.getItem("selectedPlace") || "Dubai";
  }

  // ── Called from destination detail pages ─────────────────────

  /**
   * Call this before navigating away from a destination detail page.
   * Saves selectedPlace and selectedDays into localStorage.
   * @param {string} destination  - e.g. "Iceland"
   * @param {number} days         - selected day count
   */
  function saveTripDetails(destination, days) {
    localStorage.setItem("selectedPlace", destination);
    localStorage.setItem("tripDuration",  days);
    sessionStorage.setItem("trip_destination", destination);
    sessionStorage.setItem("trip_days", days);
  }

  // ── Called from destination detail pages to show live price ──

  /**
   * Updates a price display element on the destination detail page.
   * Shows per-person rate for currently selected days.
   *
   * @param {string} destination
   * @param {number} days
   * @param {string} elementId   - DOM id of the element to update
   */
  function updateDetailPagePrice(destination, days, elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const rate  = getRatePerDay(destination, days);
    const total = rate * days;
    el.innerHTML = `₹${formatINR(total)} <span class="price-sub">/ person</span>`;
  }

  // ── Called from payment.html ─────────────────────────────────

  /**
   * Reads all localStorage values and renders the correct price
   * in payment.html. Call this inside DOMContentLoaded.
   *
   * Expects these element IDs in payment.html:
   *   #displayAmount   — big price in order summary
   *   #btnAmount       — price in UPI pay button
   *   #btnAmountCard   — price in card pay button
   *
   * Also writes calculatedPrice back to localStorage so
   * confirmation.html can read it.
   */
  function renderPaymentSummary() {
    const destination = getDestination();
    const days        = getDays();
    const count       = getTravellerCount();
    const total       = getPrice(destination, days, count);
    const formatted   = formatINR(total);

    localStorage.setItem("calculatedPrice", total);
    localStorage.setItem("calculatedPriceFormatted", formatted);

    // Update price display elements
    const ids = ["displayAmount", "btnAmount", "btnAmountCard"];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      if (id === "displayAmount") {
        el.innerHTML = `<small>₹</small>${formatted}`;
      } else {
        el.textContent = `₹${formatted}`;
      }
    });

    // Update QR code UPI amount if QRCode library is present
    // (payment.html generates QR after calling this, so we just
    //  expose the amount via a global for payment.html to use)
    window._TTT_totalAmount = total;
    window._TTT_amountFormatted = formatted;
  }

  // ── Called from confirmation.html ────────────────────────────

  /**
   * Returns the final price string to show on confirmation page.
   * Uses calculatedPriceFormatted from localStorage (set by
   * renderPaymentSummary), or recalculates as fallback.
   */
  function getConfirmedPriceFormatted() {
    const saved = localStorage.getItem("calculatedPriceFormatted");
    if (saved) return saved;
    const destination = getDestination();
    const days        = getDays();
    const count       = getTravellerCount();
    return formatINR(getPrice(destination, days, count));
  }

  // ── Public API ───────────────────────────────────────────────
  return {
    RATES,
    getPrice,
    getRatePerDay,
    formatINR,
    getTravellerCount,
    getDays,
    getDestination,
    saveTripDetails,
    updateDetailPagePrice,
    renderPaymentSummary,
    getConfirmedPriceFormatted
  };

})();