

import React, { useState } from 'react';
import type { ResourceItem } from '../types';
import { NewspaperIcon, VideoCameraIcon, DocumentTextIcon, GlobeAltIcon } from './icons';
import { highlightText } from './EditableContent';

type ResourceTab = 'news' | 'videos' | 'papers' | 'references';

const getYoutubeEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    let videoId = null;

    try {
        // Standard URL format: https://www.youtube.com/watch?v=VIDEO_ID
        const urlObj = new URL(url);
        if (urlObj.hostname.includes('youtube.com')) {
            videoId = urlObj.searchParams.get('v');
        } 
        // Shortened URL format: https://youtu.be/VIDEO_ID
        else if (urlObj.hostname.includes('youtu.be')) {
            videoId = urlObj.pathname.slice(1);
        }
    } catch (e) {
        // Fallback for malformed URLs that are not full URLs
        // e.g., "watch?v=VIDEO_ID" or just "youtube.com/watch?v=VIDEO_ID"
    }

    // If standard parsing fails, try regex matching as a robust fallback
    if (!videoId) {
        const match = url.match(/(?:[?&]v=|embed\/|vi?\/|youtu\.be\/)([^&\s?#]+)/);
        if (match && match[1]) {
            videoId = match[1];
        }
    }

    // Final cleanup for cases like "watch?v=VIDEO_ID" being part of the ID
    if (videoId && videoId.includes('watch?v=')) {
        videoId = new URLSearchParams(videoId.split('?')[1]).get('v');
    }
    
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
}

const ResourceCard: React.FC<{ item: ResourceItem, keywords: string[], highlightEnabled: boolean }> = ({ item, keywords, highlightEnabled }) => {
    const embedUrl = item.type === 'youtube' ? getYoutubeEmbedUrl(item.url) : null;
    
    return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 transition-shadow hover:shadow-md page-break-avoid">
            {embedUrl ? (
                <div className="aspect-video mb-4">
                    <iframe 
                        src={embedUrl}
                        title={item.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full rounded-md"
                    ></iframe>
                </div>
            ) : null}
            <h3 className="font-bold text-gray-800 mb-2">
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 hover:underline">
                    {item.title}
                </a>
            </h3>
            <p className="text-sm text-gray-600">{highlightText(item.summary, keywords, highlightEnabled)}</p>
        </div>
    )
};


export const Resources: React.FC<{
    news: ResourceItem[];
    videos: ResourceItem[];
    papers: ResourceItem[];
    sources: { uri: string; title: string }[];
    keywords: string[];
    highlightEnabled: boolean;
}> = ({ news, videos, papers, sources, keywords, highlightEnabled }) => {
    const [activeTab, setActiveTab] = useState<ResourceTab>('news');
    
    const renderTabButton = (tab: ResourceTab, icon: React.ReactNode, text: string, count: number) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${
                activeTab === tab
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:bg-gray-100'
            }`}
        >
            {icon}
            <span>{text}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>{count}</span>
        </button>
    );

    const renderContent = () => {
        const cardProps = { keywords, highlightEnabled };
        switch (activeTab) {
            case 'news':
                return news.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {news.map((item, i) => <ResourceCard key={`news-${i}`} item={item} {...cardProps} />)}
                    </div>
                ) : <p className="text-center text-gray-500 py-8">No news articles found.</p>;
            case 'videos':
                return videos.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {videos.map((item, i) => <ResourceCard key={`video-${i}`} item={item} {...cardProps} />)}
                    </div>
                ) : <p className="text-center text-gray-500 py-8">No YouTube videos found.</p>;
            case 'papers':
                return papers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {papers.map((item, i) => <ResourceCard key={`paper-${i}`} item={item} {...cardProps} />)}
                    </div>
                ) : <p className="text-center text-gray-500 py-8">No research papers found.</p>;
            case 'references':
                 return sources.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-2">
                        {sources.map((source, i) => (
                            <li key={i}>
                                <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                                    {source.title || source.uri}
                                </a>
                            </li>
                        ))}
                    </ul>
                ) : <p className="text-center text-gray-500 py-8">No web references were used in this analysis.</p>;
            default:
                return null;
        }
    }

    return (
        <div>
            <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">Resources</h2>
            <div className="flex flex-wrap justify-center items-center gap-2 border-b pb-4 mb-6">
                {renderTabButton('news', <NewspaperIcon className="w-5 h-5" />, 'News & PR', news.length)}
                {renderTabButton('videos', <VideoCameraIcon className="w-5 h-5" />, 'Videos', videos.length)}
                {renderTabButton('papers', <DocumentTextIcon className="w-5 h-5" />, 'Research', papers.length)}
                {renderTabButton('references', <GlobeAltIcon className="w-5 h-5" />, 'Web References', sources.length)}
            </div>
            <div>{renderContent()}</div>
        </div>
    );
};