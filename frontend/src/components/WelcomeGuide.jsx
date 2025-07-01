import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  X, 
  Shield, 
  Briefcase, 
  FileText, 
  ArrowRight, 
  CheckCircle,
  Lightbulb,
  Users,
  Zap,
  Bot,
  Eye,
  Sparkles,
  Target,
  Brain
} from 'lucide-react';

const WelcomeGuide = ({ onClose, userStats }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Welcome to ObjectionAI!",
      subtitle: "Enterprise AI-Powered IP Enforcement Platform",
      content: (
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <Bot className="h-8 w-8 text-white" />
          </div>
          <p className="text-gray-600 mb-6">
            ObjectionAI is a <strong>sophisticated platform</strong> with advanced multi-agent AI that 
            automates your entire IP enforcement workflow - from monitoring to professional legal documents.
          </p>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-3 flex items-center justify-center">
              <Sparkles className="h-4 w-4 mr-2" />
              Complete Automation Platform
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-blue-800">
                <Bot className="h-4 w-4 inline mr-1" />
                Multi-Agent AI System
              </div>
              <div className="text-blue-800">
                <Eye className="h-4 w-4 inline mr-1" />
                Auto-Case Creation
              </div>
              <div className="text-blue-800">
                <FileText className="h-4 w-4 inline mr-1" />
                Legal Document Generation
              </div>
              <div className="text-blue-800">
                <Brain className="h-4 w-4 inline mr-1" />
                Legal Intelligence
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Step 1: Register Your IP Assets",
      subtitle: "Foundation for AI-powered protection",
      content: (
        <div>
          <div className="flex items-center justify-center mb-4">
            <div className="bg-green-500 rounded-full p-3">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400 mx-3" />
            <div className="bg-gray-200 rounded-full p-3">
              <Target className="h-6 w-6 text-gray-400" />
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400 mx-3" />
            <div className="bg-gray-200 rounded-full p-3">
              <Bot className="h-6 w-6 text-gray-400" />
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-green-900 mb-2 flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              Your IP Assets Power Our AI
            </h4>
            <p className="text-sm text-green-800 mb-3">
              Our AI agents use your IP asset details to automatically detect infringement and generate legal documents:
            </p>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• <strong>Trademarks:</strong> Brand names, logos, slogans</li>
              <li>• <strong>Copyrights:</strong> Creative works, content, images</li>
              <li>• <strong>Patents:</strong> Inventions and innovations</li>
              <li>• <strong>Trade Secrets:</strong> Confidential business information</li>
            </ul>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <Brain className="h-4 w-4 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm text-blue-800">
                  <strong>AI Intelligence:</strong> The more detailed your IP asset descriptions, 
                  the better our AI can detect infringement and create targeted legal documents.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Step 2: AI-Powered Monitoring",
      subtitle: "Let our AI agents watch for infringement 24/7",
      content: (
        <div>
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gray-300 rounded-full p-3">
              <Shield className="h-6 w-6 text-gray-500" />
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400 mx-3" />
            <div className="bg-blue-500 rounded-full p-3">
              <Eye className="h-6 w-6 text-white" />
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400 mx-3" />
            <div className="bg-gray-200 rounded-full p-3">
              <Bot className="h-6 w-6 text-gray-400" />
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center">
              <Eye className="h-4 w-4 mr-2" />
              Automated IP Surveillance
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Website Monitoring:</strong> Continuously scans the internet for your IP</li>
              <li>• <strong>Infringement Detection:</strong> AI identifies potential violations automatically</li>
              <li>• <strong>Automatic Case Creation:</strong> High-risk violations create cases instantly</li>
              <li>• <strong>Evidence Collection:</strong> Captures screenshots and webpage content as proof</li>
            </ul>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <Target className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm text-green-800">
                  <strong>Complete Automation:</strong> Our system watches the internet 24/7, finds violations, 
                  and automatically creates cases with evidence - saving you hours of manual work!
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Step 3: AI Legal Document Generation",
      subtitle: "Professional legal documents created automatically",
      content: (
        <div>
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gray-300 rounded-full p-3">
              <Shield className="h-6 w-6 text-gray-500" />
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400 mx-3" />
            <div className="bg-gray-300 rounded-full p-3">
              <Eye className="h-6 w-6 text-gray-500" />
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400 mx-3" />
            <div className="bg-purple-500 rounded-full p-3">
              <Bot className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-purple-900 mb-2 flex items-center">
              <Bot className="h-4 w-4 mr-2" />
              AI-Powered Legal Workflow
            </h4>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• <strong>Workflow Coordination:</strong> Manages the entire process from detection to document</li>
              <li>• <strong>Legal Assessment:</strong> Evaluates case strength and likelihood of success</li>
              <li>• <strong>Document Generation:</strong> Creates professional legal documents automatically</li>
              <li>• <strong>Strategic Guidance:</strong> Provides clear recommendations for next steps</li>
            </ul>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-purple-200 rounded-lg p-4 mb-3">
            <h4 className="font-medium text-purple-900 mb-2 flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Professional Document Types
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm text-purple-800">
              <div>• Cease & Desist Letters</div>
              <div>• DMCA Takedown Notices</div>
              <div>• Settlement Demands</div>
              <div>• Legal Assessments</div>
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <Brain className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-800">
                  <strong>Smart Legal AI:</strong> Our system analyzes your evidence, evaluates case strength, 
                  and creates professional legal documents ready to send to infringers!
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "You're Ready for Enterprise IP Protection!",
      subtitle: "Complete automation from monitoring to legal action",
      content: (
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <p className="text-gray-600 mb-6">
            You now understand our <strong>advanced AI platform</strong> that automates 
            IP enforcement from monitoring to professional legal documents!
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <Shield className="h-5 w-5 text-blue-600 mx-auto mb-2" />
              <h4 className="font-medium text-blue-900 text-xs">Register IP Assets</h4>
              <p className="text-xs text-blue-700">Foundation for AI protection</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <Eye className="h-5 w-5 text-green-600 mx-auto mb-2" />
              <h4 className="font-medium text-green-900 text-xs">AI Monitoring</h4>
              <p className="text-xs text-green-700">24/7 automated surveillance</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <Bot className="h-5 w-5 text-purple-600 mx-auto mb-2" />
              <h4 className="font-medium text-purple-900 text-xs">Multi-Agent AI</h4>
              <p className="text-xs text-purple-700">Coordinated legal intelligence</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <FileText className="h-5 w-5 text-orange-600 mx-auto mb-2" />
              <h4 className="font-medium text-orange-900 text-xs">Legal Documents</h4>
              <p className="text-xs text-orange-700">Professional, ready-to-send</p>
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center justify-center">
              <Sparkles className="h-4 w-4 mr-2" />
              Complete Automation Workflow
            </h4>
            <p className="text-sm text-blue-800">
              Monitoring → Auto-Case Creation → Evidence Collection → Legal Intelligence → Professional Documents
            </p>
          </div>
          <div className="space-y-3">
            <Link
              to="/assets/new"
              className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              Start with Your First IP Asset
            </Link>
            <Link
              to="/monitoring/new"
              className="block w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Try AI Monitoring (Advanced)
            </Link>
            <button
              onClick={onClose}
              className="block w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              I'll Explore the Platform
            </button>
          </div>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{steps[currentStep].title}</h2>
            <p className="text-sm text-gray-600">{steps[currentStep].subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Step {currentStep + 1} of {steps.length}</span>
            <span className="text-sm text-gray-600">{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {steps[currentStep].content}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <div className="flex space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentStep ? 'bg-blue-600' : 
                  index < currentStep ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {currentStep < steps.length - 1 ? (
            <button
              onClick={nextStep}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Next
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Get Started
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WelcomeGuide;