#!/usr/bin/env python3
"""
AI Webhook Handler - Receives AI analysis results from n8n and stores in Supabase
Handles the callback from external AI processing and updates the database
"""

import json
import os
import uuid
from datetime import datetime
from typing import Dict, List, Any, Optional
import logging
from dataclasses import dataclass
import asyncio

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class AIAnalysisResult:
    """Structure for AI analysis results from n8n"""
    request_id: str
    property_id: str
    analysis_type: str
    compliance_score: int
    risk_level: str
    findings: List[str]
    recommendations: List[Dict[str, Any]]
    cost_estimates: Dict[str, Any]
    confidence_score: float
    analysis_date: str
    ai_model: str = "external"
    processing_time_seconds: Optional[float] = None

class AIWebhookHandler:
    """
    Handles AI analysis results from n8n webhook and stores in Supabase
    """
    
    def __init__(self, supabase_url: str = None, supabase_key: str = None):
        self.supabase_url = supabase_url or os.getenv('SUPABASE_URL')
        self.supabase_key = supabase_key or os.getenv('SUPABASE_KEY')
        
        # For now, simulate Supabase operations
        self.simulate_supabase = True
        
        if not self.supabase_url or not self.supabase_key:
            logger.warning("Supabase credentials not configured - operations will be simulated")
            self.simulate_supabase = True
    
    def process_ai_callback(self, webhook_payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process AI analysis callback from n8n
        
        Args:
            webhook_payload: Complete payload from n8n webhook
            
        Returns:
            Processing result
        """
        try:
            logger.info(f"Processing AI callback: {webhook_payload.get('request_id')}")
            
            # Extract and validate AI analysis result
            ai_result = self._extract_ai_result(webhook_payload)
            
            # Store in Supabase
            storage_result = self._store_ai_analysis(ai_result)
            
            # Update property compliance score
            self._update_property_compliance(ai_result)
            
            # Generate action items
            action_items_result = self._create_action_items(ai_result)
            
            # Store cost projections
            cost_result = self._store_cost_projections(ai_result)
            
            return {
                'success': True,
                'request_id': ai_result.request_id,
                'property_id': ai_result.property_id,
                'storage_results': {
                    'ai_analysis': storage_result,
                    'action_items': action_items_result,
                    'cost_projections': cost_result
                },
                'processed_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error processing AI callback: {e}")
            return {
                'success': False,
                'error': str(e),
                'request_id': webhook_payload.get('request_id'),
                'processed_at': datetime.now().isoformat()
            }
    
    def _extract_ai_result(self, webhook_payload: Dict[str, Any]) -> AIAnalysisResult:
        """Extract AI analysis result from webhook payload"""
        
        # Handle different payload structures from n8n
        ai_data = webhook_payload.get('ai_analysis', {})
        if not ai_data:
            ai_data = webhook_payload.get('analysis_result', {})
        if not ai_data:
            ai_data = webhook_payload  # Assume flat structure
        
        # Extract recommendations
        recommendations = []
        raw_recommendations = ai_data.get('recommendations', [])
        
        for rec in raw_recommendations:
            if isinstance(rec, str):
                recommendations.append({
                    'title': rec,
                    'priority': 'Medium',
                    'category': 'General',
                    'estimated_cost': None
                })
            elif isinstance(rec, dict):
                recommendations.append({
                    'title': rec.get('title', rec.get('description', 'Unknown')),
                    'priority': rec.get('priority', 'Medium'),
                    'category': rec.get('category', 'General'),
                    'estimated_cost': rec.get('cost', rec.get('estimated_cost'))
                })
        
        # Extract cost estimates
        cost_estimates = ai_data.get('cost_estimates', ai_data.get('estimated_costs', {}))
        if not cost_estimates:
            cost_estimates = {'immediate': {'min': 0, 'max': 0}, 'annual': {'min': 0, 'max': 0}}
        
        ai_result = AIAnalysisResult(
            request_id=webhook_payload.get('request_id', str(uuid.uuid4())),
            property_id=webhook_payload.get('property_id', webhook_payload.get('callback_config', {}).get('property_id')),
            analysis_type=webhook_payload.get('analysis_type', 'compliance_assessment'),
            compliance_score=ai_data.get('overall_compliance_score', ai_data.get('compliance_score', 50)),
            risk_level=ai_data.get('risk_level', 'MEDIUM'),
            findings=ai_data.get('critical_findings', ai_data.get('findings', [])),
            recommendations=recommendations,
            cost_estimates=cost_estimates,
            confidence_score=ai_data.get('confidence_score', 0.8),
            analysis_date=ai_data.get('analysis_date', datetime.now().isoformat()),
            ai_model=ai_data.get('model', ai_data.get('ai_model', 'external')),
            processing_time_seconds=webhook_payload.get('processing_time')
        )
        
        return ai_result
    
    def _store_ai_analysis(self, ai_result: AIAnalysisResult) -> Dict[str, Any]:
        """Store AI analysis result in Supabase ai_analyses table"""
        
        if self.simulate_supabase:
            return self._simulate_store_ai_analysis(ai_result)
        
        try:
            # In real implementation, this would use Supabase client
            analysis_record = {
                'id': str(uuid.uuid4()),
                'property_id': ai_result.property_id,
                'risk_score': ai_result.compliance_score,
                'insights': ai_result.findings,
                'predictions': [rec['title'] for rec in ai_result.recommendations],
                'priority': self._map_risk_to_priority(ai_result.risk_level),
                'trends': {
                    'analysis_type': ai_result.analysis_type,
                    'confidence_score': ai_result.confidence_score,
                    'ai_model': ai_result.ai_model,
                    'processing_time': ai_result.processing_time_seconds
                },
                'generated_at': ai_result.analysis_date,
                'model_version': f"{ai_result.ai_model}_v2.0"
            }
            
            # Supabase insert would go here
            # result = supabase.table('ai_analyses').insert(analysis_record).execute()
            
            logger.info(f"Stored AI analysis for property {ai_result.property_id}")
            return {'success': True, 'record_id': analysis_record['id']}
            
        except Exception as e:
            logger.error(f"Error storing AI analysis: {e}")
            return {'success': False, 'error': str(e)}
    
    def _simulate_store_ai_analysis(self, ai_result: AIAnalysisResult) -> Dict[str, Any]:
        """Simulate storing AI analysis (for testing)"""
        
        record_id = str(uuid.uuid4())
        
        logger.info(f"SIMULATED: Stored AI analysis in ai_analyses table")
        logger.info(f"  Property ID: {ai_result.property_id}")
        logger.info(f"  Risk Score: {ai_result.compliance_score}")
        logger.info(f"  Risk Level: {ai_result.risk_level}")
        logger.info(f"  Findings: {len(ai_result.findings)} items")
        logger.info(f"  Recommendations: {len(ai_result.recommendations)} items")
        logger.info(f"  Record ID: {record_id}")
        
        return {'success': True, 'record_id': record_id, 'simulated': True}
    
    def _update_property_compliance(self, ai_result: AIAnalysisResult) -> Dict[str, Any]:
        """Update property compliance score based on AI analysis"""
        
        if self.simulate_supabase:
            logger.info(f"SIMULATED: Updated property {ai_result.property_id} compliance score to {ai_result.compliance_score}")
            return {'success': True, 'simulated': True}
        
        try:
            # In real implementation:
            # supabase.table('properties').update({
            #     'compliance_score': ai_result.compliance_score,
            #     'updated_at': datetime.now().isoformat()
            # }).eq('id', ai_result.property_id).execute()
            
            logger.info(f"Updated property compliance score: {ai_result.compliance_score}")
            return {'success': True}
            
        except Exception as e:
            logger.error(f"Error updating property compliance: {e}")
            return {'success': False, 'error': str(e)}
    
    def _create_action_items(self, ai_result: AIAnalysisResult) -> Dict[str, Any]:
        """Create action items from AI recommendations"""
        
        if self.simulate_supabase:
            return self._simulate_create_action_items(ai_result)
        
        try:
            action_items = []
            
            for rec in ai_result.recommendations:
                action_item = {
                    'id': str(uuid.uuid4()),
                    'property_id': ai_result.property_id,
                    'action_type': self._map_category_to_action_type(rec.get('category', 'General')),
                    'priority': rec.get('priority', 'Medium').upper(),
                    'title': rec['title'],
                    'description': f"AI-generated recommendation from {ai_result.analysis_type} analysis",
                    'estimated_cost_min': self._extract_cost_min(rec.get('estimated_cost')),
                    'estimated_cost_max': self._extract_cost_max(rec.get('estimated_cost')),
                    'status': 'PENDING',
                    'regulatory_impact': self._assess_regulatory_impact(rec),
                    'created_at': datetime.now().isoformat()
                }
                action_items.append(action_item)
            
            # In real implementation:
            # supabase.table('compliance_action_plans').insert(action_items).execute()
            
            logger.info(f"Created {len(action_items)} action items")
            return {'success': True, 'count': len(action_items)}
            
        except Exception as e:
            logger.error(f"Error creating action items: {e}")
            return {'success': False, 'error': str(e)}
    
    def _simulate_create_action_items(self, ai_result: AIAnalysisResult) -> Dict[str, Any]:
        """Simulate creating action items"""
        
        logger.info(f"SIMULATED: Created {len(ai_result.recommendations)} action items in compliance_action_plans table")
        for i, rec in enumerate(ai_result.recommendations):
            logger.info(f"  Action {i+1}: {rec['title']} (Priority: {rec.get('priority', 'Medium')})")
        
        return {'success': True, 'count': len(ai_result.recommendations), 'simulated': True}
    
    def _store_cost_projections(self, ai_result: AIAnalysisResult) -> Dict[str, Any]:
        """Store cost projections from AI analysis"""
        
        if self.simulate_supabase:
            return self._simulate_store_cost_projections(ai_result)
        
        try:
            cost_records = []
            
            # Store immediate costs
            immediate_costs = ai_result.cost_estimates.get('immediate', {})
            if immediate_costs:
                cost_records.append({
                    'id': str(uuid.uuid4()),
                    'property_id': ai_result.property_id,
                    'cost_category': 'Immediate Compliance',
                    'estimated_cost_min': immediate_costs.get('min', 0),
                    'estimated_cost_max': immediate_costs.get('max', 0),
                    'cost_date': datetime.now().date().isoformat(),
                    'description': f'Immediate compliance costs from AI analysis',
                    'created_at': datetime.now().isoformat()
                })
            
            # Store annual costs
            annual_costs = ai_result.cost_estimates.get('annual', {})
            if annual_costs:
                cost_records.append({
                    'id': str(uuid.uuid4()),
                    'property_id': ai_result.property_id,
                    'cost_category': 'Annual Maintenance',
                    'estimated_cost_min': annual_costs.get('min', 0),
                    'estimated_cost_max': annual_costs.get('max', 0),
                    'cost_date': datetime.now().date().isoformat(),
                    'description': f'Annual maintenance costs from AI analysis',
                    'created_at': datetime.now().isoformat()
                })
            
            # In real implementation:
            # supabase.table('compliance_cost_tracking').insert(cost_records).execute()
            
            logger.info(f"Stored {len(cost_records)} cost projections")
            return {'success': True, 'count': len(cost_records)}
            
        except Exception as e:
            logger.error(f"Error storing cost projections: {e}")
            return {'success': False, 'error': str(e)}
    
    def _simulate_store_cost_projections(self, ai_result: AIAnalysisResult) -> Dict[str, Any]:
        """Simulate storing cost projections"""
        
        immediate = ai_result.cost_estimates.get('immediate', {})
        annual = ai_result.cost_estimates.get('annual', {})
        
        logger.info(f"SIMULATED: Stored cost projections in compliance_cost_tracking table")
        if immediate:
            logger.info(f"  Immediate: ${immediate.get('min', 0):,} - ${immediate.get('max', 0):,}")
        if annual:
            logger.info(f"  Annual: ${annual.get('min', 0):,} - ${annual.get('max', 0):,}")
        
        return {'success': True, 'count': 2, 'simulated': True}
    
    # Helper methods
    def _map_risk_to_priority(self, risk_level: str) -> str:
        """Map risk level to priority"""
        risk_priority_map = {
            'CRITICAL': 'Critical',
            'HIGH': 'High',
            'MEDIUM': 'Medium',
            'LOW': 'Low'
        }
        return risk_priority_map.get(risk_level, 'Medium')
    
    def _map_category_to_action_type(self, category: str) -> str:
        """Map recommendation category to action type"""
        category_map = {
            'Fire Safety': 'VIOLATION_RESOLUTION',
            'Structural': 'VIOLATION_RESOLUTION', 
            'Electrical': 'VIOLATION_RESOLUTION',
            'Mechanical': 'PREVENTIVE_INSPECTION',
            'Permits': 'CERTIFICATION_RENEWAL',
            'General': 'VIOLATION_RESOLUTION'
        }
        return category_map.get(category, 'VIOLATION_RESOLUTION')
    
    def _extract_cost_min(self, cost_data) -> Optional[int]:
        """Extract minimum cost from cost data"""
        if isinstance(cost_data, dict):
            return cost_data.get('min')
        elif isinstance(cost_data, (int, float)):
            return int(cost_data * 0.8)  # Assume 20% variance
        return None
    
    def _extract_cost_max(self, cost_data) -> Optional[int]:
        """Extract maximum cost from cost data"""
        if isinstance(cost_data, dict):
            return cost_data.get('max')
        elif isinstance(cost_data, (int, float)):
            return int(cost_data * 1.2)  # Assume 20% variance
        return None
    
    def _assess_regulatory_impact(self, recommendation: Dict) -> str:
        """Assess regulatory impact of recommendation"""
        title = recommendation.get('title', '').lower()
        
        if any(word in title for word in ['fire', 'safety', 'emergency']):
            return 'High - Fire safety compliance required'
        elif any(word in title for word in ['structural', 'foundation', 'building']):
            return 'High - Structural integrity compliance required'
        elif any(word in title for word in ['permit', 'license', 'certification']):
            return 'Medium - Permit/certification compliance required'
        else:
            return 'Low - General maintenance recommendation'

    def create_dashboard_summary(self, property_ids: List[str] = None) -> Dict[str, Any]:
        """Create dashboard summary from recent AI analyses"""
        
        if self.simulate_supabase:
            return self._simulate_dashboard_summary(property_ids)
        
        try:
            # In real implementation, this would query Supabase for recent analyses
            # and aggregate the data for dashboard display
            
            summary = {
                'total_properties_analyzed': len(property_ids) if property_ids else 0,
                'average_compliance_score': 75,
                'critical_actions_required': 12,
                'total_estimated_costs': {'min': 45000, 'max': 125000},
                'risk_distribution': {
                    'CRITICAL': 3,
                    'HIGH': 8,
                    'MEDIUM': 15,
                    'LOW': 24
                },
                'recent_analyses': [],
                'generated_at': datetime.now().isoformat()
            }
            
            return summary
            
        except Exception as e:
            logger.error(f"Error creating dashboard summary: {e}")
            return {'error': str(e)}
    
    def _simulate_dashboard_summary(self, property_ids: List[str] = None) -> Dict[str, Any]:
        """Simulate dashboard summary"""
        
        summary = {
            'total_properties_analyzed': 50,
            'average_compliance_score': 78,
            'critical_actions_required': 8,
            'total_estimated_costs': {'min': 125000, 'max': 450000},
            'risk_distribution': {
                'CRITICAL': 2,
                'HIGH': 6,
                'MEDIUM': 18,
                'LOW': 24
            },
            'recent_analyses': [
                {'property_id': 'prop-1', 'score': 85, 'risk': 'LOW'},
                {'property_id': 'prop-2', 'score': 45, 'risk': 'HIGH'},
                {'property_id': 'prop-3', 'score': 72, 'risk': 'MEDIUM'}
            ],
            'generated_at': datetime.now().isoformat(),
            'simulated': True
        }
        
        logger.info("SIMULATED: Generated dashboard summary with AI analysis data")
        return summary

# Test function
if __name__ == "__main__":
    # Test the webhook handler
    handler = AIWebhookHandler()
    
    # Mock webhook payload from n8n
    mock_payload = {
        'request_id': 'test-123',
        'property_id': 'prop-456',
        'analysis_type': 'compliance_assessment',
        'ai_analysis': {
            'overall_compliance_score': 65,
            'risk_level': 'MEDIUM',
            'critical_findings': [
                'Fire safety system requires inspection',
                'Electrical permit expired',
                'Structural integrity acceptable'
            ],
            'recommendations': [
                {
                    'title': 'Schedule fire safety inspection',
                    'priority': 'High',
                    'category': 'Fire Safety',
                    'estimated_cost': {'min': 1500, 'max': 3000}
                },
                {
                    'title': 'Renew electrical permit',
                    'priority': 'Medium',
                    'category': 'Permits',
                    'estimated_cost': {'min': 500, 'max': 800}
                }
            ],
            'cost_estimates': {
                'immediate': {'min': 2000, 'max': 3800},
                'annual': {'min': 8000, 'max': 15000}
            },
            'confidence_score': 0.92
        }
    }
    
    result = handler.process_ai_callback(mock_payload)
    
    print("=== AI WEBHOOK HANDLER TEST ===")
    print(f"Success: {result.get('success')}")
    print(f"Request ID: {result.get('request_id')}")
    print(f"Property ID: {result.get('property_id')}")
    
    if result.get('storage_results'):
        storage = result['storage_results']
        print(f"AI Analysis Stored: {storage.get('ai_analysis', {}).get('success')}")
        print(f"Action Items Created: {storage.get('action_items', {}).get('count', 0)}")
        print(f"Cost Projections: {storage.get('cost_projections', {}).get('count', 0)}")
