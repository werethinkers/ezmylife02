import { Bot, BookOpen, Library, Calendar, Layers, ClipboardList, Image, BookText, FileText, Notebook, Edit, FileImage, Languages, Code, Eraser, BarChart3, Brain, Map, FileEdit, Calculator, Folder, Globe, Video, Network, Box } from "lucide-react";
import { ReactNode } from "react";

export interface Tool {
  title: string;
  description: string;
  category: string;
  icon: ReactNode;
  link: string;
  videoLink: string;
}

export const tools: Tool[] = [
  {
    title: "Advance AI Bot",
    description: "Ask questions from multiple specified sources to get instant answers about Jainism.",
    category: "Popular",
    icon: <Bot className="h-8 w-8" />,
    link: "https://kundkund.com/advance_ai-bot.html",
    videoLink: "https://www.loom.com/share/88b01502cfc94549961e5a65aaae8603?sid=f7e70c03-a887-4e0d-bafe-6fd85d27dd45"
  },
  {
    title: "Shastra PDF Reader",
    description: "Read scriptures in digital format. This tool helps you easily read and study scriptures in PDF format.",
    category: "Popular",
    icon: <BookOpen className="h-8 w-8" />,
    link: "https://kundkund-shastra-reader-v20-0-443425442943.us-west1.run.app/",
    videoLink: "https://www.loom.com/share/88c39a36c6cc499a85d913e69347ea18?sid=a8906f09-33fb-4ba4-918c-2b9890fd4d66"
  },
  {
    title: "Jain Encyclopedia",
    description: "A comprehensive encyclopedia of Jain terms, concepts, and history.",
    category: "Popular",
    icon: <Library className="h-8 w-8" />,
    link: "https://jain-encyclopedia-v2-0-443425442943.us-west1.run.app/",
    videoLink: "https://www.loom.com/share/f94c887d82ca415c8a5e47943d4ce237?sid=419fd2ff-d39a-4a89-8042-1e137f14ff5d"
  },
  {
    title: "Jain Panchang",
    description: "Stay updated with upcoming Jain festivals, dates, and important spiritual days.",
    category: "Content",
    icon: <Calendar className="h-8 w-8" />,
    link: "https://jain-panchang-digamber-443425442943.us-west1.run.app/",
    videoLink: "https://www.loom.com/share/27c8f352c22f48df9f8efb0b15327506?sid=9b8b19a6-9810-4674-8c6f-b4dc0562073b"
  },
  {
    title: "Shastra Multi-PDF AI Bot",
    description: "Ask questions from multiple scriptures at once with our advanced AI and get answers.",
    category: "Popular",
    icon: <Layers className="h-8 w-8" />,
    link: "https://shastra-multi-pdf-ai-bot-443425442943.us-west1.run.app/",
    videoLink: "https://www.loom.com/share/419a9d4378b8417491a95d0e1d4cdb0d?sid=74611eba-9223-4985-a782-231e36c0f8e2"
  },
  {
    title: "Quiz",
    description: "Test your knowledge on Jainism topics by creating quizzes of your choice and reinforce your understanding.",
    category: "Content",
    icon: <ClipboardList className="h-8 w-8" />,
    link: "https://kundkund-quiz-443425442943.us-west1.run.app/",
    videoLink: "https://www.loom.com/share/20204bab9ceb46e68027cde57ed2bbfc?sid=74e848e0-087c-42fe-83f6-038ea97e780e"
  },
  {
    title: "Image Creator",
    description: "Create and share beautiful and inspiring images and quotes based on the teachings of Acharya Kundkund.",
    category: "Content",
    icon: <Image className="h-8 w-8" />,
    link: "https://kundkund-image-creator-443425442943.us-west1.run.app/",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4"
  },
  {
    title: "StoryBook Creator",
    description: "Use AI to create new, inspiring stories and illustrations based on Jain principles and narratives.",
    category: "Content",
    icon: <BookText className="h-8 w-8" />,
    link: "https://kundkund-storybook-creator-443425442943.us-west1.run.app/",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4"
  },
  {
    title: "Advance Text Extractor",
    description: "Extract and organize important excerpts from scriptures.",
    category: "Content",
    icon: <FileText className="h-8 w-8" />,
    link: "https://kundkund-text-extractor-v3-0-443425442943.us-west1.run.app/",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4"
  },
  {
    title: "Speedy Notebook",
    description: "Save time writing Gathas and Sutras.",
    category: "Research",
    icon: <Notebook className="h-8 w-8" />,
    link: "https://kundkund.com/SpeedyNoteBook.html",
    videoLink: "https://www.loom.com/share/ef5ff4f1569b4d87962d83483e619e98?sid=1258a673-0f71-404c-ac29-11bf9b03ce99"
  },
  {
    title: "Rich Editor",
    description: "This is a powerful tool for formatting Jain scripture text in digital form.",
    category: "Research",
    icon: <Edit className="h-8 w-8" />,
    link: "https://kundkund-rich-editor-v4-0-443425442943.us-west1.run.app/",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4"
  },
  {
    title: "PDF Chart & Image Extractor",
    description: "A powerful tool to extract charts and images from PDFs.",
    category: "Research",
    icon: <FileImage className="h-8 w-8" />,
    link: "https://pdf-chart-image-bulk-cover-extractor-v2-0-443425442943.us-west1.run.app/",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4"
  },
  {
    title: "Shastra Hover Dictionary",
    description: "See the meaning of difficult words from ancient scriptures by simply hovering over them.",
    category: "Research",
    icon: <Languages className="h-8 w-8" />,
    link: "https://kundkund-hover-dictionary-v2-0-443425442943.us-west1.run.app/",
    videoLink: "https://www.loom.com/share/ef5ff4f1569b4d87962d83483e619e98?sid=1258a673-0f71-404c-ac29-11bf9b03ce99"
  },
  {
    title: "HTML Editor",
    description: "Create and edit HTML content with a simple and powerful editor.",
    category: "Research",
    icon: <Code className="h-8 w-8" />,
    link: "https://ezmylife-html-editor-v2-0-443425442943.us-west1.run.app/",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4"
  },
  {
    title: "Wrong Written Words",
    description: "It identifies incorrectly written words and finds their correct forms, improving writing accuracy.",
    category: "Research",
    icon: <Eraser className="h-8 w-8" />,
    link: "https://wrong-written-words-443425442943.us-west1.run.app/",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4"
  },
  {
    title: "AI Data Analysis",
    description: "Visualize and analyze data with our interactive AI-powered dashboard.",
    category: "Lab",
    icon: <BarChart3 className="h-8 w-8" />,
    link: "https://ai-data-analysis-dashboard-v3-0-443425442943.us-west1.run.app/",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4"
  },
  {
    title: "KundKund E-book & Advance Bot",
    description: "An advanced e-book reader with an integrated AI assistant.",
    category: "Lab",
    icon: <Brain className="h-8 w-8" />,
    link: "https://kundkund-e-book-multi-source-based-ai-bot-443425442943.us-west1.run.app/",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4"
  },
  {
    title: "KundKund MindMap",
    description: "Visually organize and explore Jain concepts with mind maps.",
    category: "Lab",
    icon: <Map className="h-8 w-8" />,
    link: "https://kundkund-mindmap-443425442943.us-west1.run.app/",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4"
  },
  {
    title: "KundKund PDF cum E-Book",
    description: "An advanced PDF reader with an integrated AI assistant.",
    category: "Lab",
    icon: <FileEdit className="h-8 w-8" />,
    link: "https://kundkund-pdf-cum-e-book-v2-0-443425442943.us-west1.run.app/",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4"
  },
  {
    title: "Jain Ganit",
    description: "Explore complex Jain mathematics and cosmology concepts.",
    category: "Lab",
    icon: <Calculator className="h-8 w-8" />,
    link: "https://jain-ganit-bhugol-443425442943.us-west1.run.app/",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4"
  },
  {
    title: "KundKund Editor with PDF & Ebook",
    description: "A powerful editor for PDF and E-book formats.",
    category: "Lab",
    icon: <FileEdit className="h-8 w-8" />,
    link: "https://kundkund-pdf-e-book-editor-v4-0-443425442943.us-west1.run.app/",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4"
  },
  {
    title: "ScrapBook",
    description: "Collect and organize spiritual notes, images, and ideas in a personal digital scrapbook.",
    category: "Content",
    icon: <Folder className="h-8 w-8" />,
    link: "https://kundkund-scrapbook-443425442943.us-west1.run.app/",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4"
  },
  {
    title: "JainBhugol Maps (Beta)",
    description: "Explore the concepts of Jain geography and cosmology with interactive maps. (Beta Version)",
    category: "Lab",
    icon: <Globe className="h-8 w-8" />,
    link: "https://kundkund-jainbhugol-maps-443425442943.us-west1.run.app/",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4"
  },
  {
    title: "Interactive Videos (Beta)",
    description: "Engage with spiritual teachings through interactive videos with quizzes. (Beta Version)",
    category: "Lab",
    icon: <Video className="h-8 w-8" />,
    link: "https://kundkund-interactive-video-quiz-443425442943.us-west1.run.app/",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4"
  },
  {
    title: "Create Smart Diagram AI v2.0",
    description: "Generate complex diagrams, flowcharts, and visual aids from your notes and ideas using AI.",
    category: "Lab",
    icon: <Network className="h-8 w-8" />,
    link: "https://create-smart-diagram-ai-v2-0-443425442943.us-west1.run.app/",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4"
  },
  {
    title: "Create 3D Images",
    description: "Design and generate stunning 3D images and models for visual representations of concepts.",
    category: "Content",
    icon: <Box className="h-8 w-8" />,
    link: "https://create-3d-images-443425442943.us-west1.run.app/",
    videoLink: "https://kundkund.com/Videos/Training_Videos/About_Home_Page.mp4"
  }
];
