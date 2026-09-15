// Transcribed from docs/design/report.design.html:726-746 (the section detail modal).
// Entirely hardcoded chrome: every id here is a hook the page script
// (../constants/script.ts) addresses directly, and "Appears on" is copy.
export function modalSection(): string {
  return `
<dialog id="secmodal" class="secmodal" aria-label="Section detail">
  <button type="button" class="m-close" id="mClose" aria-label="Close">&times;</button>
  <div class="shotbox m-shot" id="mShot"></div>
  <div class="m-body">
    <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 24px;">
      <h3 class="sub" id="mName" style="font-size: 23px;"></h3>
      <div class="m-nav" id="mNav" style="display: flex; align-items: center; gap: 8px; flex: none;">
        <button type="button" id="mPrev" aria-label="Previous section">&larr;</button>
        <span class="mono" id="mPos" style="font-size: 12px; color: #545454; min-width: 44px; text-align: center;"></span>
        <button type="button" id="mNext" aria-label="Next section">&rarr;</button>
      </div>
    </div>
    <div id="mChips" style="display: flex; gap: 6px; margin-top: 14px; flex-wrap: wrap;"></div>
    <p class="body" id="mSummary" style="font-size: 14.5px; margin-top: 18px;"></p>
    <div id="mMeta" style="display: flex; align-items: baseline; gap: 12px; margin-top: 20px; padding-top: 16px; border-top: 1px solid #171717;">
      <span style="font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #545454; flex: none;">Appears on</span>
      <span class="mono" id="mPages" style="font-size: 12.5px; color: #9c9c9c;"></span>
      <style>#mPages .pathlink { color: #9c9c9c; } #mPages .pathlink:hover { color: var(--fr-accent); }</style>
    </div>
  </div>
</dialog>`;
}
