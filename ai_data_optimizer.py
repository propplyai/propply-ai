#!/usr/bin/env python3
"""
AI Data Optimizer - Prepares compliance data for external AI analysis
Optimizes data structure and sends to n8n webhook for AI processing
"""

import json
import requests
import os
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import logging
from dataclasses import dataclass, asdict
from philly_enhanced_data_client import PhillyEnhancedDataClient

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class AIOptimizedViolation:
    """Optimized violation structure for AI analysis"""
    violation_id: str
    type: str
    severity: str  # Critical, High, Medium, Low
    description: str
    status: str
    date_issued: str
    estimated_cost_min: Optional[int] = None
    estimated_cost_max: Optional[int] = None
    regulatory_impact: Optional[str] = None
    risk_category: Optional[str] = None

@dataclass
class AIOptimizedPermit:
    """Optimized permit structure for AI analysis"""
    permit_id: str
    type: str
    status: str
    issue_date: str
    scope_of_work: str
    contractor: Optional[str] = None
    cost: Optional[int] = None
    compliance_impact: Optional[str] = None

@dataclass
class AIOptimizedProperty:
    """Complete property data optimized for AI analysis"""
    property_id: str
    address: str
    city: str
    property_type: Optional[str] = None
    compliance_score: Optional[int] = None
    last_inspection_date: Optional[str] = None
    
    # Categorized data
    violations: List[AIOptimizedViolation] = None
    permits: List[AIOptimizedPermit] = None
    
    # Risk assessment
    overall_risk_level: str = "UNKNOWN"
    risk_factors: List[str] = None
    
    # AI Context
    analysis_context: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.violations is None:
            self.violations = []
        if self.permits is None:
            self.permits = []
        if self.risk_factors is None:
            self.risk_factors = []
        if self.analysis_context is None:
            self.analysis_context = {}

@dataclass
class AIAnalysisRequest:
    """Complete AI analysis request structure"""
    request_id: str
    timestamp: str
    property_data: AIOptimizedProperty
    analysis_type: str  # "compliance_assessment", "risk_analysis", "action_planning"
    ai_instructions: Dict[str, Any]
    callback_config: Dict[str, str]

class AIDataOptimizer:
    """
    Optimizes compliance data for external AI analysis via n8n webhooks
    """
    
    def __init__(self, webhook_url: str = None, supabase_config: Dict = None):
        self.webhook_url = webhook_url or os.getenv('N8N_WEBHOOK_URL')
        self.supabase_config = supabase_config or {
            'url': os.getenv('SUPABASE_URL'),
            'key': os.getenv('SUPABASE_KEY')
        }
        
        # Initialize Philadelphia client
        self.philly_client = PhillyEnhancedDataClient()
        
        if not self.webhook_url:
            logger.warning("No webhook URL configured - AI analysis will be simulated")
    
    def optimize_property_data(self, address: str, property_id: str = None) -> AIOptimizedProperty:
        """
        Gather and optimize property data for AI analysis
        
        Args:
            address: Property address
            property_id: Optional property UUID
            
        Returns:
            Optimized property data structure
        """
        logger.info(f"Optimizing data for property: {address}")
        
        try:
            # Get comprehensive property data
            raw_data = self.philly_client.get_comprehensive_property_data(address)
            
            if 'error' in raw_data:
                raise Exception(raw_data['error'])
            
            # Create optimized property structure
            optimized_property = AIOptimizedProperty(
                property_id=property_id or str(uuid.uuid4()),
                address=address,
                city="Philadelphia",
                compliance_score=raw_data.get('compliance_summary', {}).get('compliance_score'),
                overall_risk_level=self._determine_risk_level(raw_data)
            )
            
            # Optimize violations
            optimized_property.violations = self._optimize_violations(
                raw_data.get('violations', {}).get('records', [])
            )
            
            # Optimize permits
            optimized_property.permits = self._optimize_permits(
                raw_data.get('permits', {}).get('records', [])
            )
            
            # Add risk factors
            optimized_property.risk_factors = self._extract_risk_factors(raw_data)
            
            # Add AI analysis context
            optimized_property.analysis_context = self._build_analysis_context(raw_data)
            
            logger.info(f"Optimized data: {len(optimized_property.violations)} violations, "
                       f"{len(optimized_property.permits)} permits, "
                       f"Risk Level: {optimized_property.overall_risk_level}")
            
            return optimized_property
            
        except Exception as e:
            logger.error(f"Error optimizing property data: {e}")
            raise
    
    def _optimize_violations(self, raw_violations: List[Dict]) -> List[AIOptimizedViolation]:
        """Convert raw violations to AI-optimized format"""
        optimized = []
        
        for violation in raw_violations:
            try:
                optimized_violation = AIOptimizedViolation(
                    violation_id=violation.get('violationnumber', str(uuid.uuid4())),
                    type=violation.get('violationtype', 'Unknown'),
                    severity=self._map_violation_severity(violation.get('risk_category')),
                    description=violation.get('violationdescription', ''),
                    status=violation.get('status', 'Unknown'),
                    date_issued=violation.get('violationdate', ''),
                    estimated_cost_min=violation.get('estimated_cost_min'),
                    estimated_cost_max=violation.get('estimated_cost_max'),
                    risk_category=violation.get('risk_category')
                )
                optimized.append(optimized_violation)
            except Exception as e:
                logger.warning(f"Error optimizing violation: {e}")
                continue
        
        return optimized
    
    def _optimize_permits(self, raw_permits: List[Dict]) -> List[AIOptimizedPermit]:
        """Convert raw permits to AI-optimized format"""
        optimized = []
        
        for permit in raw_permits:
            try:
                optimized_permit = AIOptimizedPermit(
                    permit_id=permit.get('permitnumber', str(uuid.uuid4())),
                    type=permit.get('permittype', 'Unknown'),
                    status=permit.get('status', 'Unknown'),
                    issue_date=permit.get('permitissuedate', ''),
                    scope_of_work=permit.get('approvedscopeofwork', ''),
                    contractor=permit.get('contractorname'),
                    compliance_impact=permit.get('compliance_impact_score')
                )
                optimized.append(optimized_permit)
            except Exception as e:
                logger.warning(f"Error optimizing permit: {e}")
                continue
        
        return optimized
    
    def _determine_risk_level(self, raw_data: Dict) -> str:
        """Determine overall risk level from raw data"""
        violations = raw_data.get('violations', {}).get('records', [])
        
        # Count violations by risk category
        fire_violations = len([v for v in violations if v.get('risk_category') == 'FIRE'])
        structural_violations = len([v for v in violations if v.get('risk_category') == 'STRUCTURAL'])
        electrical_violations = len([v for v in violations if v.get('risk_category') == 'ELECTRICAL'])
        
        # Determine risk level
        if fire_violations > 0:
            return "CRITICAL"
        elif structural_violations > 1 or electrical_violations > 2:
            return "HIGH"
        elif structural_violations > 0 or electrical_violations > 0:
            return "MEDIUM"
        else:
            return "LOW"
    
    def _map_violation_severity(self, risk_category: str) -> str:
        """Map risk category to severity level"""
        severity_map = {
            'FIRE': 'Critical',
            'STRUCTURAL': 'High',
            'ELECTRICAL': 'High',
            'MECHANICAL': 'Medium',
            'PLUMBING': 'Medium',
            'HOUSING': 'Low',
            'ZONING': 'Low'
        }
        return severity_map.get(risk_category, 'Medium')
    
    def _extract_risk_factors(self, raw_data: Dict) -> List[str]:
        """Extract key risk factors for AI analysis"""
        risk_factors = []
        
        violations = raw_data.get('violations', {}).get('records', [])
        permits = raw_data.get('permits', {}).get('records', [])
        
        # Violation-based risk factors
        open_violations = [v for v in violations if v.get('status', '').upper() in ['OPEN', 'ACTIVE']]
        if len(open_violations) > 5:
            risk_factors.append("High volume of open violations")
        
        fire_violations = [v for v in violations if v.get('risk_category') == 'FIRE']
        if fire_violations:
            risk_factors.append("Fire safety violations present")
        
        # Permit-based risk factors
        recent_permits = [p for p in permits if self._is_recent_permit(p.get('permitissuedate'))]
        if len(recent_permits) == 0:
            risk_factors.append("No recent maintenance permits")
        
        return risk_factors
    
    def _build_analysis_context(self, raw_data: Dict) -> Dict[str, Any]:
        """Build context information for AI analysis"""
        context = {
            'data_sources': ['Philadelphia L&I Open Data'],
            'analysis_date': datetime.now().isoformat(),
            'data_quality': {
                'violations_completeness': len(raw_data.get('violations', {}).get('records', [])) > 0,
                'permits_completeness': len(raw_data.get('permits', {}).get('records', [])) > 0,
                'certifications_available': len(raw_data.get('certifications', {}).get('records', [])) > 0
            },
            'regulatory_context': {
                'jurisdiction': 'Philadelphia, PA',
                'primary_agency': 'Licenses & Inspections',
                'compliance_framework': 'Philadelphia Building Code'
            }
        }
        
        return context
    
    def _is_recent_permit(self, permit_date: str) -> bool:
        """Check if permit is recent (within last year)"""
        if not permit_date:
            return False
        
        try:
            # Handle date formats
            if 'T' in permit_date:
                permit_date = permit_date.split('T')[0]
            
            permit_datetime = datetime.strptime(permit_date, '%Y-%m-%d')
            return permit_datetime > datetime.now() - timedelta(days=365)
        except:
            return False
    
    def create_ai_analysis_request(self, optimized_property: AIOptimizedProperty, 
                                 analysis_type: str = "compliance_assessment") -> AIAnalysisRequest:
        """
        Create AI analysis request with optimized instructions
        
        Args:
            optimized_property: Optimized property data
            analysis_type: Type of analysis to perform
            
        Returns:
            Complete AI analysis request
        """
        
        # Define AI instructions based on analysis type
        ai_instructions = self._get_ai_instructions(analysis_type, optimized_property)
        
        # Create callback configuration
        callback_config = {
            'callback_url': f"{os.getenv('APP_BASE_URL', 'http://localhost:5002')}/api/ai-callback",
            'property_id': optimized_property.property_id,
            'analysis_type': analysis_type
        }
        
        request = AIAnalysisRequest(
            request_id=str(uuid.uuid4()),
            timestamp=datetime.now().isoformat(),
            property_data=optimized_property,
            analysis_type=analysis_type,
            ai_instructions=ai_instructions,
            callback_config=callback_config
        )
        
        return request
    
    def _get_ai_instructions(self, analysis_type: str, property_data: AIOptimizedProperty) -> Dict[str, Any]:
        """Get optimized AI instructions based on analysis type"""
        
        base_instructions = {
            "role": "You are an expert property compliance analyst specializing in Philadelphia building codes and regulations.",
            "context": f"Analyze the compliance data for {property_data.address} in Philadelphia, PA.",
            "data_quality": property_data.analysis_context.get('data_quality', {}),
            "response_format": "structured_json"
        }
        
        if analysis_type == "compliance_assessment":
            base_instructions.update({
                "primary_task": "Assess overall compliance status and identify critical issues",
                "focus_areas": [
                    "Fire safety violations (highest priority)",
                    "Structural integrity issues", 
                    "Electrical code compliance",
                    "Mechanical systems status",
                    "Outstanding permit requirements"
                ],
                "required_outputs": [
                    "overall_compliance_score",
                    "critical_violations_summary",
                    "immediate_actions_required",
                    "cost_estimates",
                    "regulatory_timeline"
                ]
            })
        
        elif analysis_type == "risk_analysis":
            base_instructions.update({
                "primary_task": "Perform comprehensive risk assessment",
                "focus_areas": [
                    "Public safety risks",
                    "Financial liability exposure",
                    "Regulatory enforcement probability",
                    "Insurance implications",
                    "Property value impact"
                ],
                "required_outputs": [
                    "risk_matrix",
                    "probability_assessments",
                    "impact_analysis",
                    "mitigation_strategies",
                    "monitoring_recommendations"
                ]
            })
        
        elif analysis_type == "action_planning":
            base_instructions.update({
                "primary_task": "Create prioritized action plan",
                "focus_areas": [
                    "Critical path analysis",
                    "Resource requirements",
                    "Timeline optimization",
                    "Cost-benefit analysis",
                    "Regulatory sequencing"
                ],
                "required_outputs": [
                    "prioritized_action_items",
                    "resource_allocation",
                    "timeline_milestones",
                    "budget_projections",
                    "success_metrics"
                ]
            })
        
        return base_instructions
    
    async def send_to_ai_webhook(self, ai_request: AIAnalysisRequest) -> Dict[str, Any]:
        """
        Send optimized data to n8n webhook for AI processing
        
        Args:
            ai_request: Complete AI analysis request
            
        Returns:
            Webhook response or error
        """
        if not self.webhook_url:
            logger.warning("No webhook URL configured - simulating AI analysis")
            return self._simulate_ai_response(ai_request)
        
        try:
            # Convert to JSON-serializable format
            payload = {
                'request_id': ai_request.request_id,
                'timestamp': ai_request.timestamp,
                'analysis_type': ai_request.analysis_type,
                'property_data': asdict(ai_request.property_data),
                'ai_instructions': ai_request.ai_instructions,
                'callback_config': ai_request.callback_config
            }
            
            logger.info(f"Sending AI request {ai_request.request_id} to webhook: {self.webhook_url}")
            
            # Send to n8n webhook
            response = requests.post(
                self.webhook_url,
                json=payload,
                headers={
                    'Content-Type': 'application/json',
                    'X-Request-ID': ai_request.request_id,
                    'X-Analysis-Type': ai_request.analysis_type
                },
                timeout=30
            )
            
            response.raise_for_status()
            
            webhook_response = response.json()
            logger.info(f"Webhook response received for request {ai_request.request_id}")
            
            return {
                'success': True,
                'request_id': ai_request.request_id,
                'webhook_response': webhook_response,
                'sent_at': datetime.now().isoformat()
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Webhook request failed: {e}")
            return {
                'success': False,
                'error': str(e),
                'request_id': ai_request.request_id
            }
        except Exception as e:
            logger.error(f"Error sending to webhook: {e}")
            return {
                'success': False,
                'error': str(e),
                'request_id': ai_request.request_id
            }
    
    def _simulate_ai_response(self, ai_request: AIAnalysisRequest) -> Dict[str, Any]:
        """Simulate AI response for testing purposes"""
        
        property_data = ai_request.property_data
        
        simulated_response = {
            'success': True,
            'request_id': ai_request.request_id,
            'analysis_type': ai_request.analysis_type,
            'ai_analysis': {
                'overall_compliance_score': max(0, 100 - len(property_data.violations) * 8),
                'risk_level': property_data.overall_risk_level,
                'critical_findings': [
                    f"Property has {len(property_data.violations)} total violations",
                    f"Risk level assessed as {property_data.overall_risk_level}",
                    f"Recent permit activity: {len(property_data.permits)} permits"
                ],
                'recommendations': [
                    "Address fire safety violations immediately",
                    "Schedule comprehensive building inspection",
                    "Update mechanical systems permits"
                ],
                'estimated_costs': {
                    'immediate': {'min': 5000, 'max': 15000},
                    'annual': {'min': 12000, 'max': 35000}
                },
                'confidence_score': 0.85,
                'analysis_date': datetime.now().isoformat()
            },
            'simulated': True
        }
        
        logger.info(f"Simulated AI response for request {ai_request.request_id}")
        return simulated_response
    
    async def process_complete_analysis(self, address: str, property_id: str = None, 
                                analysis_type: str = "compliance_assessment") -> Dict[str, Any]:
        """
        Complete end-to-end analysis process
        
        Args:
            address: Property address
            property_id: Optional property UUID
            analysis_type: Type of analysis to perform
            
        Returns:
            Complete analysis results
        """
        try:
            logger.info(f"Starting complete analysis for {address}")
            
            # Step 1: Optimize property data
            optimized_property = self.optimize_property_data(address, property_id)
            
            # Step 2: Create AI analysis request
            ai_request = self.create_ai_analysis_request(optimized_property, analysis_type)
            
            # Step 3: Send to AI webhook (n8n)
            webhook_result = await self.send_to_ai_webhook(ai_request)
            
            # Step 4: Return complete results
            return {
                'success': webhook_result.get('success', False),
                'request_id': ai_request.request_id,
                'property_data': asdict(optimized_property),
                'ai_instructions': ai_request.ai_instructions,
                'webhook_result': webhook_result,
                'analysis_type': analysis_type,
                'processed_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in complete analysis: {e}")
            return {
                'success': False,
                'error': str(e),
                'address': address,
                'analysis_type': analysis_type
            }

# Test function
if __name__ == "__main__":
    # Test the AI data optimizer
    optimizer = AIDataOptimizer()
    
    test_address = "1400 John F Kennedy Blvd"
    result = optimizer.process_complete_analysis(test_address)
    
    print("=== AI DATA OPTIMIZATION TEST ===")
    print(f"Success: {result.get('success')}")
    print(f"Request ID: {result.get('request_id')}")
    if result.get('property_data'):
        prop_data = result['property_data']
        print(f"Violations: {len(prop_data.get('violations', []))}")
        print(f"Permits: {len(prop_data.get('permits', []))}")
        print(f"Risk Level: {prop_data.get('overall_risk_level')}")
    
    if result.get('webhook_result', {}).get('ai_analysis'):
        ai_analysis = result['webhook_result']['ai_analysis']
        print(f"AI Compliance Score: {ai_analysis.get('overall_compliance_score')}")
        print(f"AI Recommendations: {len(ai_analysis.get('recommendations', []))}")
