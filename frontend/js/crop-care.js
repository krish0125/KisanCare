/**
 * frontend/js/crop-care.js
 * -------------------------
 * Handles the Crop Care page: fetches irrigation advice and pest risk from the
 * backend advisory endpoints in parallel, then renders both result sections.
 *
 * Endpoints:
 *   POST /api/irrigation-advice
 *   POST /api/pest-risk
 *
 * Phase 5 — rule-based advisories only.
 * # TODO: Phase 6 — pre-fill growth stage and soil inputs from saved crop history.
 */

(function () {
  "use strict";

  const API_BASE = "http://localhost:5001";

  // ── DOM references ──────────────────────────────────────────────────────────
  const form            = document.getElementById("cropCareForm");
  const submitBtn       = document.getElementById("submitBtn");
  const btnText         = document.getElementById("btnText");
  const btnSpinner      = document.getElementById("btnSpinner");
  const formError       = document.getElementById("formError");
  const resultsSection  = document.getElementById("resultsSection");
  const mockBanner      = document.getElementById("mockBanner");

  // Irrigation result elements
  const irrSection      = document.getElementById("irrigationSection");
  const irrBadge        = document.getElementById("irrBadge");
  const irrBadgeIcon    = document.getElementById("irrBadgeIcon");
  const irrQuantity     = document.getElementById("irrQuantity");
  const irrTiming       = document.getElementById("irrTiming");
  const irrReasoning    = document.getElementById("irrReasoning");
  const irrTip          = document.getElementById("irrTip");
  const irrWeatherTemp  = document.getElementById("irrWeatherTemp");
  const irrWeatherHumid = document.getElementById("irrWeatherHumid");
  const irrWeatherRain  = document.getElementById("irrWeatherRain");
  const irrWeatherProb  = document.getElementById("irrWeatherProb");

  // Pest result elements
  const pestSection     = document.getElementById("pestSection");
  const pestList        = document.getElementById("pestList");
  const pestEmpty       = document.getElementById("pestEmpty");
  const pestWeatherTemp = document.getElementById("pestWeatherTemp");
  const pestWeatherHumid= document.getElementById("pestWeatherHumid");

  // ── Recommendation config (badge label, colour class, icon) ────────────────
  const REC_CONFIG = {
    irrigate_now:      { label: "Irrigate Now",       cls: "badge-danger",   icon: "water_drop"      },
    irrigate_soon:     { label: "Irrigate Soon",      cls: "badge-warning",  icon: "opacity"          },
    defer_rain_coming: { label: "Defer — Rain Coming",cls: "badge-info",     icon: "umbrella"         },
    sufficient:        { label: "Sufficient — No Irrigation Needed", cls: "badge-success", icon: "check_circle" },
  };

  const RISK_CONFIG = {
    high:     { cls: "risk-high",     label: "High Risk"     },
    moderate: { cls: "risk-moderate", label: "Moderate Risk" },
    low:      { cls: "risk-low",      label: "Low Risk"      },
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function setLoading(loading) {
    submitBtn.disabled  = loading;
    btnText.style.display    = loading ? "none"   : "flex";
    btnSpinner.style.display = loading ? "flex"   : "none";
  }

  function showError(msg) {
    formError.textContent    = msg;
    formError.style.display  = "block";
    resultsSection.style.display = "none";
  }

  function hideError() {
    formError.style.display  = "none";
  }

  function showMockBanner(show) {
    mockBanner.style.display = show ? "flex" : "none";
  }

  // ── Render irrigation result ─────────────────────────────────────────────────

  function renderIrrigation(data) {
    const cfg = REC_CONFIG[data.recommendation] || {
      label: data.recommendation, cls: "badge-info", icon: "info"
    };

    irrBadge.className    = "rec-badge " + cfg.cls;
    irrBadge.textContent  = cfg.label;
    irrBadgeIcon.textContent = cfg.icon;

    if (data.water_quantity_mm > 0) {
      irrQuantity.textContent = `${data.water_quantity_mm} mm`;
      document.getElementById("irrQuantityRow").style.display = "flex";
    } else {
      document.getElementById("irrQuantityRow").style.display = "none";
    }

    if (data.water_quantity_mm > 0) {
      irrTiming.textContent = data.timing;
      document.getElementById("irrTimingRow").style.display = "flex";
    } else {
      document.getElementById("irrTimingRow").style.display = "none";
    }

    irrReasoning.textContent = data.reasoning;
    irrTip.textContent       = data.water_saving_tip;

    // Weather chips
    const w = data.weather_used || {};
    irrWeatherTemp.textContent  = w.temp  != null ? `${w.temp}°C` : "—";
    irrWeatherHumid.textContent = w.humidity != null ? `${w.humidity}%` : "—";
    irrWeatherRain.textContent  = w.rain_forecast_48h_mm != null ? `${w.rain_forecast_48h_mm} mm` : "—";
    irrWeatherProb.textContent  = w.rain_prob_max_pct != null ? `${w.rain_prob_max_pct}%` : "—";

    irrSection.style.display = "block";
    // Trigger animation
    irrSection.classList.remove("animate-in");
    void irrSection.offsetWidth;
    irrSection.classList.add("animate-in");
  }

  // ── Render pest risk result ──────────────────────────────────────────────────

  function renderPests(data) {
    const w = data.weather_used || {};
    pestWeatherTemp.textContent  = w.temp  != null ? `${w.temp}°C` : "—";
    pestWeatherHumid.textContent = w.humidity != null ? `${w.humidity}%` : "—";

    const pests = data.pests || [];
    pestList.innerHTML = "";

    if (pests.length === 0) {
      pestEmpty.style.display = "flex";
      pestList.style.display  = "none";
    } else {
      pestEmpty.style.display = "none";
      pestList.style.display  = "block";

      pests.forEach((pest, idx) => {
        const riskCfg = RISK_CONFIG[pest.risk_level] || { cls: "risk-low", label: pest.risk_level };
        const offSeasonNote = pest.off_season && pest.season_note
          ? `<div class="off-season-note">
               <span class="material-icons" style="font-size:0.9rem;vertical-align:middle;">calendar_today</span>
               ${pest.season_note}
             </div>`
          : "";

        const preventionHtml = (pest.prevention || []).map(p =>
          `<li>${p}</li>`
        ).join("");

        const cardId = `pestCard_${idx}`;
        const bodyId = `pestBody_${idx}`;

        const card = document.createElement("div");
        card.className = "pest-card";
        card.style.animationDelay = `${idx * 80}ms`;
        card.innerHTML = `
          <div class="pest-card-header" onclick="togglePestCard('${bodyId}', this)" id="header_${idx}">
            <div class="pest-title-row">
              <span class="material-icons pest-icon">bug_report</span>
              <div>
                <div class="pest-name">${pest.pest_name}</div>
                ${pest.local_name ? `<div class="pest-local-name">${pest.local_name}</div>` : ""}
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:10px;">
              <span class="risk-badge ${riskCfg.cls}">${riskCfg.label}</span>
              <div class="risk-bar-wrap" title="Risk score: ${pest.risk_score}/100">
                <div class="risk-bar-fill ${riskCfg.cls}" style="width:${pest.risk_score}%"></div>
              </div>
              <span class="expand-icon material-icons">expand_more</span>
            </div>
          </div>
          <div class="pest-card-body" id="${bodyId}">
            ${offSeasonNote}
            <p class="pest-description">${pest.description}</p>
            <div class="pest-detail-grid">
              <div class="pest-detail-col">
                <div class="pest-detail-label">
                  <span class="material-icons" style="font-size:1rem;color:#16a34a;">shield</span>
                  Prevention
                </div>
                <ul class="pest-prevention-list">${preventionHtml}</ul>
              </div>
              <div class="pest-detail-col">
                <div class="pest-detail-label">
                  <span class="material-icons" style="font-size:1rem;color:#0ea5e9;">healing</span>
                  Treatment
                </div>
                <div class="treatment-tabs">
                  <button class="treatment-tab active" onclick="switchTab(this, 'organic_${idx}')"><span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>eco</span> Organic</button>
                  <button class="treatment-tab" onclick="switchTab(this, 'chemical_${idx}')"> Chemical</button>
                </div>
                <div class="treatment-content" id="organic_${idx}">${(pest.treatment || {}).organic || "—"}</div>
                <div class="treatment-content" id="chemical_${idx}" style="display:none;">${(pest.treatment || {}).chemical || "—"}</div>
              </div>
            </div>
          </div>
        `;
        pestList.appendChild(card);
      });
    }

    pestSection.style.display = "block";
    pestSection.classList.remove("animate-in");
    void pestSection.offsetWidth;
    pestSection.classList.add("animate-in");
  }

  // ── Global helpers for inline onclick handlers ───────────────────────────────

  window.togglePestCard = function (bodyId, headerEl) {
    const body    = document.getElementById(bodyId);
    const icon    = headerEl.querySelector(".expand-icon");
    const isOpen  = body.style.maxHeight && body.style.maxHeight !== "0px";
    if (isOpen) {
      body.style.maxHeight = "0px";
      body.style.opacity   = "0";
      icon.style.transform = "rotate(0deg)";
    } else {
      body.style.maxHeight = body.scrollHeight + 200 + "px";
      body.style.opacity   = "1";
      icon.style.transform = "rotate(180deg)";
    }
  };

  window.switchTab = function (btn, contentId) {
    // Deactivate all tabs in the same treatment-tabs group
    const tabs = btn.closest(".treatment-tabs").querySelectorAll(".treatment-tab");
    tabs.forEach(t => t.classList.remove("active"));
    btn.classList.add("active");

    // Hide all sibling content panels
    const grid     = btn.closest(".pest-detail-col");
    const contents = grid.querySelectorAll(".treatment-content");
    contents.forEach(c => (c.style.display = "none"));
    document.getElementById(contentId).style.display = "block";
  };

  // ── Form submit ──────────────────────────────────────────────────────────────

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    hideError();

    const city         = document.getElementById("ccCity").value.trim();
    const crop         = document.getElementById("ccCrop").value;
    const growthStage  = document.getElementById("ccGrowthStage").value;
    const soilType     = document.getElementById("ccSoilType").value;
    const soilMoisture = document.querySelector('input[name="soilMoisture"]:checked')?.value;

    if (!city)         return showError("Please enter your city or district name.");
    if (!crop)         return showError("Please select a crop.");
    if (!growthStage)  return showError("Please select the current growth stage.");
    if (!soilType)     return showError("Please select your soil type.");
    if (!soilMoisture) return showError("Please select current soil moisture estimate.");

    setLoading(true);
    resultsSection.style.display = "none";
    irrSection.style.display     = "none";
    pestSection.style.display    = "none";
    showMockBanner(false);

    const irrPayload  = { city, crop, growth_stage: growthStage, soil_type: soilType, soil_moisture: soilMoisture };
    const pestPayload = { city, crop };

    try {
      const [irrResp, pestResp] = await Promise.all([
        fetch(`${API_BASE}/api/irrigation-advice`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(irrPayload),
        }),
        fetch(`${API_BASE}/api/pest-risk`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pestPayload),
        }),
      ]);

      const irrData  = await irrResp.json();
      const pestData = await pestResp.json();

      if (irrData.status === "error") {
        showError("Irrigation advice error: " + irrData.message);
        setLoading(false);
        return;
      }
      if (pestData.status === "error") {
        showError("Pest risk error: " + pestData.message);
        setLoading(false);
        return;
      }

      // Show mock banner if either endpoint returned mock data
      if (irrData.status === "mock" || pestData.status === "mock") {
        showMockBanner(true);
      }

      renderIrrigation(irrData);
      renderPests(pestData);

      resultsSection.style.display = "block";
      resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });

    } catch (err) {
      showError("Could not connect to KisanCare server. Make sure the backend is running on port 5001.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  });

})();
