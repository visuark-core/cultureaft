import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  RotateCcw,
  HelpCircle,
  Target,
  CheckCircle
} from 'lucide-react';

interface TourStep {
  id: string;
  target: string; // CSS selector for the element to highlight
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: {
    type: 'click' | 'hover' | 'scroll';
    element?: string;
  };
  optional?: boolean;
}

interface GuidedTourProps {
  tourId: string;
  steps: TourStep[];
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
  autoPlay?: boolean;
  showProgress?: boolean;
}

const GuidedTour: React.FC<GuidedTourProps> = ({
  tourId,
  steps,
  isActive,
  onComplete,
  onSkip,
  autoPlay = false,
  showProgress = true
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive && steps.length > 0) {
      highlightStep(currentStep);
      
      // Save tour progress
      const progress = {
        tourId,
        currentStep,
        completedSteps: Array.from(completedSteps),
        timestamp: Date.now()
      };
      localStorage.setItem(`tour_${tourId}`, JSON.stringify(progress));
    }

    return () => {
      removeHighlight();
    };
  }, [isActive, currentStep, tourId, completedSteps]);

  useEffect(() => {
    // Load saved tour progress
    const savedProgress = localStorage.getItem(`tour_${tourId}`);
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress);
        setCurrentStep(progress.currentStep || 0);
        setCompletedSteps(new Set(progress.completedSteps || []));
      } catch (error) {
        console.error('Failed to load tour progress:', error);
      }
    }
  }, [tourId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying && isActive) {
      interval = setInterval(() => {
        handleNext();
      }, 5000); // Auto-advance every 5 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, isActive, currentStep]);

  const highlightStep = (stepIndex: number) => {
    const step = steps[stepIndex];
    if (!step) return;

    removeHighlight();

    const targetElement = document.querySelector(step.target) as HTMLElement;
    if (!targetElement) {
      console.warn(`Tour target element not found: ${step.target}`);
      return;
    }

    // Add highlight class
    targetElement.classList.add('tour-highlight');
    setHighlightedElement(targetElement);

    // Calculate tooltip position
    const rect = targetElement.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    let x = 0, y = 0;

    switch (step.position) {
      case 'top':
        x = rect.left + scrollLeft + rect.width / 2;
        y = rect.top + scrollTop - 10;
        break;
      case 'bottom':
        x = rect.left + scrollLeft + rect.width / 2;
        y = rect.bottom + scrollTop + 10;
        break;
      case 'left':
        x = rect.left + scrollLeft - 10;
        y = rect.top + scrollTop + rect.height / 2;
        break;
      case 'right':
        x = rect.right + scrollLeft + 10;
        y = rect.top + scrollTop + rect.height / 2;
        break;
      case 'center':
        x = window.innerWidth / 2;
        y = window.innerHeight / 2;
        break;
    }

    setTooltipPosition({ x, y });

    // Scroll element into view
    targetElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center'
    });

    // Execute step action if specified
    if (step.action) {
      setTimeout(() => {
        executeStepAction(step.action!);
      }, 1000);
    }
  };

  const removeHighlight = () => {
    if (highlightedElement) {
      highlightedElement.classList.remove('tour-highlight');
      setHighlightedElement(null);
    }
  };

  const executeStepAction = (action: TourStep['action']) => {
    if (!action) return;

    const element = action.element 
      ? document.querySelector(action.element) as HTMLElement
      : highlightedElement;

    if (!element) return;

    switch (action.type) {
      case 'click':
        element.click();
        break;
      case 'hover':
        element.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        setTimeout(() => {
          element.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
        }, 2000);
        break;
      case 'scroll':
        element.scrollIntoView({ behavior: 'smooth' });
        break;
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkipStep = () => {
    handleNext();
  };

  const handleComplete = () => {
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    removeHighlight();
    
    // Clear saved progress
    localStorage.removeItem(`tour_${tourId}`);
    
    onComplete();
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setIsPlaying(false);
  };

  const getTooltipStyle = () => {
    const step = steps[currentStep];
    if (!step) return {};

    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      zIndex: 10001,
      transform: 'translate(-50%, -50%)'
    };

    switch (step.position) {
      case 'top':
        return {
          ...baseStyle,
          left: tooltipPosition.x,
          top: tooltipPosition.y,
          transform: 'translate(-50%, -100%)'
        };
      case 'bottom':
        return {
          ...baseStyle,
          left: tooltipPosition.x,
          top: tooltipPosition.y,
          transform: 'translate(-50%, 0%)'
        };
      case 'left':
        return {
          ...baseStyle,
          left: tooltipPosition.x,
          top: tooltipPosition.y,
          transform: 'translate(-100%, -50%)'
        };
      case 'right':
        return {
          ...baseStyle,
          left: tooltipPosition.x,
          top: tooltipPosition.y,
          transform: 'translate(0%, -50%)'
        };
      case 'center':
        return {
          ...baseStyle,
          left: tooltipPosition.x,
          top: tooltipPosition.y
        };
      default:
        return baseStyle;
    }
  };

  if (!isActive || steps.length === 0) return null;

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black bg-opacity-50 z-10000"
        style={{ zIndex: 10000 }}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="bg-white rounded-lg shadow-xl border border-gray-200 max-w-sm w-full"
        style={getTooltipStyle()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-gray-900">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
          <button
            onClick={onSkip}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress Bar */}
        {showProgress && (
          <div className="px-4 pt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {currentStepData.title}
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            {currentStepData.content}
          </p>

          {currentStepData.optional && (
            <div className="mt-3 flex items-center space-x-2 text-xs text-gray-500">
              <HelpCircle className="h-3 w-3" />
              <span>This step is optional</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title={isPlaying ? 'Pause tour' : 'Play tour'}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            
            <button
              onClick={handleRestart}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Restart tour"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {currentStepData.optional && (
              <button
                onClick={handleSkipStep}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Skip
              </button>
            )}
            
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <button
              onClick={handleNext}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Complete</span>
                </>
              ) : (
                <>
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tour Styles */}
      <style jsx global>{`
        .tour-highlight {
          position: relative;
          z-index: 10001;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 8px rgba(59, 130, 246, 0.2);
          border-radius: 8px;
          transition: all 0.3s ease;
        }
        
        .tour-highlight::before {
          content: '';
          position: absolute;
          inset: -4px;
          border: 2px solid #3b82f6;
          border-radius: 8px;
          animation: tour-pulse 2s infinite;
        }
        
        @keyframes tour-pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.02);
          }
        }
      `}</style>
    </>
  );
};

export default GuidedTour;