# Design QA

## Scope

- Empty optimizer workspace
- Pending and completed file-list states
- Inspector, preview, output settings and advanced settings
- Sidebar show/hide interaction
- Before/after comparison entry point

## Visual comparison

- References: the supplied empty and completed Image Optimizer screenshots
- Implementation captures: `04-final-empty.png` and `05-final-empty-unified.png` in the local audit artifacts
- Viewport: 1040 × 620 application window

## Findings resolved

- Unified the primary button and segmented-control height at 28 px.
- Removed persistent outlines, borders and shadows from buttons and segmented controls.
- Restored the reference-like 730/310 workspace and inspector split.
- Made file selection a full-width flat row instead of an inset rounded card.
- Increased the summary area and replaced the thin edge line with an inset rounded progress bar.
- Made progress determinate: 0% before launch, proportional while processing and 100% only after every file finishes.
- Kept the preview fixed while inspector settings scroll independently.
- Replaced the native scrolling container with shadcn-vue ScrollArea so its overlay scrollbar does not reflow inspector controls.
- Kept the file actions footer fixed while the file rows scroll independently in shadcn-vue ScrollArea.
- Replaced the PNG quality range with one quality control; pngquant now always uses a zero lower boundary.
- Kept the previous preview visible until the newly selected image is decoded, with stale-request protection for rapid selection changes.
- Sized the completion canvas in physical pixels and scaled particle physics for crisp Retina confetti.
- Aligned summary metrics with the main result and kept progress on its own full-width grid row.
- Added a dependency-free SVG savings donut and reorganized summary metrics into a compact vertical legend.
- Synchronized the donut fill with CountUp.js; the percentage counts up while the saved-size value counts down from the original size.
- Moved legacy workflow settings into the shadcn-vue Collapsible without removing them.
- Reduced numeric precision in file sizes and saved percentages.
- Added a WebP data-URL fallback for side-by-side previews.

## Interaction checks

- Add Images dialog opens.
- Optimization completes and updates summary, rows and footer.
- Inspector opens and closes.
- shadcn-vue Collapsible opens and preserves all advanced settings.
- Before/after handle and comparison window were exercised in the completed-state pass.
- Comparison canvas keeps a clean border after focus and supports Space + drag panning above 100% zoom.
- Comparison opens centered against the source window and remains inside the same display work area.

## Result

P0: 0

P1: 0

P2: 0

final result: passed

## Summary concept pass

- Source: `codex-clipboard-3806ce75-3688-4f29-b3a4-34c42b276aff.png`, completed state.
- Implementation: Electron window at 1040 × 620, completed state with one PNG optimized by 73%.
- Focused comparison: `/tmp/image-optimizer-summary-comparison.png`.
- Matched the concept's three-part hierarchy: savings donut, primary saved value and vertical metric legend.
- Kept the existing product language and full-width progress track intentionally; no other workspace areas were redesigned in this pass.
- Verified the pending state has an empty track with no misleading progress mark, while the completed state shows the actual savings percentage.

final result: passed
