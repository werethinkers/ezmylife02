// Portrait App Store-style screenshots for each app.
// Files live in public/app-screenshots/<app-id>-<n>.png.
// Add more entries here as new screenshot sets are generated.
export const APP_SCREENSHOTS: Readonly<Record<string, string[]>> = {
  "add-logo-image":          ["/app-screenshots/add-logo-image-1.png", "/app-screenshots/add-logo-image-2.png"],
  "tool-103":                ["/app-screenshots/tool-103-1.png"],
  "tool-97":                 ["/app-screenshots/tool-97-1.png"],
  "accident-claim-helper":   ["/app-screenshots/accident-claim-helper-1.png"],
  "ad-campaign-studio":      ["/app-screenshots/ad-campaign-studio-1.png"],
  "tool-77":                 ["/app-screenshots/tool-77-1.png"],
  "90-day-marketing-plan":   ["/app-screenshots/90-day-marketing-plan-1.png", "/app-screenshots/90-day-marketing-plan-2.png"],
};

export const appScreenshots = (id: string): string[] => APP_SCREENSHOTS[id] ?? [];
