import { groq } from '../db/groq.js';

export class AnalysisAgent {
  constructor() {
    this.name = 'AnalysisAgent';
    this.version = '1.0';
    this.capabilities = [
      'infringement_validation',
      'confidence_scoring',
      'legal_document_review',
      'evidence_analysis'
    ];
  }

  async validateInfringement({ ipAsset, evidenceData, targetUrl }) {
    console.log(`[AnalysisAgent] Validating infringement for IP asset: ${ipAsset.title}`);
    console.log(`[AnalysisAgent] Evidence data received:`, {
      url: targetUrl,
      riskScore: evidenceData?.riskScore,
      title: evidenceData?.title,
      hasTextContent: !!evidenceData?.textContent,
      hasAnalysisDetails: !!evidenceData?.analysisDetails
    });
    
    try {
      const prompt = this.buildInfringementPrompt(ipAsset, evidenceData, targetUrl);
      console.log(`[AnalysisAgent] Generated prompt:`, prompt.substring(0, 500) + '...');
      
      const response = await groq.chat.completions.create({
        model: 'llama3-70b-8192',
        messages: [
          {
            role: 'system',
            content: this.getInfringementSystemPrompt()
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1, // Very low temperature for analysis
        max_tokens: 1000,
      });

      const rawResponse = response.choices[0].message.content;
      console.log(`[AnalysisAgent] Raw AI response:`, rawResponse);
      
      const analysis = this.parseInfringementAnalysis(rawResponse);
      
      console.log(`[AnalysisAgent] Parsed analysis:`, analysis);
      console.log(`[AnalysisAgent] Infringement validation complete. Confidence: ${analysis.confidence}%`);
      
      return {
        ...analysis,
        metadata: {
          agent: this.name,
          version: this.version,
          tokensUsed: response.usage.total_tokens,
          analyzedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error(`[AnalysisAgent] Error validating infringement:`, error);
      throw new Error(`Failed to validate infringement: ${error.message}`);
    }
  }

  async reviewLegalDocument({ content, documentType, jurisdiction, ipAsset }) {
    console.log(`[AnalysisAgent] Reviewing ${documentType} for legal completeness`);
    
    try {
      const prompt = this.buildDocumentReviewPrompt(content, documentType, jurisdiction, ipAsset);
      
      const response = await groq.chat.completions.create({
        model: 'llama3-70b-8192',
        messages: [
          {
            role: 'system',
            content: this.getDocumentReviewSystemPrompt()
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 800,
      });

      const review = this.parseDocumentReview(response.choices[0].message.content);
      
      console.log(`[AnalysisAgent] Document review complete. Quality score: ${review.qualityScore}%`);
      
      return {
        ...review,
        metadata: {
          agent: this.name,
          version: this.version,
          tokensUsed: response.usage.total_tokens,
          reviewedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error(`[AnalysisAgent] Error reviewing document:`, error);
      throw new Error(`Failed to review document: ${error.message}`);
    }
  }

  getInfringementSystemPrompt() {
    return `You are a specialized IP infringement analysis AI with expertise in distinguishing between legitimate and infringing uses of intellectual property. Your role is to objectively assess whether evidence indicates potential intellectual property infringement.

CRITICAL ANALYSIS REQUIREMENTS:
- **PRIMARY FOCUS**: Does the website contain, host, or offer access to the SPECIFIC protected IP asset?
- **CONTENT SPECIFICITY**: Being a piracy site is only relevant if it contains the protected content
- **DIRECT INFRINGEMENT**: Look for exact matches, unauthorized copies, or substantial similarity to the protected IP
- **CONTEXT EVALUATION**: Distinguish between legitimate references vs actual infringement
- **COMMERCIAL HARM**: Does this specific use compete with or substitute for the original IP?

INFRINGEMENT ANALYSIS FRAMEWORK:
1. **DIRECT INFRINGEMENT** (90-100%): Site contains/hosts the specific protected IP
2. **PLATFORM RISK** (60-75%): Known piracy platform that could host the IP (monitoring warranted)
3. **INDIRECT RISK** (40-59%): Related content or concerning patterns
4. **LEGITIMATE USE** (20-39%): Fair use, news, reviews, educational content
5. **NO RISK** (0-19%): Unrelated content, legitimate references

SCORING GUIDELINES - CONTENT-SPECIFIC:
- 90-100%: Site directly hosts/streams the SPECIFIC protected IP content (downloadable/streamable)
- 80-89%: Site shows EXACT TITLE MATCHES and search results for the SPECIFIC protected IP on piracy platforms
- 70-79%: Site likely contains unauthorized copies or strong indicators of the SPECIFIC protected IP
- 60-69%: Known piracy platform (monitoring risk - could host the IP in future)
- 40-59%: Moderate risk (related content, concerning patterns)
- 20-39%: Low risk (legitimate mention, fair use)
- 0-19%: Minimal risk (unrelated content, legitimate reference)

**CRITICAL EXACT MATCH DETECTION**: 
- If a piracy site shows EXACT TITLE MATCHES (e.g., page titled "Wednesday : 123Movies" when monitoring "Wednesday") = 80-89%
- If a piracy site searches for unrelated content (e.g., "Squid Game" when monitoring "Wednesday") = 60-69%
- If a piracy site actually hosts/streams the content = 90-100%

RESPONSE FORMAT:
Provide your analysis in this exact format:

CONFIDENCE: [0-100]%
INFRINGEMENT_LIKELY: [YES/NO]
STRENGTH: [WEAK/MODERATE/STRONG]
LEGAL_BASIS: [Brief explanation including context assessment]
EVIDENCE_QUALITY: [POOR/FAIR/GOOD/EXCELLENT]
RECOMMENDATIONS: [Specific next steps]
RISKS: [Potential challenges or limitations]`;
  }

  getDocumentReviewSystemPrompt() {
    return `You are a legal document review AI specializing in intellectual property enforcement documents. Your role is to assess the quality, completeness, and legal soundness of generated legal documents.

REVIEW CRITERIA:
- Legal completeness and accuracy
- Professional formatting and tone
- Inclusion of required elements
- Clarity of demands and deadlines
- Compliance with jurisdiction requirements
- Overall effectiveness

RESPONSE FORMAT:
Provide your review in this exact format:

QUALITY_SCORE: [0-100]%
COMPLETENESS: [INCOMPLETE/PARTIAL/COMPLETE]
LEGAL_SOUNDNESS: [POOR/FAIR/GOOD/EXCELLENT]
MISSING_ELEMENTS: [List any missing required elements]
STRENGTHS: [Key strengths of the document]
IMPROVEMENTS: [Specific suggestions for improvement]
APPROVAL_RECOMMENDATION: [APPROVE/REVISE/REJECT]`;
  }

  buildInfringementPrompt(ipAsset, evidenceData, targetUrl) {
    return `Analyze the following potential IP infringement case with careful attention to context and legitimacy:

IP ASSET DETAILS:
- Type: ${ipAsset.type}
- Title: ${ipAsset.title}
- Description: ${ipAsset.description}
- Registration: ${ipAsset.registration_number || 'Unregistered'}
- Jurisdiction: ${ipAsset.jurisdiction || 'Not specified'}

WEBSITE EVIDENCE COLLECTED:
- Target URL: ${targetUrl}
- Page Title: ${evidenceData.title || 'Not available'}
- Meta Description: ${evidenceData.metaDescription || 'Not available'}
- Page Content: ${evidenceData.textContent ? evidenceData.textContent.substring(0, 3000) + '...' : 'Not available'}
- Images Found: ${evidenceData.images?.length || 0}
- Links Found: ${evidenceData.links?.length || 0}
- Headings: ${evidenceData.headings?.map(h => h.text).join(', ') || 'None'}

CRITICAL CONTENT ANALYSIS REQUIRED:
1. **EXACT MATCH CHECK**: Does the page content contain the EXACT protected IP title "${ipAsset.title}"?
2. **TITLE ANALYSIS**: Does the page title, headings, or search results show "${ipAsset.title}"?
3. **CONTENT AVAILABILITY**: Is the specific protected IP content actually available/hosted on this site?
4. **SEARCH CONTEXT**: If this is a search page, what content is being searched for? Is it the protected IP or unrelated content?
5. **SITE TYPE**: Is this a legitimate site (IMDB, Wikipedia, news) or a piracy platform?
6. **INFRINGEMENT SPECIFICITY**: Does this page specifically infringe the protected IP, or is it just a general piracy site?

**EXACT MATCH SCORING RULES**:
- Page title contains "${ipAsset.title}" + piracy site = 80-89% (EXACT MATCH on piracy platform)
- Search results show "${ipAsset.title}" + piracy site = 80-89% (DIRECT SEARCH MATCH)
- Page actually hosts/streams "${ipAsset.title}" = 90-100% (DIRECT INFRINGEMENT)
- Piracy site with unrelated content = 60-69% (PLATFORM RISK only)
- Legitimate site mentioning "${ipAsset.title}" = 0-19% (FAIR USE/NEWS)

SPECIFIC CONTENT TO ANALYZE:
${evidenceData.htmlContent ? evidenceData.htmlContent.substring(0, 2000) + '...' : 'HTML content not available'}

Please provide a comprehensive infringement analysis following the required format, with special attention to distinguishing legitimate references from actual infringement.`;
  }

  buildDocumentReviewPrompt(content, documentType, jurisdiction, ipAsset) {
    return `Review the following ${documentType} document for legal completeness and quality:

DOCUMENT TYPE: ${documentType}
JURISDICTION: ${jurisdiction}
IP ASSET TYPE: ${ipAsset.type}

DOCUMENT CONTENT:
${content}

Please provide a comprehensive review following the required format, focusing on:
1. Legal completeness for ${documentType} in ${jurisdiction}
2. Professional quality and formatting
3. Inclusion of all required legal elements
4. Clarity and effectiveness of demands
5. Overall legal soundness`;
  }

  parseInfringementAnalysis(content) {
    const lines = content.split('\n');
    const analysis = {};

    lines.forEach(line => {
      if (line.startsWith('CONFIDENCE:')) {
        analysis.confidence = parseInt(line.split(':')[1].trim().replace('%', ''));
      } else if (line.startsWith('INFRINGEMENT_LIKELY:')) {
        analysis.infringementLikely = line.split(':')[1].trim() === 'YES';
      } else if (line.startsWith('STRENGTH:')) {
        analysis.strength = line.split(':')[1].trim();
      } else if (line.startsWith('LEGAL_BASIS:')) {
        analysis.legalBasis = line.split(':')[1].trim();
      } else if (line.startsWith('EVIDENCE_QUALITY:')) {
        analysis.evidenceQuality = line.split(':')[1].trim();
      } else if (line.startsWith('RECOMMENDATIONS:')) {
        analysis.recommendations = line.split(':')[1].trim();
      } else if (line.startsWith('RISKS:')) {
        analysis.risks = line.split(':')[1].trim();
      }
    });

    return analysis;
  }

  parseDocumentReview(content) {
    const lines = content.split('\n');
    const review = {};

    lines.forEach(line => {
      if (line.startsWith('QUALITY_SCORE:')) {
        review.qualityScore = parseInt(line.split(':')[1].trim().replace('%', ''));
      } else if (line.startsWith('COMPLETENESS:')) {
        review.completeness = line.split(':')[1].trim();
      } else if (line.startsWith('LEGAL_SOUNDNESS:')) {
        review.legalSoundness = line.split(':')[1].trim();
      } else if (line.startsWith('MISSING_ELEMENTS:')) {
        review.missingElements = line.split(':')[1].trim();
      } else if (line.startsWith('STRENGTHS:')) {
        review.strengths = line.split(':')[1].trim();
      } else if (line.startsWith('IMPROVEMENTS:')) {
        review.improvements = line.split(':')[1].trim();
      } else if (line.startsWith('APPROVAL_RECOMMENDATION:')) {
        review.approvalRecommendation = line.split(':')[1].trim();
      }
    });

    return review;
  }

  async calculateRiskScore({ ipAsset, evidenceData, infringementAnalysis }) {
    console.log(`[AnalysisAgent] Calculating comprehensive risk score`);
    
    let riskScore = 0;
    const factors = [];

    // CRITICAL FIX: If AI determines no infringement (confidence 0%), respect that assessment
    if (infringementAnalysis.confidence === 0 || !infringementAnalysis.infringementLikely) {
      console.log(`[AnalysisAgent] AI determined no infringement risk (confidence: ${infringementAnalysis.confidence}%)`);
      return {
        overallRiskScore: Math.max(3, infringementAnalysis.confidence || 0), // Minimum 3% for any site
        factors: [{
          name: 'AI Analysis',
          score: infringementAnalysis.confidence || 0,
          weight: 1.0,
          contribution: infringementAnalysis.confidence || 0
        }],
        recommendation: this.getRiskRecommendation(Math.max(3, infringementAnalysis.confidence || 0)),
        calculatedAt: new Date().toISOString()
      };
    }

    // Factor 1: AI Confidence is primary (60% weight for infringement cases)
    if (infringementAnalysis.confidence) {
      const confidenceWeight = 0.6;
      riskScore += infringementAnalysis.confidence * confidenceWeight;
      factors.push({
        name: 'AI Infringement Confidence',
        score: infringementAnalysis.confidence,
        weight: confidenceWeight,
        contribution: infringementAnalysis.confidence * confidenceWeight
      });
    }

    // Factor 2: Legal Strength (25% weight)
    const strengthScores = {
      'STRONG': 100,
      'MODERATE': 65,
      'WEAK': 30
    };
    
    if (infringementAnalysis.strength) {
      const strengthScore = strengthScores[infringementAnalysis.strength] || 0;
      const strengthWeight = 0.25;
      riskScore += strengthScore * strengthWeight;
      factors.push({
        name: 'Legal Strength',
        score: strengthScore,
        weight: strengthWeight,
        contribution: strengthScore * strengthWeight
      });
    }

    // Factor 3: Evidence Quality (15% weight)
    const evidenceQualityScores = {
      'EXCELLENT': 100,
      'GOOD': 75,
      'FAIR': 50,
      'POOR': 25
    };
    
    if (infringementAnalysis.evidenceQuality) {
      const evidenceScore = evidenceQualityScores[infringementAnalysis.evidenceQuality] || 0;
      const evidenceWeight = 0.15;
      riskScore += evidenceScore * evidenceWeight;
      factors.push({
        name: 'Evidence Quality',
        score: evidenceScore,
        weight: evidenceWeight,
        contribution: evidenceScore * evidenceWeight
      });
    }

    const finalScore = Math.round(Math.min(100, Math.max(0, riskScore)));

    console.log(`[AnalysisAgent] Comprehensive risk score calculated: ${finalScore}%`);

    return {
      overallRiskScore: finalScore,
      factors,
      recommendation: this.getRiskRecommendation(finalScore),
      calculatedAt: new Date().toISOString()
    };
  }

  getRiskRecommendation(riskScore) {
    if (riskScore >= 80) {
      return 'IMMEDIATE_ACTION_REQUIRED';
    } else if (riskScore >= 60) {
      return 'LEGAL_ACTION_RECOMMENDED';
    } else if (riskScore >= 40) {
      return 'MONITOR_CLOSELY';
    } else if (riskScore >= 20) {
      return 'CONTINUE_MONITORING';
    } else {
      return 'LOW_PRIORITY';
    }
  }
}

export default AnalysisAgent;