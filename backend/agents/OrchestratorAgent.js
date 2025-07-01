import { LegalDraftAgent } from './LegalDraftAgent.js';
import { AnalysisAgent } from './AnalysisAgent.js';

export class OrchestratorAgent {
  constructor() {
    this.name = 'OrchestratorAgent';
    this.version = '1.0';
    this.legalDraftAgent = new LegalDraftAgent();
    this.analysisAgent = new AnalysisAgent();
    this.costTracker = {
      totalTokens: 0,
      totalCost: 0,
      sessionStart: new Date()
    };
  }

  async generateLegalDocument({
    caseId,
    documentType,
    ipAsset,
    infringementEvidence,
    jurisdiction = 'US',
    tone = 'professional',
    caseDetails,
    validateInfringement = true,
    reviewDocument = true
  }) {
    console.log(`[OrchestratorAgent] Starting legal document generation workflow`);
    console.log(`[OrchestratorAgent] Case: ${caseId}, Type: ${documentType}, Jurisdiction: ${jurisdiction}`);

    const workflow = {
      startTime: new Date(),
      steps: [],
      agents: [],
      totalCost: 0,
      success: false
    };

    try {
      // Step 1: Validate infringement (if requested)
      let infringementAnalysis = null;
      if (validateInfringement && infringementEvidence) {
        console.log(`[OrchestratorAgent] Step 1: Validating infringement with AnalysisAgent`);
        
        infringementAnalysis = await this.analysisAgent.validateInfringement({
          ipAsset,
          evidenceData: infringementEvidence,
          targetUrl: infringementEvidence.url
        });

        workflow.steps.push({
          step: 1,
          agent: 'AnalysisAgent',
          action: 'validateInfringement',
          result: 'success',
          confidence: infringementAnalysis.confidence,
          tokensUsed: infringementAnalysis.metadata.tokensUsed
        });

        this.updateCostTracker(infringementAnalysis.metadata.tokensUsed);

        // Check if infringement is likely enough to proceed
        if (infringementAnalysis.confidence < 30) {
          console.log(`[OrchestratorAgent] Low confidence infringement (${infringementAnalysis.confidence}%), proceeding with caution`);
        }
      }

      // Step 2: Generate legal document with LegalDraftAgent
      console.log(`[OrchestratorAgent] Step 2: Generating document with LegalDraftAgent`);
      
      const documentGeneration = await this.legalDraftAgent.generateDocument({
        documentType,
        ipAsset,
        infringementEvidence: {
          ...infringementEvidence,
          analysisResult: infringementAnalysis
        },
        jurisdiction,
        tone,
        caseDetails
      });

      workflow.steps.push({
        step: 2,
        agent: 'LegalDraftAgent',
        action: 'generateDocument',
        result: 'success',
        documentLength: documentGeneration.content.length,
        tokensUsed: documentGeneration.metadata.tokensUsed
      });

      this.updateCostTracker(documentGeneration.metadata.tokensUsed);

      // Step 3: Review document quality (if requested)
      let documentReview = null;
      if (reviewDocument) {
        console.log(`[OrchestratorAgent] Step 3: Reviewing document with AnalysisAgent`);
        
        documentReview = await this.analysisAgent.reviewLegalDocument({
          content: documentGeneration.content,
          documentType,
          jurisdiction,
          ipAsset
        });

        workflow.steps.push({
          step: 3,
          agent: 'AnalysisAgent',
          action: 'reviewDocument',
          result: 'success',
          qualityScore: documentReview.qualityScore,
          recommendation: documentReview.approvalRecommendation,
          tokensUsed: documentReview.metadata.tokensUsed
        });

        this.updateCostTracker(documentReview.metadata.tokensUsed);

        // Check if document needs revision
        if (documentReview.approvalRecommendation === 'REJECT') {
          console.log(`[OrchestratorAgent] Document rejected by AnalysisAgent, flagging for revision`);
        }
      }

      // Step 4: Calculate comprehensive risk score
      let riskAnalysis = null;
      if (infringementAnalysis) {
        console.log(`[OrchestratorAgent] Step 4: Calculating comprehensive risk score`);
        
        riskAnalysis = await this.analysisAgent.calculateRiskScore({
          ipAsset,
          evidenceData: infringementEvidence,
          infringementAnalysis
        });

        workflow.steps.push({
          step: 4,
          agent: 'AnalysisAgent',
          action: 'calculateRiskScore',
          result: 'success',
          riskScore: riskAnalysis.overallRiskScore,
          recommendation: riskAnalysis.recommendation
        });
      }

      workflow.success = true;
      workflow.endTime = new Date();
      workflow.totalDuration = workflow.endTime - workflow.startTime;
      workflow.totalCost = this.estimateCost(this.costTracker.totalTokens);

      console.log(`[OrchestratorAgent] Workflow completed successfully in ${workflow.totalDuration}ms`);
      console.log(`[OrchestratorAgent] Total tokens used: ${this.costTracker.totalTokens}, Estimated cost: $${workflow.totalCost.toFixed(4)}`);

      return {
        success: true,
        document: {
          content: documentGeneration.content,
          metadata: documentGeneration.metadata
        },
        infringementAnalysis,
        documentReview,
        riskAnalysis,
        workflow,
        costSummary: {
          totalTokens: this.costTracker.totalTokens,
          estimatedCost: workflow.totalCost,
          breakdown: workflow.steps.map(step => ({
            agent: step.agent,
            action: step.action,
            tokens: step.tokensUsed || 0
          }))
        }
      };

    } catch (error) {
      console.error(`[OrchestratorAgent] Workflow failed:`, error);
      
      workflow.success = false;
      workflow.error = error.message;
      workflow.endTime = new Date();

      return {
        success: false,
        error: error.message,
        workflow,
        partialResults: {
          infringementAnalysis,
          documentReview: null
        }
      };
    }
  }

  async validateJurisdiction(jurisdiction) {
    const supportedJurisdictions = [
      'US', 'UK', 'CA', 'AU', 'DE', 'FR', 'JP', 'EU'
    ];

    const isSupported = supportedJurisdictions.includes(jurisdiction.toUpperCase());
    
    console.log(`[OrchestratorAgent] Jurisdiction validation: ${jurisdiction} - ${isSupported ? 'SUPPORTED' : 'UNSUPPORTED'}`);

    return {
      jurisdiction: jurisdiction.toUpperCase(),
      isSupported,
      supportedJurisdictions,
      recommendation: isSupported ? 'PROCEED' : 'USE_GENERIC_TEMPLATE'
    };
  }

  async optimizeWorkflow({ caseComplexity, budgetLimit, timeConstraint }) {
    console.log(`[OrchestratorAgent] Optimizing workflow for complexity: ${caseComplexity}`);

    const optimizations = {
      simple: {
        validateInfringement: false, // Skip for simple cases
        reviewDocument: true,
        agentModel: 'llama3-8b-8192', // Faster model for simple cases
        maxTokens: 1000
      },
      moderate: {
        validateInfringement: true,
        reviewDocument: true,
        agentModel: 'llama3-70b-8192', // Standard model
        maxTokens: 1500
      },
      complex: {
        validateInfringement: true,
        reviewDocument: true,
        agentModel: 'llama3-70b-8192', // Most capable model
        maxTokens: 2000,
        multipleReviews: true
      }
    };

    const config = optimizations[caseComplexity] || optimizations.moderate;

    // Apply budget constraints
    if (budgetLimit && budgetLimit < 0.10) { // Less than 10 cents
      config.agentModel = 'llama3-8b-8192'; // Use faster model for budget constraints
      config.maxTokens = Math.min(config.maxTokens, 800);
    }

    // Apply time constraints
    if (timeConstraint === 'urgent') {
      config.validateInfringement = false; // Skip validation for speed
    }

    console.log(`[OrchestratorAgent] Workflow optimized:`, config);

    return config;
  }

  updateCostTracker(tokens) {
    this.costTracker.totalTokens += tokens;
    this.costTracker.totalCost = this.estimateCost(this.costTracker.totalTokens);
  }

  estimateCost(tokens) {
    // Groq Llama3-70B pricing: FREE during development and demo phases
    // Currently returning $0.00 to reflect free tier usage
    return 0.00;
  }

  getUsageStats() {
    const sessionDuration = new Date() - this.costTracker.sessionStart;
    
    return {
      sessionDuration: Math.round(sessionDuration / 1000), // seconds
      totalTokens: this.costTracker.totalTokens,
      estimatedCost: this.costTracker.totalCost,
      averageTokensPerMinute: Math.round(this.costTracker.totalTokens / (sessionDuration / 60000)),
      costPerHour: (this.costTracker.totalCost / (sessionDuration / 3600000)).toFixed(4)
    };
  }

  async healthCheck() {
    console.log(`[OrchestratorAgent] Performing health check`);
    
    const health = {
      orchestrator: 'healthy',
      agents: {},
      timestamp: new Date().toISOString()
    };

    try {
      // Check LegalDraftAgent
      health.agents.legalDraft = {
        status: 'healthy',
        capabilities: this.legalDraftAgent.capabilities,
        version: this.legalDraftAgent.version
      };

      // Check AnalysisAgent
      health.agents.analysis = {
        status: 'healthy',
        capabilities: this.analysisAgent.capabilities,
        version: this.analysisAgent.version
      };

      console.log(`[OrchestratorAgent] Health check completed - all systems healthy`);
      
    } catch (error) {
      console.error(`[OrchestratorAgent] Health check failed:`, error);
      health.orchestrator = 'unhealthy';
      health.error = error.message;
    }

    return health;
  }
}

export default OrchestratorAgent;