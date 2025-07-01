import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  Briefcase, 
  FileText, 
  ArrowRight, 
  CheckCircle,
  Plus,
  Lightbulb
} from 'lucide-react';

const QuickStartCard = ({ userStats, onShowGuide }) => {
  const hasAssets = userStats?.assets > 0;
  const hasCases = userStats?.cases > 0;
  const hasDocuments = userStats?.documents > 0;

  const getNextStep = () => {
    if (!hasAssets) {
      return {
        step: 1,
        title: "Add Your First IP Asset",
        description: "Start by registering the intellectual property you want to protect",
        action: "Add IP Asset",
        link: "/assets/new",
        icon: Shield,
        color: "blue"
      };
    } else if (!hasCases) {
      return {
        step: 2,
        title: "Create Your First Case",
        description: "Report an infringement case to track and resolve IP violations",
        action: "Create Case",
        link: "/cases/new",
        icon: Briefcase,
        color: "yellow"
      };
    } else {
      return {
        step: 3,
        title: "Generate Legal Documents",
        description: "Use AI to create professional legal letters for your cases",
        action: "View Cases",
        link: "/cases",
        icon: FileText,
        color: "purple"
      };
    }
  };

  const nextStep = getNextStep();

  const steps = [
    {
      number: 1,
      title: "Register IP Assets",
      description: "Add your trademarks, copyrights, patents",
      completed: hasAssets,
      icon: Shield
    },
    {
      number: 2,
      title: "Create Cases",
      description: "Report infringement with evidence",
      completed: hasCases,
      icon: Briefcase
    },
    {
      number: 3,
      title: "Generate Documents",
      description: "AI creates legal letters automatically",
      completed: hasDocuments,
      icon: FileText
    }
  ];

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Quick Start Guide
          </h3>
          <p className="text-sm text-gray-600">
            Follow these simple steps to protect your intellectual property
          </p>
        </div>
        <button
          onClick={onShowGuide}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
        >
          <Lightbulb className="h-4 w-4" />
          <span>Show Guide</span>
        </button>
      </div>

      {/* Progress Steps */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = step.completed;
            const isCurrent = !isCompleted && steps.slice(0, index).every(s => s.completed);
            
            return (
              <div key={step.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isCompleted 
                      ? 'bg-green-500 text-white' 
                      : isCurrent 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-400'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <p className={`text-xs font-medium ${
                      isCompleted ? 'text-green-700' : isCurrent ? 'text-blue-700' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500 max-w-20">
                      {step.description}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <ArrowRight className={`h-4 w-4 mx-4 ${
                    steps[index + 1].completed ? 'text-green-500' : 'text-gray-300'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Next Action */}
      <div className={`bg-white border border-${nextStep.color}-200 rounded-lg p-4`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className={`font-medium text-${nextStep.color}-900 mb-1`}>
              Step {nextStep.step}: {nextStep.title}
            </h4>
            <p className={`text-sm text-${nextStep.color}-700 mb-3`}>
              {nextStep.description}
            </p>
          </div>
          <div className={`bg-${nextStep.color}-100 p-2 rounded-lg`}>
            <nextStep.icon className={`h-5 w-5 text-${nextStep.color}-600`} />
          </div>
        </div>
        <Link
          to={nextStep.link}
          className={`inline-flex items-center px-4 py-2 bg-${nextStep.color}-600 text-white text-sm font-medium rounded-lg hover:bg-${nextStep.color}-700 transition-colors`}
        >
          <Plus className="h-4 w-4 mr-2" />
          {nextStep.action}
        </Link>
      </div>
    </div>
  );
};

export default QuickStartCard;