import React, { useState, useEffect, useRef } from 'react';
import { 
  HelpCircle, 
  X, 
  ExternalLink, 
  Lightbulb, 
  Play, 
  FileText, 
  Video,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Star
} from 'lucide-react';

interface HelpLink {
  text: string;
  url: string;
  type?: 'article' | 'video' | 'tutorial' | 'external';
}

interface ContextualHelpProps {
  topic: string;
  title?: string;
  content: string;
  links?: HelpLink[];
  position?: 'top' | 'bottom' | 'left' | 'right';
  type?: 'tooltip' | 'popover' | 'modal';
  showFeedback?: boolean;
  showRelated?: boolean;
  autoShow?: boolean;
  delay?: number;
}

const ContextualHelp: React.FC<ContextualHelpProps> = ({
  topic,
  title,
  content,
  links = [],
  position = 'bottom',
  type = 'popover',
  showFeedback = true,
  showRelated = true,
  autoShow = false,
  delay = 0
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState<'helpful' | 'not-helpful' | null>(null);
  const [showThanks, setShowThanks] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const helpRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoShow && delay > 0) {
      timeoutRef.current = setTimeout(() => {
        setIsOpen(true);
      }, delay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [autoShow, delay]);

  useEffect(() => {
    // Track help usage
    if (isOpen) {
      const usage = {
        topic,
        timestamp: Date.now(),
        type: 'view'
      };
      
      const existingUsage = JSON.parse(localStorage.getItem('helpUsage') || '[]');
      existingUsage.push(usage);
      
      // Keep only last 100 entries
      if (existingUsage.length > 100) {
        existingUsage.splice(0, existingUsage.length - 100);
      }
      
      localStorage.setItem('helpUsage', JSON.stringify(existingUsage));
    }
  }, [isOpen, topic]);

  const handleFeedback = (type: 'helpful' | 'not-helpful') => {
    setFeedback(type);
    setShowThanks(true);
    
    // Track feedback
    const feedbackData = {
      topic,
      feedback: type,
      timestamp: Date.now()
    };
    
    const existingFeedback = JSON.parse(localStorage.getItem('helpFeedback') || '[]');
    existingFeedback.push(feedbackData);
    localStorage.setItem('helpFeedback', JSON.stringify(existingFeedback));
    
    setTimeout(() => {
      setShowThanks(false);
    }, 2000);
  };

  const getLinkIcon = (linkType?: string) => {
    switch (linkType) {
      case 'video':
        return <Video className="h-3 w-3" />;
      case 'tutorial':
        return <Play className="h-3 w-3" />;
      case 'article':
        return <FileText className="h-3 w-3" />;
      default:
        return <ExternalLink className="h-3 w-3" />;
    }
  };

  const getPositionClasses = () => {
    const baseClasses = type === 'modal' 
      ? 'fixed inset-0 flex items-center justify-center z-50'
      : 'absolute z-20';
    
    if (type === 'modal') return baseClasses;
    
    const sizeClasses = type === 'tooltip' ? 'w-64' : 'w-80 max-w-sm';
    
    switch (position) {
      case 'top':
        return `${baseClasses} ${sizeClasses} bottom-full mb-2 left-1/2 transform -translate-x-1/2`;
      case 'left':
        return `${baseClasses} ${sizeClasses} right-full mr-2 top-1/2 transform -translate-y-1/2`;
      case 'right':
        return `${baseClasses} ${sizeClasses} left-full ml-2 top-1/2 transform -translate-y-1/2`;
      default: // bottom
        return `${baseClasses} ${sizeClasses} top-full mt-2 left-1/2 transform -translate-x-1/2`;
    }
  };

  const getRelatedTopics = () => {
    // Simulate related topics based on current topic
    const relatedMap: Record<string, string[]> = {
      'checkout': ['payment', 'shipping', 'orders'],
      'payment': ['checkout', 'refunds', 'billing'],
      'shipping': ['delivery', 'tracking', 'returns'],
      'account': ['profile', 'security', 'preferences'],
      'products': ['search', 'filters', 'wishlist'],
      'cart': ['checkout', 'products', 'payment']
    };
    
    return relatedMap[topic.toLowerCase()] || [];
  };

  const renderHelpContent = () => (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-lg ${
      type === 'tooltip' ? 'p-3' : 'p-4'
    } ${type === 'modal' ? 'max-w-md w-full mx-4' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Lightbulb className="h-4 w-4 text-blue-600" />
          <h4 className={`font-semibold text-gray-900 ${
            type === 'tooltip' ? 'text-sm' : 'text-base'
          }`}>
            {title || `Help: ${topic}`}
          </h4>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      
      {/* Content */}
      <div className={`text-gray-700 mb-3 leading-relaxed ${
        type === 'tooltip' ? 'text-xs' : 'text-sm'
      }`}>
        {content}
      </div>
      
      {/* Links */}
      {links.length > 0 && (
        <div className="border-t border-gray-200 pt-3 mb-3">
          <p className={`font-medium text-gray-600 mb-2 ${
            type === 'tooltip' ? 'text-xs' : 'text-sm'
          }`}>
            Helpful Resources:
          </p>
          <div className="space-y-2">
            {links.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center text-blue-600 hover:text-blue-700 transition-colors ${
                  type === 'tooltip' ? 'text-xs' : 'text-sm'
                }`}
              >
                {getLinkIcon(link.type)}
                <span className="ml-2">{link.text}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Related Topics */}
      {showRelated && getRelatedTopics().length > 0 && (
        <div className="border-t border-gray-200 pt-3 mb-3">
          <p className={`font-medium text-gray-600 mb-2 ${
            type === 'tooltip' ? 'text-xs' : 'text-sm'
          }`}>
            Related Topics:
          </p>
          <div className="flex flex-wrap gap-1">
            {getRelatedTopics().map((relatedTopic, index) => (
              <button
                key={index}
                onClick={() => {
                  // This would typically navigate to related help topic
                  console.log(`Navigate to help topic: ${relatedTopic}`);
                }}
                className={`px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors ${
                  type === 'tooltip' ? 'text-xs' : 'text-sm'
                }`}
              >
                {relatedTopic}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Feedback */}
      {showFeedback && type !== 'tooltip' && (
        <div className="border-t border-gray-200 pt-3">
          {showThanks ? (
            <div className="flex items-center justify-center space-x-2 text-green-600">
              <Star className="h-4 w-4" />
              <span className="text-sm">Thank you for your feedback!</span>
            </div>
          ) : (
            <div>
              <p className="text-xs text-gray-600 mb-2">Was this helpful?</p>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleFeedback('helpful')}
                  className={`flex items-center space-x-1 px-3 py-1 rounded text-xs transition-colors ${
                    feedback === 'helpful'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600'
                  }`}
                >
                  <ThumbsUp className="h-3 w-3" />
                  <span>Yes</span>
                </button>
                <button
                  onClick={() => handleFeedback('not-helpful')}
                  className={`flex items-center space-x-1 px-3 py-1 rounded text-xs transition-colors ${
                    feedback === 'not-helpful'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
                  }`}
                >
                  <ThumbsDown className="h-3 w-3" />
                  <span>No</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="relative inline-block" ref={helpRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
        title={`Help: ${topic}`}
      >
        <HelpCircle className="h-4 w-4" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 ${type === 'modal' ? 'bg-black bg-opacity-50 z-40' : 'z-10'}`}
            onClick={() => setIsOpen(false)}
          />
          
          {/* Help Content */}
          <div className={getPositionClasses()}>
            {renderHelpContent()}
          </div>
        </>
      )}
    </div>
  );
};

export default ContextualHelp;