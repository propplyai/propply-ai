#!/usr/bin/env python3
"""
AI Compliance Analyzer - Workflow Orchestrator
Coordinates the external AI analysis workflow via n8n webhooks

Complete Workflow:
Frontend → /api/ai-optimized-analysis → Propply optimizes data → n8n webhook
n8n + External AI → AI analysis → /api/ai-callback → Supabase storage
Frontend → Supabase data → EnhancedComplianceAnalytics.jsx → User dashboard
"""

from datetime import datetime
from typing import Dict, List, Any
import logging
import asyncio
from ai_data_optimizer import AIDataOptimizer
from ai_webhook_handler import AIWebhookHandler

logger = logging.getLogger(__name__)

class AIComplianceAnalyzer:
    """
    Orchestrates external AI compliance analysis via n8n webhook workflow
    
    This class DOES NOT perform local AI analysis. Instead, it:
    1. Optimizes data for external AI analysis
    2. Sends data to n8n webhook for external AI processing
    3. Handles AI analysis results via webhook callbacks
    """
    
    def __init__(self):
        self.version = "2.0"
        self.ai_optimizer = AIDataOptimizer()
        self.webhook_handler = AIWebhookHandler()
    
    async def analyze_compliance_data(self, compliance_data: Dict, property_info: Dict) -> Dict[str, Any]:
        """
        Initiate external AI compliance analysis via n8n webhook
        
        This method STARTS the analysis process but does NOT return AI results.
        AI results come back later via /api/ai-callback webhook.
        
        Args:
            compliance_data: Raw compliance data from APIs
            property_info: Property information
            
        Returns:
            Analysis initiation status (NOT AI results)
        """
        try:
            address = property_info.get('address', 'Unknown')
            property_id = property_info.get('property_id')
            
            logger.info(f"Initiating external AI analysis for: {address}")
            
            # Step 1: Optimize data for AI analysis
            optimized_property = self.ai_optimizer.optimize_property_data(address, property_id)
            
            # Step 2: Create AI analysis request
            ai_request = self.ai_optimizer.create_ai_analysis_request(
                optimized_property, 
                analysis_type="compliance_assessment"
            )
            
            # Step 3: Send to n8n webhook for external AI processing
            webhook_result = await self.ai_optimizer.send_to_ai_webhook(ai_request)
            
            if webhook_result.get('success'):
                return {
                    'status': 'analysis_initiated',
                    'request_id': ai_request.request_id,
                    'property_address': address,
                    'webhook_sent_at': datetime.now().isoformat(),
                    'message': 'AI analysis request sent to n8n webhook. Results will be available via callback.',
                    'callback_expected': True,
                    'ai_version': self.version
                }
            else:
                return {
                    'status': 'analysis_failed',
                    'error': webhook_result.get('error', 'Unknown webhook error'),
                    'property_address': address,
                    'ai_version': self.version
                }
            
        except Exception as e:
            logger.error(f"Error initiating AI compliance analysis: {e}")
            return {
                'status': 'analysis_failed',
                'error': str(e),
                'property_address': property_info.get('address', 'Unknown'),
                'ai_version': self.version
            }
    
    def get_analysis_status(self, request_id: str) -> Dict[str, Any]:
        """
        Check the status of an AI analysis request
        
        Args:
            request_id: The request ID from the initiated analysis
            
        Returns:
            Analysis status information
        """
        # In a real implementation, this would check the database
        # for the analysis status and results
        return {
            'request_id': request_id,
            'status': 'pending',
            'message': 'AI analysis in progress via n8n webhook',
            'checked_at': datetime.now().isoformat()
        }
    
    def handle_ai_callback(self, webhook_payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle AI analysis results from n8n webhook callback
        
        Args:
            webhook_payload: AI analysis results from n8n
            
        Returns:
            Callback processing results
        """
        return self.webhook_handler.process_ai_callback(webhook_payload)
    
    def get_dashboard_summary(self, property_ids: List[str] = None) -> Dict[str, Any]:
        """
        Generate dashboard summary from stored AI analyses
        
        Args:
            property_ids: Optional list of property IDs to include
            
        Returns:
            Dashboard summary data
        """
        return self.webhook_handler.create_dashboard_summary(property_ids)

# Workflow Documentation
"""
COMPLETE AI ANALYSIS WORKFLOW:

1. Frontend Request:
   POST /api/ai-optimized-analysis
   {
     "address": "1234 Market St, Philadelphia, PA",
     "property_id": "uuid-here"
   }

2. Propply Data Optimization:
   - AIDataOptimizer.optimize_property_data()
   - Creates optimized data structure for AI
   - Sends to n8n webhook

3. External AI Processing:
   - n8n receives optimized data
   - External AI (Claude, GPT, etc.) processes data
   - AI generates compliance analysis

4. AI Results Callback:
   POST /api/ai-callback
   {
     "request_id": "uuid",
     "ai_analysis": {
       "compliance_score": 75,
       "risk_level": "MEDIUM",
       "recommendations": [...],
       "cost_estimates": {...}
     }
   }

5. Supabase Storage:
   - AIWebhookHandler processes callback
   - Stores results in Supabase tables:
     * ai_analyses
     * compliance_action_plans
     * compliance_cost_tracking

6. Frontend Dashboard:
   - EnhancedComplianceAnalytics.jsx
   - Fetches data from Supabase
   - Displays AI analysis results to user

API ENDPOINTS:
- /api/ai-optimized-analysis (initiate AI analysis)
- /api/ai-callback (receive AI results)
- /api/dashboard-data (get processed results)
"""

if __name__ == "__main__":
    print("AI Compliance Analyzer - n8n Webhook Workflow")
    print("=" * 60)
    print("This module orchestrates EXTERNAL AI analysis via n8n webhooks.")
    print("It does NOT perform local AI analysis.")
    print("")
    print("Workflow:")
    print("Frontend → /api/ai-optimized-analysis → Propply optimizes data → n8n webhook")
    print("n8n + External AI → AI analysis → /api/ai-callback → Supabase storage") 
    print("Frontend → Supabase data → EnhancedComplianceAnalytics.jsx → User dashboard")
    print("")
    print("See workflow documentation above for complete details.")
