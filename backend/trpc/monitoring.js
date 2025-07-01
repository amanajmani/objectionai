import { z } from 'zod';
import { router, protectedProcedure } from './trpc.js';
import { supabase } from '../db/supabase.js';
import puppeteer from 'puppeteer';
import AnalysisAgent from '../agents/AnalysisAgent.js';

export const monitoringRouter = router({
  // Create a new monitoring job
  createJob: protectedProcedure
    .input(z.object({
      url: z.string().url('Invalid URL format'),
      ipAssetId: z.string().uuid('Invalid IP asset ID'),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const { data, error } = await supabase
          .from('monitoring_jobs')
          .insert({
            url: input.url,
            ip_asset_id: input.ipAssetId,
            created_by: ctx.user.id,
            job_status: 'pending',
          })
          .select()
          .single();

        if (error) {
          throw new Error(`Failed to create monitoring job: ${error.message}`);
        }

        return {
          job: data,
          message: 'Monitoring job created successfully'
        };
      } catch (error) {
        throw new Error(`Failed to create monitoring job: ${error.message}`);
      }
    }),

  // List monitoring jobs
  list: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).optional().default(50),
      offset: z.number().min(0).optional().default(0),
      status: z.enum(['pending', 'running', 'completed', 'failed']).optional(),
    }))
    .query(async ({ input, ctx }) => {
      try {
        let query = supabase
          .from('monitoring_jobs')
          .select(`
            *,
            ip_assets:ip_asset_id (
              id,
              title,
              type
            ),
            monitoring_logs (
              id,
              risk_score,
              result,
              created_at
            )
          `)
          .order('created_at', { ascending: false })
          .range(input.offset, input.offset + input.limit - 1);

        if (input.status) {
          query = query.eq('job_status', input.status);
        }

        const { data, error } = await query;

        if (error) {
          throw new Error(`Failed to fetch monitoring jobs: ${error.message}`);
        }

        return {
          jobs: data || [],
          message: 'Monitoring jobs retrieved successfully'
        };
      } catch (error) {
        throw new Error(`Failed to fetch monitoring jobs: ${error.message}`);
      }
    }),

  // Get monitoring job by ID
  getById: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .query(async ({ input, ctx }) => {
      try {
        const { data, error } = await supabase
          .from('monitoring_jobs')
          .select(`
            *,
            ip_assets:ip_asset_id (
              id,
              title,
              type,
              description
            ),
            monitoring_logs (
              id,
              result,
              risk_score,
              screenshot_url,
              html_content,
              metadata,
              created_at
            )
          `)
          .eq('id', input.id)
          .single();

        if (error) {
          throw new Error(`Failed to fetch monitoring job: ${error.message}`);
        }

        return {
          job: data,
          message: 'Monitoring job retrieved successfully'
        };
      } catch (error) {
        throw new Error(`Failed to fetch monitoring job: ${error.message}`);
      }
    }),

  // Execute a monitoring job (manual trigger) - SurveillanceAgent in action
  executeJob: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        // CRITICAL FIX: Check current job status to prevent concurrent executions
        const { data: currentJob, error: statusError } = await supabase
          .from('monitoring_jobs')
          .select('job_status')
          .eq('id', input.id)
          .single();

        if (statusError) {
          throw new Error(`Failed to check job status: ${statusError.message}`);
        }

        if (currentJob.job_status === 'running') {
          throw new Error('Job is already running. Please wait for it to complete.');
        }

        if (currentJob.job_status === 'completed') {
          throw new Error('Job has already been completed. Create a new monitoring job if you want to run another scan.');
        }

        // Update job status to running
        const { data: job, error: jobError } = await supabase
          .from('monitoring_jobs')
          .update({ job_status: 'running' })
          .eq('id', input.id)
          .eq('job_status', 'pending') // Only update if still pending
          .select()
          .single();

        if (jobError || !job) {
          throw new Error(`Failed to update job status or job is no longer pending: ${jobError?.message || 'Job may have been modified by another process'}`);
        }

        // Get the IP asset details for SurveillanceAgent analysis
        const { data: ipAsset } = await supabase
          .from('ip_assets')
          .select('*')
          .eq('id', job.ip_asset_id)
          .single();

        // Execute SurveillanceAgent with advanced web scraping
        const result = await executeSurveillanceAgent(job, ipAsset);

        // Update job status to completed
        await supabase
          .from('monitoring_jobs')
          .update({ 
            job_status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', input.id);

        // AUTO-CASE CREATION: Check if high-risk and create case automatically
        let autoCaseCreated = false;
        let autoCaseId = null;
        
        if (result.log && result.log.risk_score >= 70) {
          console.log(`[AutoCase] High risk detected (${result.log.risk_score}%), creating auto-case...`);
          
          try {
            // CRITICAL FIX: Check if auto-case already exists for this monitoring job to prevent duplicates
            const { data: existingCase, error: checkError } = await supabase
              .from('cases')
              .select('id')
              .eq('source_monitoring_job_id', job.id)
              .eq('auto_generated', true)
              .single();

            if (existingCase) {
              console.log(`[AutoCase] Auto-case already exists for job ${job.id}, skipping creation`);
              autoCaseId = existingCase.id;
              autoCaseCreated = false; // Don't show as "newly created"
            } else {
              // Create auto-case only if one doesn't already exist
              const { data: autoCase, error: caseError } = await supabase
                .from('cases')
                .insert({
                  title: `AUTO: ${ipAsset.title} - High Risk Detection`,
                  status: 'open',
                  related_ip_asset_id: job.ip_asset_id,
                  suspected_url: job.url,
                  description: `Automatically generated case from high-risk monitoring detection. Risk Score: ${result.log.risk_score}%. ${result.log.result || ''}`,
                  created_by: ctx.user.id,
                  auto_generated: true,
                  source_monitoring_job_id: job.id
                })
                .select()
                .single();

              if (caseError) {
                console.error('[AutoCase] Failed to create auto-case:', caseError);
              } else {
                autoCaseId = autoCase.id;
                autoCaseCreated = true;
                
                // Link monitoring log to auto-case
                await supabase
                  .from('monitoring_logs')
                  .update({ auto_case_id: autoCaseId })
                  .eq('id', result.log.id);

                // Create evidence links with improved error handling
                const evidenceRecords = [];
                
                // Only add screenshot evidence if URL exists
                if (result.log.screenshot_url) {
                  evidenceRecords.push({
                    monitoring_log_id: result.log.id,
                    case_id: autoCaseId,
                    evidence_type: 'screenshot',
                    evidence_url: result.log.screenshot_url,
                    auto_generated: true
                  });
                }
                
                // Always add risk analysis evidence
                evidenceRecords.push({
                  monitoring_log_id: result.log.id,
                  case_id: autoCaseId,
                  evidence_type: 'risk_analysis',
                  evidence_data: {
                    risk_score: result.log.risk_score,
                    analysis_result: result.log.result,
                    metadata: result.log.metadata,
                    confidence: result.analysisResult?.confidence || 0,
                    details: result.analysisResult?.details || {}
                  },
                  auto_generated: true
                });
                
                // Only add HTML content evidence if content exists
                if (result.log.html_content) {
                  evidenceRecords.push({
                    monitoring_log_id: result.log.id,
                    case_id: autoCaseId,
                    evidence_type: 'html_content',
                    evidence_data: {
                      html_content: result.log.html_content.substring(0, 5000),
                      page_title: result.log.metadata?.title || '',
                      page_url: job.url,
                      word_count: result.log.metadata?.pageStats?.wordCount || 0,
                      image_count: result.log.metadata?.pageStats?.imageCount || 0
                    },
                    auto_generated: true
                  });
                }

                console.log(`[AutoCase] Creating ${evidenceRecords.length} evidence records for case ${autoCaseId}`);

                if (evidenceRecords.length > 0) {
                  const { data: evidenceData, error: evidenceError } = await supabase
                    .from('monitoring_evidence')
                    .insert(evidenceRecords)
                    .select();

                  if (evidenceError) {
                    console.error('[AutoCase] Failed to create evidence links:', evidenceError);
                    console.error('[AutoCase] Evidence records attempted:', evidenceRecords);
                    
                    // Try to create evidence records one by one to identify the problematic one
                    for (const record of evidenceRecords) {
                      try {
                        const { data: singleData, error: singleError } = await supabase
                          .from('monitoring_evidence')
                          .insert([record])
                          .select();
                        
                        if (singleError) {
                          console.error(`[AutoCase] Failed to create ${record.evidence_type} evidence:`, singleError);
                        } else {
                          console.log(`[AutoCase] Successfully created ${record.evidence_type} evidence`);
                        }
                      } catch (err) {
                        console.error(`[AutoCase] Exception creating ${record.evidence_type} evidence:`, err);
                      }
                    }
                  } else {
                    console.log(`[AutoCase] Successfully created auto-case ${autoCaseId} with ${evidenceData.length} evidence records`);
                    console.log('[AutoCase] Evidence created:', evidenceData.map(e => e.evidence_type));
                  }
                } else {
                  console.warn('[AutoCase] No evidence records to create - this should not happen');
                }
              }
            }
          } catch (error) {
            console.error('[AutoCase] Error during auto-case creation:', error);
          }
        }

        return {
          job: result.job,
          log: result.log,
          autoCaseCreated,
          autoCaseId,
          message: autoCaseCreated 
            ? `High-risk infringement detected! Auto-case created with comprehensive evidence.`
            : 'SurveillanceAgent completed monitoring job successfully'
        };
      } catch (error) {
        // Update job status to failed
        await supabase
          .from('monitoring_jobs')
          .update({ 
            job_status: 'failed',
            error_message: error.message,
            completed_at: new Date().toISOString()
          })
          .eq('id', input.id);

        throw new Error(`SurveillanceAgent failed: ${error.message}`);
      }
    }),

  // Get monitoring statistics
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const { data: jobs, error: jobsError } = await supabase
          .from('monitoring_jobs')
          .select('job_status');

        if (jobsError) {
          throw new Error(`Failed to fetch job stats: ${jobsError.message}`);
        }

        const { data: logs, error: logsError } = await supabase
          .from('monitoring_logs')
          .select('risk_score');

        if (logsError) {
          throw new Error(`Failed to fetch log stats: ${logsError.message}`);
        }

        const stats = {
          totalJobs: jobs.length,
          jobsByStatus: {},
          averageRiskScore: 0,
          highRiskCount: 0,
        };

        // Calculate job statistics
        jobs.forEach(job => {
          stats.jobsByStatus[job.job_status] = (stats.jobsByStatus[job.job_status] || 0) + 1;
        });

        // Calculate risk statistics
        if (logs.length > 0) {
          const totalRisk = logs.reduce((sum, log) => sum + (log.risk_score || 0), 0);
          stats.averageRiskScore = Math.round(totalRisk / logs.length);
          stats.highRiskCount = logs.filter(log => (log.risk_score || 0) >= 70).length;
        }

        return {
          stats,
          message: 'Monitoring statistics retrieved successfully'
        };
      } catch (error) {
        throw new Error(`Failed to fetch monitoring statistics: ${error.message}`);
      }
    }),

  // Delete a monitoring job
  delete: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        // First, delete related monitoring logs
        const { error: logsError } = await supabase
          .from('monitoring_logs')
          .delete()
          .eq('job_id', input.id);

        if (logsError) {
          console.error('Failed to delete monitoring logs:', logsError);
          // Continue with job deletion even if logs deletion fails
        }

        // Delete the monitoring job
        const { error } = await supabase
          .from('monitoring_jobs')
          .delete()
          .eq('id', input.id);

        if (error) {
          throw new Error(`Failed to delete monitoring job: ${error.message}`);
        }

        return {
          message: 'Monitoring job deleted successfully'
        };
      } catch (error) {
        throw new Error(`Failed to delete monitoring job: ${error.message}`);
      }
    }),

  // Get auto-generated cases from monitoring (Part 1 feature)
  getAutoCases: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).optional().default(25),
      offset: z.number().min(0).optional().default(0),
    }))
    .query(async ({ input, ctx }) => {
      try {
        const { data, error } = await supabase
          .from('cases')
          .select(`
            *,
            ip_assets:related_ip_asset_id (
              id,
              title,
              type
            ),
            monitoring_evidence (
              id,
              evidence_type,
              evidence_url,
              evidence_data,
              monitoring_logs:monitoring_log_id (
                risk_score,
                result,
                created_at
              )
            )
          `)
          .eq('auto_generated', true)
          .order('created_at', { ascending: false })
          .range(input.offset, input.offset + input.limit - 1);

        if (error) {
          throw new Error(`Failed to fetch auto-generated cases: ${error.message}`);
        }

        return {
          cases: data || [],
          message: 'Auto-generated cases retrieved successfully'
        };
      } catch (error) {
        throw new Error(`Failed to fetch auto-generated cases: ${error.message}`);
      }
    }),

  // Delete all monitoring jobs
  deleteAll: protectedProcedure
    .mutation(async ({ ctx }) => {
      try {
        // First, get all monitoring job IDs
        const { data: jobs, error: jobsError } = await supabase
          .from('monitoring_jobs')
          .select('id');

        if (jobsError) {
          throw new Error(`Failed to fetch monitoring jobs: ${jobsError.message}`);
        }

        if (!jobs || jobs.length === 0) {
          return {
            deletedCount: 0,
            message: 'No monitoring jobs to delete'
          };
        }

        const jobIds = jobs.map(job => job.id);

        // Delete all related monitoring logs first
        const { error: logsError } = await supabase
          .from('monitoring_logs')
          .delete()
          .in('job_id', jobIds);

        if (logsError) {
          console.error('Failed to delete monitoring logs:', logsError);
          // Continue with job deletion even if logs deletion fails
        }

        // Delete all monitoring evidence
        const { error: evidenceError } = await supabase
          .from('monitoring_evidence')
          .delete()
          .in('monitoring_log_id', jobIds);

        if (evidenceError) {
          console.error('Failed to delete monitoring evidence:', evidenceError);
          // Continue with job deletion
        }

        // Delete all monitoring jobs
        const { error: deleteError } = await supabase
          .from('monitoring_jobs')
          .delete()
          .in('id', jobIds);

        if (deleteError) {
          throw new Error(`Failed to delete monitoring jobs: ${deleteError.message}`);
        }

        return {
          deletedCount: jobs.length,
          message: `Successfully deleted ${jobs.length} monitoring job${jobs.length !== 1 ? 's' : ''} and related data`
        };
      } catch (error) {
        throw new Error(`Failed to delete all monitoring jobs: ${error.message}`);
      }
    }),
});

// SurveillanceAgent: Advanced AI-powered web scraping and IP infringement detection
async function executeSurveillanceAgent(job, ipAsset) {
  console.log(`[SurveillanceAgent] Starting surveillance mission for IP asset: ${ipAsset.title}`);
  console.log(`[SurveillanceAgent] Target URL: ${job.url}`);
  
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-features=VizDisplayCompositor',
      '--disable-web-security',
      '--disable-features=site-per-process'
    ]
  });

  try {
    const page = await browser.newPage();
    
    // Advanced stealth configuration to avoid detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Remove webdriver traces for better stealth
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
      delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
      delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
    });
    
    console.log(`[SurveillanceAgent] Deploying stealth navigation protocols...`);
    
    // Navigate with intelligent retry logic
    let retries = 3;
    let pageData;
    
    while (retries > 0) {
      try {
        await page.goto(job.url, { 
          waitUntil: 'networkidle2', 
          timeout: 30000 
        });
        break;
      } catch (error) {
        retries--;
        if (retries === 0) throw error;
        console.log(`[SurveillanceAgent] Navigation failed, retrying... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Wait for dynamic content and JavaScript to fully load
    await page.waitForTimeout(5000);
    
    console.log(`[SurveillanceAgent] Capturing comprehensive evidence package...`);
    
    // Take high-quality screenshot for evidence
    const screenshot = await page.screenshot({ 
      fullPage: true,
      type: 'png'
    });
    
    // Extract comprehensive intelligence from the page
    pageData = await page.evaluate(() => {
      // Helper function to clean text
      const cleanText = (text) => text ? text.trim().replace(/\s+/g, ' ') : '';
      
      return {
        title: document.title,
        url: window.location.href,
        metaDescription: document.querySelector('meta[name="description"]')?.content || '',
        metaKeywords: document.querySelector('meta[name="keywords"]')?.content || '',
        
        // Extract all headings for structure analysis
        headings: Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
          .map(h => ({
            level: h.tagName.toLowerCase(),
            text: cleanText(h.textContent)
          }))
          .filter(h => h.text.length > 0),
        
        // Extract images with comprehensive metadata
        images: Array.from(document.querySelectorAll('img'))
          .map(img => ({
            src: img.src,
            alt: cleanText(img.alt),
            title: cleanText(img.title),
            width: img.naturalWidth,
            height: img.naturalHeight
          }))
          .filter(img => img.src && !img.src.includes('data:'))
          .slice(0, 15),
        
        // Extract links for relationship analysis
        links: Array.from(document.querySelectorAll('a[href]'))
          .map(a => ({
            href: a.href,
            text: cleanText(a.textContent),
            title: cleanText(a.title)
          }))
          .filter(link => link.text.length > 0)
          .slice(0, 25),
        
        // Extract all visible text content
        textContent: cleanText(document.body.textContent),
        
        // Extract structured data (JSON-LD, microdata)
        structuredData: Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
          .map(script => {
            try {
              return JSON.parse(script.textContent);
            } catch {
              return null;
            }
          })
          .filter(data => data !== null),
        
        // Page performance and technical details
        pageStats: {
          loadTime: performance.now(),
          imageCount: document.querySelectorAll('img').length,
          linkCount: document.querySelectorAll('a').length,
          scriptCount: document.querySelectorAll('script').length,
          wordCount: cleanText(document.body.textContent).split(/\s+/).length
        }
      };
    });
    
    const htmlContent = await page.content();
    
    console.log(`[SurveillanceAgent] Initiating AnalysisAgent for IP infringement assessment...`);
    
    // CRITICAL FIX: Use real Groq-powered AnalysisAgent instead of hardcoded analysis
    const analysisAgent = new AnalysisAgent();
    
    // Prepare evidence data for AnalysisAgent
    const evidenceData = {
      ...pageData,
      textContent: pageData.textContent,
      htmlContent: htmlContent.substring(0, 10000), // Limit for AI processing
      riskScore: null // Will be calculated by AnalysisAgent
    };
    
    // Get sophisticated AI analysis using Groq
    const infringementAnalysis = await analysisAgent.validateInfringement({
      ipAsset,
      evidenceData,
      targetUrl: job.url
    });
    
    // Calculate comprehensive risk score using AI analysis
    const riskScoreResult = await analysisAgent.calculateRiskScore({
      ipAsset,
      evidenceData: { ...evidenceData, riskScore: infringementAnalysis.confidence },
      infringementAnalysis
    });
    
    const analysisResult = {
      riskScore: riskScoreResult.overallRiskScore,
      summary: `AI Analysis: ${infringementAnalysis.infringementLikely ? 'INFRINGEMENT LIKELY' : 'NO CLEAR INFRINGEMENT'} - ${infringementAnalysis.strength || 'UNKNOWN'} evidence`,
      details: {
        aiAnalysis: infringementAnalysis,
        riskFactors: riskScoreResult.factors,
        recommendation: riskScoreResult.recommendation,
        confidence: infringementAnalysis.confidence || 0,
        legalBasis: infringementAnalysis.legalBasis,
        evidenceQuality: infringementAnalysis.evidenceQuality,
        risks: infringementAnalysis.risks
      },
      confidence: infringementAnalysis.confidence || 0,
      domainRelevance: 1.0 // AI handles context internally
    };
    
    console.log(`[SurveillanceAgent] AI Analysis complete. Risk score: ${analysisResult.riskScore}% (Confidence: ${analysisResult.confidence}%)`);
    
    // Upload screenshot evidence to secure storage with improved error handling
    const screenshotFileName = `surveillance/${job.id}_${Date.now()}.png`;
    let screenshotUrl = null;
    
    try {
      console.log(`[SurveillanceAgent] Uploading screenshot to storage: ${screenshotFileName}`);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('evidence')
        .upload(screenshotFileName, screenshot, {
          contentType: 'image/png',
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('[SurveillanceAgent] Screenshot upload failed:', uploadError);
        
        // Try alternative filename if file already exists
        if (uploadError.message?.includes('already exists')) {
          const altFileName = `surveillance/${job.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.png`;
          console.log(`[SurveillanceAgent] Retrying with alternative filename: ${altFileName}`);
          
          const { data: retryData, error: retryError } = await supabase.storage
            .from('evidence')
            .upload(altFileName, screenshot, {
              contentType: 'image/png',
              cacheControl: '3600'
            });
            
          if (!retryError) {
            const { data: { publicUrl } } = supabase.storage
              .from('evidence')
              .getPublicUrl(altFileName);
            screenshotUrl = publicUrl;
            console.log(`[SurveillanceAgent] Screenshot uploaded successfully (retry): ${screenshotUrl}`);
          } else {
            console.error('[SurveillanceAgent] Screenshot retry upload failed:', retryError);
          }
        }
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('evidence')
          .getPublicUrl(screenshotFileName);
        screenshotUrl = publicUrl;
        console.log(`[SurveillanceAgent] Screenshot uploaded successfully: ${screenshotUrl}`);
      }
    } catch (error) {
      console.error('[SurveillanceAgent] Screenshot upload exception:', error);
    }

    // Create comprehensive monitoring log with agent intelligence
    // This will trigger auto-case creation if risk score >= 70
    const { data: log, error: logError } = await supabase
      .from('monitoring_logs')
      .insert({
        job_id: job.id,
        result: `SurveillanceAgent Analysis: ${analysisResult.summary}`,
        risk_score: analysisResult.riskScore,
        screenshot_url: screenshotUrl,
        html_content: htmlContent.substring(0, 10000), // Limit for storage
        metadata: {
          ...pageData,
          analysisDetails: analysisResult.details,
          agentVersion: 'SurveillanceAgent-v1.0',
          timestamp: new Date().toISOString(),
          processingTime: Date.now(),
          autoEvidenceFlow: true // Flag for Part 1 automation
        }
      })
      .select()
      .single();

    if (logError) {
      console.error('[SurveillanceAgent] Failed to create monitoring log:', logError);
    }

    console.log(`[SurveillanceAgent] Mission completed successfully. Evidence secured.`);

    return {
      job,
      log,
      riskScore: analysisResult.riskScore,
      screenshotUrl,
      analysisResult
    };
  } finally {
    await browser.close();
  }
}

// Note: All analysis is now handled by the sophisticated Groq-powered AnalysisAgent
// No hardcoded pattern matching - everything is AI-driven post-scraping