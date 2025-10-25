import React, { useState } from 'react';
import { 
  ShoppingCart, 
  User, 
  CreditCard,
  ChevronRight,
  Play,
  CheckCircle
} from 'lucide-react';

interface Guide {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  steps: GuideStep[];
}

interface GuideStep {
  id: string;
  title: string;
  description: string;
  image?: string;
  tips?: string[];
}

const UserGuides = () => {
  const [selectedGuide, setSelectedGuide] = useState<string>('');
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const guides: Guide[] = [
    {
      id: 'first-purchase',
      title: 'Making Your First Purchase',
      description: 'Step-by-step guide to buying your first handicraft item',
      icon: ShoppingCart,
      duration: '5 minutes',
      difficulty: 'Beginner',
      steps: [
        {
          id: 'browse-products',
          title: 'Browse Products',
          description: 'Explore our collection of authentic handicrafts using categories and filters.',
          tips: [
            'Use the search bar to find specific items',
            'Filter by price, category, or region',
            'Check product ratings and reviews'
          ]
        },
        {
          id: 'add-to-cart',
          title: 'Add Items to Cart',
          description: 'Select your desired products and add them to your shopping cart.',
          tips: [
            'Check product details and specifications',
            'Select quantity and any customization options',
            'View similar products for comparison'
          ]
        },
        {
          id: 'checkout',
          title: 'Complete Checkout',
          description: 'Review your order and complete the purchase securely.',
          tips: [
            'Double-check shipping address',
            'Choose your preferred payment method',
            'Apply any discount codes you have'
          ]
        }
      ]
    },
    {
      id: 'account-setup',
      title: 'Setting Up Your Account',
      description: 'Complete your profile for a personalized shopping experience',
      icon: User,
      duration: '3 minutes',
      difficulty: 'Beginner',
      steps: [
        {
          id: 'create-profile',
          title: 'Create Your Profile',
          description: 'Add your personal information and preferences.',
          tips: [
            'Use a strong password',
            'Verify your email address',
            'Add a profile picture'
          ]
        },
        {
          id: 'set-preferences',
          title: 'Set Shopping Preferences',
          description: 'Customize your shopping experience with preferences.',
          tips: [
            'Select your favorite categories',
            'Set price range preferences',
            'Choose notification settings'
          ]
        }
      ]
    },
    {
      id: 'payment-methods',
      title: 'Managing Payment Methods',
      description: 'Learn how to add and manage your payment options',
      icon: CreditCard,
      duration: '4 minutes',
      difficulty: 'Intermediate',
      steps: [
        {
          id: 'add-payment',
          title: 'Add Payment Method',
          description: 'Securely add your credit card or other payment methods.',
          tips: [
            'We support all major credit cards',
            'Your payment information is encrypted',
            'You can add multiple payment methods'
          ]
        },
        {
          id: 'manage-payments',
          title: 'Manage Saved Methods',
          description: 'Edit, remove, or set default payment methods.',
          tips: [
            'Set a default payment method for faster checkout',
            'Remove old or expired cards',
            'Update billing addresses as needed'
          ]
        }
      ]
    }
  ];

  const toggleStepCompletion = (stepId: string) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(stepId)) {
      newCompleted.delete(stepId);
    } else {
      newCompleted.add(stepId);
    }
    setCompletedSteps(newCompleted);
  };

  const renderGuideContent = () => {
    const guide = guides.find(g => g.id === selectedGuide);
    if (!guide) return null;

    const IconComponent = guide.icon;
    return (
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <button
            onClick={() => setSelectedGuide('')}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
            Back to Guides
          </button>
          
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <IconComponent className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{guide.title}</h1>
              <p className="text-gray-600">{guide.description}</p>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                <span>{guide.duration}</span>
                <span>•</span>
                <span>{guide.difficulty}</span>
                <span>•</span>
                <span>{guide.steps.length} steps</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-6">
            {guide.steps.map((step, index) => (
              <div key={step.id} className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <button
                    onClick={() => toggleStepCompletion(step.id)}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                      completedSteps.has(step.id)
                        ? 'bg-green-600 border-green-600 text-white'
                        : 'border-gray-300 hover:border-blue-500'
                    }`}
                  >
                    {completedSteps.has(step.id) ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
                    )}
                  </button>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-700 mb-3">
                    {step.description}
                  </p>
                  
                  {step.tips && step.tips.length > 0 && (
                    <div className="bg-blue-50 rounded-lg p-3">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Tips:</h4>
                      <ul className="space-y-1">
                        {step.tips.map((tip, tipIndex) => (
                          <li key={tipIndex} className="text-sm text-blue-800">
                            • {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-green-50 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-green-800 font-medium">
                Completed {completedSteps.size} of {guide.steps.length} steps
              </span>
            </div>
            {completedSteps.size === guide.steps.length && (
              <p className="text-green-700 text-sm mt-2">
                🎉 Congratulations! You've completed this guide.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-blue-900 mb-4">User Guides</h2>
        <p className="text-gray-600">
          Learn how to make the most of CultureAft with our step-by-step guides
        </p>
      </div>

      {!selectedGuide ? (
        // Guide Selection
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {guides.map((guide) => {
            const IconComponent = guide.icon;
            return (
              <div
                key={guide.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedGuide(guide.id)}
              >
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <IconComponent className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {guide.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      {guide.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Play className="h-4 w-4 mr-1" />
                          {guide.duration}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          guide.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' :
                          guide.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {guide.difficulty}
                        </span>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Guide Content
        renderGuideContent()
      )}
    </div>
  );
};

export default UserGuides;