// Complete Tool Database - Master list of all tools with categories
// This file serves as the single source of truth for tool filtering

export interface ToolEntry {
  id: string;
  name: string;
  description: string;
  category: string;
  toolType: string[];
  source: "business" | "featured";
  isLive: boolean;
}

// Master tool database with all tools and their type mappings
export const toolsDatabase: ToolEntry[] = [
  // ========== BUSINESS TOOLS (from expandedTools) ==========
  
  // Finance & Accounting
  { id: "tool-1", name: "Invoice Generator", description: "Create tax-compliant bills with GST calculations", category: "Finance & Accounting", toolType: ["Finance & Billing", "Document Tools"], source: "business", isLive: true },
  { id: "tool-2", name: "Expense Tracker", description: "Log daily cash expenses to stop leakage", category: "Finance & Accounting", toolType: ["Finance & Billing", "Analytics Tools"], source: "business", isLive: true },
  { id: "tool-3", name: "Profit Calculator", description: "Calculate true margin after hidden costs", category: "Finance & Accounting", toolType: ["Finance & Billing", "Calculators", "Analytics Tools"], source: "business", isLive: true },
  { id: "tool-4", name: "Tax Estimator", description: "Estimate GST/TDS liability for the month", category: "Finance & Accounting", toolType: ["Finance & Billing", "Calculators"], source: "business", isLive: true },
  { id: "tool-5", name: "Bad Debt Recovery", description: "Draft strict messages for unpaid dues", category: "Finance & Accounting", toolType: ["Finance & Billing", "Writing Tools"], source: "business", isLive: true },
  
  // Legal & Compliance
  { id: "tool-6", name: "Contract Drafter", description: "Create standard service agreements", category: "Legal & Compliance", toolType: ["Legal & Compliance", "Document Tools", "Writing Tools"], source: "business", isLive: true },
  { id: "tool-7", name: "Compliance Checklist", description: "List licenses/permits needed to operate", category: "Legal & Compliance", toolType: ["Legal & Compliance", "Document Tools", "Security Tools"], source: "business", isLive: true },
  { id: "tool-8", name: "Notice Reply Bot", description: "Draft formal replies to government notices", category: "Legal & Compliance", toolType: ["Legal & Compliance", "AI & Automation", "Writing Tools", "Communication"], source: "business", isLive: true },
  { id: "tool-9", name: "Dispute Letter", description: "Write formal complaint letters", category: "Legal & Compliance", toolType: ["Legal & Compliance", "Document Tools", "Writing Tools"], source: "business", isLive: true },
  { id: "tool-10", name: "Safety Protocol", description: "Generate workplace safety checklists", category: "Legal & Compliance", toolType: ["Legal & Compliance", "Document Tools", "Security Tools"], source: "business", isLive: true },
  
  // Marketing & Sales
  { id: "tool-11", name: "Cold Outreach", description: "Pitch services to new clients", category: "Marketing & Sales", toolType: ["Marketing & Sales", "Writing Tools", "Communication"], source: "business", isLive: true },
  { id: "tool-12", name: "Offer Generator", description: "Create festival discount strategies", category: "Marketing & Sales", toolType: ["Marketing & Sales", "Writing Tools"], source: "business", isLive: true },
  { id: "tool-13", name: "Review Replier", description: "Draft replies to Google/Amazon reviews", category: "Marketing & Sales", toolType: ["Marketing & Sales", "AI & Automation", "Communication"], source: "business", isLive: true },
  { id: "tool-14", name: "Customer Follow-up", description: "Schedule polite lead reminders", category: "Marketing & Sales", toolType: ["Marketing & Sales", "Communication", "Productivity"], source: "business", isLive: true },
  { id: "tool-15", name: "Social Media Plan", description: "Create weekly content calendars", category: "Marketing & Sales", toolType: ["Marketing & Sales", "Social Media", "Content Creation"], source: "business", isLive: true },
  { id: "tool-16", name: "Campaign Manager", description: "Launch SMS/WhatsApp campaigns", category: "Marketing & Sales", toolType: ["Marketing & Sales", "Communication"], source: "business", isLive: true },
  { id: "tool-17", name: "Loyalty Program", description: "Manage reward points and tiers", category: "Marketing & Sales", toolType: ["Marketing & Sales", "Customer Service"], source: "business", isLive: true },
  { id: "tool-18", name: "Lead Magnet", description: "Capture and qualify leads", category: "Marketing & Sales", toolType: ["Marketing & Sales", "AI & Automation"], source: "business", isLive: true },
  { id: "tool-19", name: "Discount Strategist", description: "Calculate optimal discount rates", category: "Marketing & Sales", toolType: ["Marketing & Sales", "Calculators"], source: "business", isLive: true },
  
  // Operations & Inventory
  { id: "tool-20", name: "Stock Audit", description: "Checklist to count inventory", category: "Operations & Inventory", toolType: ["Operations", "Data Tools", "Analytics Tools"], source: "business", isLive: true },
  { id: "tool-21", name: "Wastage Log", description: "Track damaged/expired items", category: "Operations & Inventory", toolType: ["Operations", "Data Tools"], source: "business", isLive: true },
  { id: "tool-22", name: "Supplier Order", description: "Draft purchase orders", category: "Operations & Inventory", toolType: ["Operations", "Document Tools"], source: "business", isLive: true },
  { id: "tool-23", name: "Maintenance Log", description: "Track equipment repair dates", category: "Operations & Inventory", toolType: ["Operations", "Productivity"], source: "business", isLive: true },
  { id: "tool-24", name: "Shift Handover", description: "Notes for next shift manager", category: "Operations & Inventory", toolType: ["Operations", "Productivity"], source: "business", isLive: true },
  { id: "tool-25", name: "Stock Watchdog", description: "Alerts at re-order levels", category: "Operations & Inventory", toolType: ["Operations", "Data Tools"], source: "business", isLive: true },
  { id: "tool-26", name: "Vendor Rater", description: "Score supplier quality", category: "Operations & Inventory", toolType: ["Operations", "Analytics Tools"], source: "business", isLive: true },
  { id: "tool-27", name: "Quality Check", description: "Product quality inspection", category: "Operations & Inventory", toolType: ["Operations", "Data Tools", "Analytics Tools"], source: "business", isLive: true },
  
  // HR & Staffing
  { id: "tool-28", name: "Hiring Job Post", description: "Write job descriptions", category: "HR & Staffing", toolType: ["HR & Staffing", "Writing Tools"], source: "business", isLive: true },
  { id: "tool-29", name: "Interview Guide", description: "Candidate interview questions", category: "HR & Staffing", toolType: ["HR & Staffing", "Writing Tools"], source: "business", isLive: true },
  { id: "tool-30", name: "Salary Calculator", description: "Calculate payouts after deductions", category: "HR & Staffing", toolType: ["HR & Staffing", "Calculators"], source: "business", isLive: true },
  { id: "tool-31", name: "Warning Letter", description: "Draft formal warnings", category: "HR & Staffing", toolType: ["HR & Staffing", "Document Tools", "Writing Tools"], source: "business", isLive: true },
  { id: "tool-32", name: "Daily Task List", description: "Assign staff duties", category: "HR & Staffing", toolType: ["HR & Staffing", "Productivity"], source: "business", isLive: true },
  { id: "tool-33", name: "Shift Planner", description: "Auto-schedule shifts", category: "HR & Staffing", toolType: ["HR & Staffing", "Productivity"], source: "business", isLive: true },
  { id: "tool-34", name: "Payroll Engine", description: "Calculate salaries & overtime", category: "HR & Staffing", toolType: ["HR & Staffing", "Calculators"], source: "business", isLive: true },
  { id: "tool-35", name: "Attendance Tracker", description: "Selfie-based attendance", category: "HR & Staffing", toolType: ["HR & Staffing", "Productivity"], source: "business", isLive: true },
  { id: "tool-36", name: "Performance Scorecard", description: "Rate employee performance", category: "HR & Staffing", toolType: ["HR & Staffing", "Analytics Tools"], source: "business", isLive: true },
  
  // Customer Service
  { id: "tool-37", name: "Ticket Manager", description: "Track customer complaints", category: "Customer Service", toolType: ["Customer Service", "Productivity"], source: "business", isLive: true },
  { id: "tool-38", name: "FAQ Builder", description: "Create common question answers", category: "Customer Service", toolType: ["Customer Service", "AI & Automation", "Writing Tools"], source: "business", isLive: true },
  { id: "tool-39", name: "Feedback Collector", description: "Gather customer feedback", category: "Customer Service", toolType: ["Customer Service", "Communication"], source: "business", isLive: true },

  // ========== FEATURED TOOLS (from tools.tsx) ==========
  
  // Popular/Content/Research Tools
  { id: "jain-audio-stream", name: "Audio Stream", description: "Listen to lectures and music", category: "Popular", toolType: ["Audio Tools", "Research Tools"], source: "featured", isLive: true },
  { id: "jain-video-stream", name: "Video Stream", description: "Watch educational videos", category: "Popular", toolType: ["Video Tools", "Research Tools"], source: "featured", isLive: true },
  { id: "jaingyan-ai", name: "Gyan AI", description: "Intelligent AI assistant", category: "AI Agent", toolType: ["AI & Automation", "Research Tools"], source: "featured", isLive: true },
  { id: "advance-ai-bot", name: "Advance AI Bot", description: "Multi-source Q&A", category: "Popular", toolType: ["AI & Automation", "Research Tools"], source: "featured", isLive: true },
  { id: "shastra-pdf-reader", name: "PDF Reader", description: "Digital PDF reading", category: "Popular", toolType: ["Document Tools", "Research Tools"], source: "featured", isLive: true },
  { id: "jain-encyclopedia", name: "Encyclopedia", description: "Comprehensive knowledge base", category: "Popular", toolType: ["Research Tools", "Education"], source: "featured", isLive: true },
  { id: "jain-panchang", name: "Panchang", description: "Festivals and important dates", category: "Content", toolType: ["Research Tools", "Mind & Knowledge"], source: "featured", isLive: true },
  { id: "shastra-multi-pdf-ai-bot", name: "Multi-PDF AI Bot", description: "Query multiple documents", category: "Popular", toolType: ["AI & Automation", "Document Tools", "Research Tools"], source: "featured", isLive: true },
  { id: "quiz", name: "Quiz", description: "Knowledge testing quizzes", category: "Content", toolType: ["Education", "Research Tools"], source: "featured", isLive: true },
  { id: "image-creator", name: "Image Creator", description: "Create inspiring images", category: "Content", toolType: ["Design Tools", "Content Creation"], source: "featured", isLive: true },
  { id: "storybook-creator", name: "StoryBook Creator", description: "AI-generated stories", category: "Content", toolType: ["Design Tools", "Content Creation", "AI & Automation"], source: "featured", isLive: true },
  { id: "advance-text-extractor", name: "Advance Text Extractor", description: "Extract document excerpts", category: "Content", toolType: ["Text Tools", "Document Tools"], source: "featured", isLive: true },
  { id: "create-3d-images", name: "Create 3D Images", description: "3D image generation", category: "Content", toolType: ["Design Tools", "Image Tools"], source: "featured", isLive: true },
  { id: "sketchflow-ai", name: "SketchFlow AI", description: "Flowcharts and diagrams", category: "Content", toolType: ["Design Tools", "Developer Tools"], source: "featured", isLive: true },
  { id: "speedy-notebook", name: "Speedy Notebook", description: "Quick note-taking", category: "Research", toolType: ["Document Tools", "Writing Tools", "Productivity"], source: "featured", isLive: true },
  { id: "rich-editor", name: "Rich Editor", description: "Text formatting tool", category: "Research", toolType: ["Document Tools", "Text Tools"], source: "featured", isLive: true },
  { id: "pdf-chart-image-extractor", name: "PDF Chart & Image Extractor", description: "Extract from PDFs", category: "Research", toolType: ["Document Tools", "Data Tools"], source: "featured", isLive: true },
  { id: "shastra-hover-dictionary", name: "Hover Dictionary", description: "Word meanings on hover", category: "Research", toolType: ["Text Tools", "Education", "Research Tools"], source: "featured", isLive: true },
  { id: "html-editor", name: "HTML Editor", description: "Create/edit HTML", category: "Research", toolType: ["Developer Tools", "Document Tools"], source: "featured", isLive: true },
  { id: "wrong-written-words", name: "Wrong Written Words", description: "Correct misspellings", category: "Research", toolType: ["Text Tools", "Writing Tools"], source: "featured", isLive: true },
  { id: "book-editor", name: "Book Editor", description: "Format books and texts", category: "Research", toolType: ["Document Tools", "Research Tools"], source: "featured", isLive: true },
  { id: "book-editor-html", name: "Book Editor with HTML", description: "Advanced book editing", category: "Research", toolType: ["Document Tools", "Developer Tools", "Research Tools"], source: "featured", isLive: true },
  { id: "ocr", name: "OCR", description: "Image to text conversion", category: "Research", toolType: ["Text Tools", "Document Tools", "AI & Automation"], source: "featured", isLive: true },
  { id: "dictionary-extractor-ai", name: "Dictionary Extractor AI", description: "Extract dictionaries", category: "Research", toolType: ["AI & Automation", "Text Tools", "Research Tools"], source: "featured", isLive: true },
  { id: "pdf-profile-extractor", name: "PDF Profile Extractor", description: "Extract PDF profiles", category: "Research", toolType: ["Document Tools", "Data Tools"], source: "featured", isLive: true },
  { id: "pdf-metadata-ai-analyst", name: "PDF Metadata AI Analyst", description: "Analyze PDF metadata", category: "Research", toolType: ["Document Tools", "AI & Automation", "File Management"], source: "featured", isLive: true },
  { id: "soul-mirror", name: "Soul Mirror - Johari Window", description: "Self-awareness tool", category: "Modern Science", toolType: ["Mind & Knowledge", "Research Tools"], source: "featured", isLive: true },
  { id: "cognimap", name: "Cognimap - Mental Models", description: "Decision-making models", category: "Modern Science", toolType: ["Mind & Knowledge", "Research Tools"], source: "featured", isLive: true },
  { id: "ai-data-analysis", name: "AI Data Analysis", description: "Data visualization", category: "Lab", toolType: ["Analytics Tools", "AI & Automation", "Data Tools"], source: "featured", isLive: true },
  { id: "kundkund-ebook-bot", name: "E-book & Advance Bot", description: "E-book reader with AI", category: "Lab", toolType: ["AI & Automation", "Document Tools", "Research Tools"], source: "featured", isLive: true },
  { id: "kundkund-mindmap", name: "MindMap", description: "Visual concept organization", category: "Lab", toolType: ["Mind & Knowledge", "Productivity", "Design Tools"], source: "featured", isLive: true },
  { id: "jain-ganit", name: "Ganit", description: "Mathematics exploration", category: "Lab", toolType: ["Calculators", "Education", "Mind & Knowledge"], source: "featured", isLive: true },
  { id: "jainbhugol-maps", name: "Bhugol Maps (Beta)", description: "Interactive maps", category: "Lab", toolType: ["Mind & Knowledge", "Research Tools"], source: "featured", isLive: true },
  { id: "interactive-videos", name: "Interactive Videos (Beta)", description: "Videos with quizzes", category: "Lab", toolType: ["Video Tools", "Education"], source: "featured", isLive: true },
  { id: "smart-diagram-ai", name: "Create Smart Diagram AI", description: "AI diagram generation", category: "Lab", toolType: ["AI & Automation", "Design Tools", "Document Tools"], source: "featured", isLive: true },
  { id: "auto-text-extractor", name: "Auto Text Extractor Agent", description: "Automated text extraction", category: "AI Agent", toolType: ["AI & Automation", "Text Tools", "Document Tools"], source: "featured", isLive: true },
  
  // Image Tools - ID Photos
  { id: "ai-id-photo-generator", name: "AI ID Photo Generator", description: "Professional AI ID photos", category: "Image Tools", toolType: ["Image Tools", "Photo ID & Passport", "AI & Automation"], source: "featured", isLive: true },
  { id: "passport-photo-maker", name: "Passport Photo Maker", description: "Official passport photo requirements", category: "Image Tools", toolType: ["Image Tools", "Photo ID & Passport"], source: "featured", isLive: true },
  
  // Image Tools - Size & Compression
  { id: "reduce-image-size-kb", name: "Reduce Image Size in KB", description: "Compress to specific KB size", category: "Image Tools", toolType: ["Image Tools", "Converters"], source: "featured", isLive: true },
  { id: "resize-image-pixel", name: "Resize Image by Pixel", description: "Exact pixel dimensions", category: "Image Tools", toolType: ["Image Tools", "Converters"], source: "featured", isLive: true },
  { id: "increase-image-size-kb", name: "Increase Image Size in KB", description: "Meet minimum size requirements", category: "Image Tools", toolType: ["Image Tools", "Converters"], source: "featured", isLive: true },
  { id: "resize-image-cm", name: "Resize Image in Centimeters", description: "Exact cm dimensions for print", category: "Image Tools", toolType: ["Image Tools", "Converters"], source: "featured", isLive: true },
  { id: "resize-image-3.5x4.5", name: "Resize Image 3.5cm x 4.5cm", description: "Passport photo standard", category: "Image Tools", toolType: ["Image Tools", "Photo ID & Passport"], source: "featured", isLive: true },
  { id: "resize-image-mm", name: "Resize Image in Millimeters", description: "Exact mm dimensions", category: "Image Tools", toolType: ["Image Tools", "Converters"], source: "featured", isLive: true },
  { id: "resize-image-inch", name: "Resize Image in Inches", description: "Exact inch dimensions", category: "Image Tools", toolType: ["Image Tools", "Converters"], source: "featured", isLive: true },
  { id: "bulk-image-resizer", name: "Bulk Image Resizer", description: "Batch processing", category: "Image Tools", toolType: ["Image Tools", "Productivity"], source: "featured", isLive: true },
  { id: "resize-a4", name: "Resize to A4 Size", description: "A4 paper dimensions", category: "Image Tools", toolType: ["Image Tools", "Document Tools"], source: "featured", isLive: true },
  { id: "resize-600x600", name: "Resize 600x600 Pixels", description: "Exact pixel size", category: "Image Tools", toolType: ["Image Tools", "Social Media"], source: "featured", isLive: true },
  
  // Image Tools - Signatures
  { id: "generate-signature", name: "Generate Signature", description: "Create digital signatures", category: "Image Tools", toolType: ["Image Tools", "Signature Tools", "Document Tools"], source: "featured", isLive: true },
  { id: "resize-signature", name: "Resize Signature", description: "Resize to specific dimensions", category: "Image Tools", toolType: ["Image Tools", "Signature Tools"], source: "featured", isLive: true },
  { id: "resize-sign-6x2", name: "Resize Sign 6cm x 2cm", description: "Signature form size", category: "Image Tools", toolType: ["Image Tools", "Signature Tools"], source: "featured", isLive: true },
  { id: "resize-signature-50x20", name: "Signature 50mm x 20mm", description: "Official documents", category: "Image Tools", toolType: ["Image Tools", "Signature Tools"], source: "featured", isLive: true },
  { id: "merge-photo-signature", name: "Merge Photo & Signature", description: "Combine for applications", category: "Image Tools", toolType: ["Image Tools", "Signature Tools", "Photo ID & Passport"], source: "featured", isLive: true },
  
  // Image Tools - Background & Objects
  { id: "blur-background", name: "Blur Background", description: "Professional background blur", category: "Image Tools", toolType: ["Image Tools", "Design Tools"], source: "featured", isLive: true },
  { id: "remove-background", name: "Remove Background", description: "Auto remove backgrounds", category: "Image Tools", toolType: ["Image Tools", "AI & Automation"], source: "featured", isLive: true },
  { id: "remove-object-photo", name: "Remove Object from Photo", description: "AI object removal", category: "Image Tools", toolType: ["Image Tools", "AI & Automation"], source: "featured", isLive: true },
  
  // Image Tools - Basic Editing
  { id: "add-name-dob-photo", name: "Add Name & DOB on Photo", description: "Text overlays for documents", category: "Image Tools", toolType: ["Image Tools", "Text Tools", "Photo ID & Passport"], source: "featured", isLive: true },
  { id: "rotate-image", name: "Rotate Image", description: "Rotate to any angle", category: "Image Tools", toolType: ["Image Tools"], source: "featured", isLive: true },
  { id: "flip-image", name: "Flip Image", description: "Mirror horizontally/vertically", category: "Image Tools", toolType: ["Image Tools"], source: "featured", isLive: true },
  { id: "watermark-images", name: "Watermark Images", description: "Add custom watermarks", category: "Image Tools", toolType: ["Image Tools", "Security Tools"], source: "featured", isLive: true },
  { id: "freehand-crop", name: "Freehand Crop", description: "Custom shape cropping", category: "Image Tools", toolType: ["Image Tools", "Design Tools"], source: "featured", isLive: true },
  { id: "circle-crop", name: "Circle Crop", description: "Perfect circles for avatars", category: "Image Tools", toolType: ["Image Tools", "Social Media"], source: "featured", isLive: true },
  { id: "square-crop", name: "Square Crop", description: "Squares for social media", category: "Image Tools", toolType: ["Image Tools", "Social Media"], source: "featured", isLive: true },
  { id: "join-images", name: "Join Multiple Images", description: "Collages and panoramas", category: "Image Tools", toolType: ["Image Tools", "Design Tools"], source: "featured", isLive: true },
  { id: "split-image", name: "Split Image", description: "Split for grids/carousels", category: "Image Tools", toolType: ["Image Tools", "Social Media"], source: "featured", isLive: true },
  { id: "image-color-picker", name: "Image Color Picker", description: "Extract color codes", category: "Image Tools", toolType: ["Image Tools", "Design Tools"], source: "featured", isLive: true },
  { id: "add-text-image", name: "Add Text to Image", description: "Custom text overlays", category: "Image Tools", toolType: ["Image Tools", "Text Tools", "Design Tools"], source: "featured", isLive: true },
  { id: "add-logo-image", name: "Add Logo to Image", description: "Brand your images", category: "Image Tools", toolType: ["Image Tools", "Design Tools", "Marketing & Sales"], source: "featured", isLive: true },
  
  // Image Tools - Metadata
  { id: "edit-metadata", name: "Edit Image Metadata", description: "Edit EXIF data", category: "Image Tools", toolType: ["Image Tools", "File Management"], source: "featured", isLive: true },
  { id: "view-metadata", name: "View Image Metadata", description: "View photo information", category: "Image Tools", toolType: ["Image Tools", "File Management"], source: "featured", isLive: true },
  { id: "remove-metadata", name: "Remove Image Metadata", description: "Strip for privacy", category: "Image Tools", toolType: ["Image Tools", "File Management", "Security Tools"], source: "featured", isLive: true },
  
  // Image Tools - Effects & Filters
  { id: "beautify-image", name: "Beautify Image", description: "Auto beauty adjustments", category: "Image Tools", toolType: ["Image Tools", "Design Tools", "AI & Automation"], source: "featured", isLive: true },
  { id: "unblur-image", name: "Unblur Image", description: "AI sharpening", category: "Image Tools", toolType: ["Image Tools", "AI & Automation"], source: "featured", isLive: true },
  { id: "blur-image", name: "Blur Image", description: "Apply blur effects", category: "Image Tools", toolType: ["Image Tools"], source: "featured", isLive: true },
  { id: "blur-face", name: "Blur Face", description: "Auto-detect and blur faces", category: "Image Tools", toolType: ["Image Tools", "Security Tools", "AI & Automation"], source: "featured", isLive: true },
  { id: "unblur-face", name: "Unblur Face", description: "Enhance blurred faces", category: "Image Tools", toolType: ["Image Tools", "AI & Automation"], source: "featured", isLive: true },
  { id: "pixelate-image", name: "Pixelate Image", description: "Pixelation for privacy", category: "Image Tools", toolType: ["Image Tools", "Security Tools"], source: "featured", isLive: true },
  { id: "pixelate-face", name: "Pixelate Face", description: "Auto-pixelate faces", category: "Image Tools", toolType: ["Image Tools", "Security Tools", "AI & Automation"], source: "featured", isLive: true },
  { id: "censor-photo", name: "Censor Photo", description: "Blur/black bar censoring", category: "Image Tools", toolType: ["Image Tools", "Security Tools"], source: "featured", isLive: true },
  { id: "motion-blur", name: "Motion Blur", description: "Dynamic movement effects", category: "Image Tools", toolType: ["Image Tools", "Design Tools"], source: "featured", isLive: true },
  { id: "grayscale-image", name: "Grayscale Image", description: "Convert to grayscale", category: "Image Tools", toolType: ["Image Tools", "Converters"], source: "featured", isLive: true },
  { id: "black-white", name: "Black & White", description: "High-contrast B&W", category: "Image Tools", toolType: ["Image Tools", "Converters"], source: "featured", isLive: true },
  { id: "picture-pixel-art", name: "Picture to Pixel Art", description: "Retro pixel art style", category: "Image Tools", toolType: ["Image Tools", "Design Tools", "Converters"], source: "featured", isLive: true },
  { id: "ai-face-generator", name: "AI Face Generator", description: "Generate AI faces", category: "Image Tools", toolType: ["Image Tools", "AI & Automation", "Design Tools"], source: "featured", isLive: true },
  { id: "blemish-remover", name: "Blemish Remover", description: "Remove skin imperfections", category: "Image Tools", toolType: ["Image Tools", "Design Tools"], source: "featured", isLive: true },
  { id: "retouch-image", name: "Retouch Image", description: "Professional retouching", category: "Image Tools", toolType: ["Image Tools", "Design Tools"], source: "featured", isLive: true },
  
  // Image Tools - DPI & Quality
  { id: "ai-photo-enhancer", name: "AI Photo Enhancer", description: "Enhance quality using AI", category: "Image Tools", toolType: ["Image Tools", "AI & Automation"], source: "featured", isLive: true },
  { id: "increase-image-quality", name: "Increase Image Quality", description: "AI upscaling", category: "Image Tools", toolType: ["Image Tools", "AI & Automation"], source: "featured", isLive: true },
  { id: "convert-dpi", name: "Convert DPI", description: "200/300/600 DPI for print", category: "Image Tools", toolType: ["Image Tools", "Converters"], source: "featured", isLive: true },
  { id: "check-dpi", name: "Check Image DPI", description: "Check resolution info", category: "Image Tools", toolType: ["Image Tools", "File Management"], source: "featured", isLive: true },
  { id: "super-resolution", name: "Super Resolution", description: "AI enhancement", category: "Image Tools", toolType: ["Image Tools", "AI & Automation"], source: "featured", isLive: true },
  { id: "upscale-image-ai", name: "Upscale Image with AI", description: "AI-powered upscaling", category: "Image Tools", toolType: ["Image Tools", "AI & Automation"], source: "featured", isLive: true },
  
  // Image Tools - Official Sizes
  { id: "ssc-photo-resize", name: "SSC Photo Resize", description: "SSC exam requirements", category: "Image Tools", toolType: ["Image Tools", "Photo ID & Passport", "Education"], source: "featured", isLive: true },
  { id: "pan-card-resize", name: "PAN Card Photo Resize", description: "Indian PAN card specs", category: "Image Tools", toolType: ["Image Tools", "Photo ID & Passport"], source: "featured", isLive: true },
  { id: "upsc-photo-resize", name: "UPSC Photo Resize", description: "UPSC exam requirements", category: "Image Tools", toolType: ["Image Tools", "Photo ID & Passport", "Education"], source: "featured", isLive: true },
  { id: "psc-photo-resize", name: "PSC Photo Resize", description: "PSC exam requirements", category: "Image Tools", toolType: ["Image Tools", "Photo ID & Passport", "Education"], source: "featured", isLive: true },
  { id: "resize-35x45mm", name: "Resize 35mm x 45mm", description: "Passport standard", category: "Image Tools", toolType: ["Image Tools", "Photo ID & Passport"], source: "featured", isLive: true },
  { id: "resize-2x2-inch", name: "Resize 2x2 Inch", description: "US passport size", category: "Image Tools", toolType: ["Image Tools", "Photo ID & Passport"], source: "featured", isLive: true },
  { id: "resize-3x4-inch", name: "Resize 3x4 Inch", description: "3x4 inch photos", category: "Image Tools", toolType: ["Image Tools", "Photo ID & Passport"], source: "featured", isLive: true },
  { id: "resize-4x6-inch", name: "Resize 4x6 Inch", description: "Print size standard", category: "Image Tools", toolType: ["Image Tools"], source: "featured", isLive: true },
  
  // Image Tools - Social Media
  { id: "instagram-resize", name: "Instagram Resize (No Crop)", description: "Instagram without cropping", category: "Image Tools", toolType: ["Image Tools", "Social Media"], source: "featured", isLive: true },
  { id: "instagram-grid", name: "Instagram Grid Maker", description: "Carousel grids", category: "Image Tools", toolType: ["Image Tools", "Social Media"], source: "featured", isLive: true },
  { id: "whatsapp-dp", name: "WhatsApp DP Resize", description: "Profile pictures", category: "Image Tools", toolType: ["Image Tools", "Social Media"], source: "featured", isLive: true },
  { id: "youtube-banner", name: "YouTube Banner Resize", description: "Channel banners", category: "Image Tools", toolType: ["Image Tools", "Social Media", "Content Creation"], source: "featured", isLive: true },
  { id: "zoom-out-image", name: "Zoom Out Image", description: "Extend canvas", category: "Image Tools", toolType: ["Image Tools", "Design Tools"], source: "featured", isLive: true },
  
  // Education Tools - For Students
  { id: "quiz-maker", name: "Quiz Maker", description: "Create interactive self-assessment quizzes", category: "For Students", toolType: ["Education", "Productivity"], source: "featured", isLive: true },
  { id: "grade-calculator", name: "Grade Calculator", description: "Calculate GPA, CGPA, and overall grades", category: "For Students", toolType: ["Education", "Calculators"], source: "featured", isLive: true },
  { id: "study-planner", name: "Study Planner", description: "Create personalized study schedules", category: "For Students", toolType: ["Education", "Productivity"], source: "featured", isLive: true },
  { id: "flashcard-maker", name: "Flashcard Maker", description: "Digital flashcards for spaced repetition", category: "For Students", toolType: ["Education", "Productivity"], source: "featured", isLive: true },
  { id: "assignment-tracker", name: "Assignment Tracker", description: "Track assignments and deadlines", category: "For Students", toolType: ["Education", "Productivity"], source: "featured", isLive: true },
  { id: "bibliography-generator", name: "Bibliography Generator", description: "Generate APA, MLA, Chicago, Harvard citations", category: "For Students", toolType: ["Education", "Writing Tools", "Research Tools"], source: "featured", isLive: true },
  { id: "exam-scheduler", name: "Exam Scheduler", description: "Schedule exams with auto study plans", category: "For Students", toolType: ["Education", "Productivity"], source: "featured", isLive: true },
  
  // Education Tools - For Teachers
  { id: "lesson-planner", name: "Lesson Planner", description: "Create lesson plans with objectives", category: "For Teachers", toolType: ["Education", "Productivity", "Document Tools"], source: "featured", isLive: true },
  
  // Content Creation Tools
  { id: "social-post-generator", name: "Social Post Generator", description: "AI-generated social media posts", category: "Content Creation", toolType: ["Content Creation", "Social Media", "AI & Automation", "Writing Tools"], source: "featured", isLive: true },
  { id: "caption-generator", name: "Caption Generator", description: "Creative captions for images/videos", category: "Content Creation", toolType: ["Content Creation", "Social Media", "AI & Automation", "Writing Tools"], source: "featured", isLive: true },
  { id: "hashtag-generator", name: "Hashtag Generator", description: "Relevant hashtags with popularity levels", category: "Content Creation", toolType: ["Content Creation", "Social Media", "SEO Tools"], source: "featured", isLive: true },
  { id: "content-idea-generator", name: "Content Idea Generator", description: "AI content ideas with hooks", category: "Content Creation", toolType: ["Content Creation", "AI & Automation", "SEO Tools"], source: "featured", isLive: true },
  { id: "video-script-writer", name: "Video Script Writer", description: "Scripts with sections and timing", category: "Content Creation", toolType: ["Content Creation", "Video Tools", "Writing Tools"], source: "featured", isLive: true },
  { id: "content-workflow", name: "Content Creation Workflow", description: "End-to-end content creation", category: "Content Creation", toolType: ["Content Creation", "Productivity"], source: "featured", isLive: true },
  { id: "thumbnail-maker", name: "AI Thumbnail Maker", description: "Generate video thumbnails with AI", category: "Content Creation", toolType: ["Content Creation", "Image Tools", "AI & Automation", "Design Tools"], source: "featured", isLive: true },
  { id: "video-maker", name: "AI Video Maker", description: "Create videos from text/images", category: "Content Creation", toolType: ["Content Creation", "Video Tools", "AI & Automation"], source: "featured", isLive: true },
];

// Helper functions

// Get all unique tool types
export function getAllToolTypes(): string[] {
  const types = new Set<string>();
  toolsDatabase.forEach(tool => {
    tool.toolType.forEach(type => types.add(type));
  });
  return Array.from(types).sort();
}

// Get tools by type
export function getToolsByType(toolType: string): ToolEntry[] {
  if (toolType === "All Types") return toolsDatabase;
  return toolsDatabase.filter(tool => tool.toolType.includes(toolType));
}

// Get tools by category
export function getToolsByCategory(category: string): ToolEntry[] {
  return toolsDatabase.filter(tool => tool.category === category);
}

// Get tools by source
export function getToolsBySource(source: "business" | "featured"): ToolEntry[] {
  return toolsDatabase.filter(tool => tool.source === source);
}

// Search tools
export function searchTools(query: string): ToolEntry[] {
  const lowerQuery = query.toLowerCase();
  return toolsDatabase.filter(tool => 
    tool.name.toLowerCase().includes(lowerQuery) ||
    tool.description.toLowerCase().includes(lowerQuery) ||
    tool.category.toLowerCase().includes(lowerQuery) ||
    tool.toolType.some(type => type.toLowerCase().includes(lowerQuery))
  );
}

// Get tool names for a specific type (for backward compatibility with toolTypes.tsx)
export function getToolNamesForType(toolType: string): string[] {
  return getToolsByType(toolType).map(tool => tool.name);
}

// Export as CSV string
export function exportToolsAsCSV(): string {
  const headers = ["ID", "Name", "Description", "Category", "Tool Types", "Source", "Is Live"];
  const rows = toolsDatabase.map(tool => [
    tool.id,
    `"${tool.name}"`,
    `"${tool.description}"`,
    `"${tool.category}"`,
    `"${tool.toolType.join(", ")}"`,
    tool.source,
    tool.isLive ? "Yes" : "No"
  ]);
  
  return [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
}

// Tool count statistics
export const toolStats = {
  total: toolsDatabase.length,
  business: toolsDatabase.filter(t => t.source === "business").length,
  featured: toolsDatabase.filter(t => t.source === "featured").length,
  live: toolsDatabase.filter(t => t.isLive).length,
  byType: getAllToolTypes().reduce((acc, type) => {
    acc[type] = getToolsByType(type).length;
    return acc;
  }, {} as Record<string, number>)
};
