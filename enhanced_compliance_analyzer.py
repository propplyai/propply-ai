#!/usr/bin/env python3
"""
Enhanced Compliance Analyzer for Philadelphia Properties
Provides advanced risk assessment, action prioritization, and compliance insights
"""

from philly_enhanced_data_client import PhillyEnhancedDataClient
from datetime import datetime, timedelta
from typing import Dict, List, Any
import logging

logger = logging.getLogger(__name__)

class EnhancedComplianceAnalyzer:
    """
    Advanced compliance analysis for Philadelphia properties
    """
    
    def __init__(self):
        self.client = PhillyEnhancedDataClient()
        
        # Cost estimation ranges for different violation types
        self.violation_cost_estimates = {
            'FIRE': {'min': 1000, 'max': 5000, 'urgency': 'CRITICAL'},
            'STRUCTURAL': {'min': 5000, 'max': 25000, 'urgency': 'HIGH'},
            'ELECTRICAL': {'min': 500, 'max': 3000, 'urgency': 'HIGH'},
            'MECHANICAL': {'min': 1000, 'max': 8000, 'urgency': 'MEDIUM'},
            'PLUMBING': {'min': 300, 'max': 2000, 'urgency': 'MEDIUM'},
            'HOUSING': {'min': 200, 'max': 1500, 'urgency': 'LOW'},
            'ZONING': {'min': 100, 'max': 1000, 'urgency': 'LOW'}
        }
        
        # Certification renewal costs
        self.certification_costs = {
            'sprinkler': {'min': 800, 'max': 2500},
            'fire_alarm': {'min': 500, 'max': 1500},
            'facade': {'min': 2000, 'max': 8000},
            'fire_escape': {'min': 1000, 'max': 3000},
            'standpipe': {'min': 600, 'max': 1800},
            'default': {'min': 300, 'max': 1000}
        }
    
    def generate_comprehensive_report(self, address: str) -> Dict[str, Any]:
        """
        Generate comprehensive compliance report with enhanced analytics
        """
        logger.info(f"Generating enhanced compliance report for: {address}")
        
        # Get base property data
        property_data = self.client.get_comprehensive_property_data(address)
        
        if 'error' in property_data:
            return {'error': property_data['error']}
        
        # Enhanced analysis
        risk_assessment = self._analyze_risk_factors(property_data)
        action_plan = self._generate_action_plan(property_data)
        cost_analysis = self._calculate_cost_projections(property_data, action_plan)
        compliance_trends = self._analyze_compliance_trends(property_data)
        
        return {
            'property_info': {
                'address': address,
                'analysis_date': datetime.now().isoformat(),
                'data_sources': ['Philadelphia L&I', 'Building Certifications', 'Case Investigations']
            },
            'compliance_summary': {
                'overall_score': property_data['compliance_summary']['compliance_score'],
                'risk_level': risk_assessment['overall_risk_level'],
                'priority_status': self._determine_priority_status(risk_assessment),
                'total_violations': property_data['violations']['total'],
                'open_violations': property_data['violations']['open'],
                'active_permits': property_data['permits']['recent']
            },
            'risk_assessment': risk_assessment,
            'action_plan': action_plan,
            'cost_analysis': cost_analysis,
            'compliance_trends': compliance_trends,
            'recommendations': self._generate_recommendations(property_data, risk_assessment)
        }
    
    def _analyze_risk_factors(self, property_data: Dict) -> Dict[str, Any]:
        """Analyze comprehensive risk factors"""
        
        violations = property_data['violations']['records']
        permits = property_data['permits']['records']
        certifications = property_data['certifications']['records']
        
        risk_factors = {
            'fire_safety_risk': 0,
            'structural_risk': 0,
            'mechanical_risk': 0,
            'electrical_risk': 0,
            'certification_risk': 0
        }
        
        # Analyze violation-based risks
        open_violations = [v for v in violations if v.get('status', '').upper() in ['OPEN', 'ACTIVE', 'IN VIOLATION']]
        
        for violation in open_violations:
            violation_type = self.client._categorize_violation_risk(violation.get('violationtype', ''))
            
            if violation_type == 'FIRE':
                risk_factors['fire_safety_risk'] += 25
            elif violation_type == 'STRUCTURAL':
                risk_factors['structural_risk'] += 20
            elif violation_type == 'ELECTRICAL':
                risk_factors['electrical_risk'] += 15
            elif violation_type == 'MECHANICAL':
                risk_factors['mechanical_risk'] += 12
        
        # Analyze certification risks
        expired_certs = [c for c in certifications if self.client._is_expired_certification(c)]
        for cert in expired_certs:
            cert_type = cert.get('certification_type', '').lower()
            if 'fire' in cert_type or 'sprinkler' in cert_type:
                risk_factors['certification_risk'] += 20
            else:
                risk_factors['certification_risk'] += 10
        
        # Calculate overall risk level
        total_risk = sum(risk_factors.values())
        
        if total_risk >= 75:
            overall_risk_level = 'CRITICAL'
        elif total_risk >= 50:
            overall_risk_level = 'HIGH'
        elif total_risk >= 25:
            overall_risk_level = 'MEDIUM'
        else:
            overall_risk_level = 'LOW'
        
        risk_factors['total_risk_score'] = total_risk
        risk_factors['overall_risk_level'] = overall_risk_level
        
        return risk_factors
    
    def _generate_action_plan(self, property_data: Dict) -> List[Dict]:
        """Generate prioritized action plan"""
        
        actions = []
        violations = property_data['violations']['records']
        permits = property_data['permits']['records']
        certifications = property_data['certifications']['records']
        
        # Critical violations first
        open_violations = [v for v in violations if v.get('status', '').upper() in ['OPEN', 'ACTIVE', 'IN VIOLATION']]
        
        for violation in open_violations:
            violation_type = self.client._categorize_violation_risk(violation.get('violationtype', ''))
            cost_info = self.violation_cost_estimates.get(violation_type, {'min': 500, 'max': 2000, 'urgency': 'MEDIUM'})
            
            actions.append({
                'id': f"violation_{violation.get('violationid', 'unknown')}",
                'type': 'VIOLATION_RESOLUTION',
                'priority': cost_info['urgency'],
                'title': f"Resolve {violation_type.title()} Violation",
                'description': violation.get('violationtype', 'Unknown violation'),
                'violation_date': violation.get('violationdate'),
                'estimated_cost_min': cost_info['min'],
                'estimated_cost_max': cost_info['max'],
                'deadline': self._calculate_deadline(violation.get('violationdate'), cost_info['urgency']),
                'regulatory_impact': self._assess_regulatory_impact(violation_type)
            })
        
        # Expired certifications
        expired_certs = [c for c in certifications if self.client._is_expired_certification(c)]
        
        for cert in expired_certs:
            cert_type = cert.get('certification_type', '').lower()
            cost_key = next((k for k in self.certification_costs.keys() if k in cert_type), 'default')
            cost_info = self.certification_costs[cost_key]
            
            actions.append({
                'id': f"cert_{cert.get('certification_number', 'unknown')}",
                'type': 'CERTIFICATION_RENEWAL',
                'priority': 'HIGH' if 'fire' in cert_type else 'MEDIUM',
                'title': f"Renew {cert.get('certification_type', 'Certification')}",
                'description': f"Certification expired on {cert.get('expiration_date')}",
                'estimated_cost_min': cost_info['min'],
                'estimated_cost_max': cost_info['max'],
                'deadline': 'Immediate',
                'regulatory_impact': 'Required for legal operation'
            })
        
        # Preventive maintenance based on permits
        mechanical_permits = [p for p in permits if 'MECHANICAL' in p.get('permittype', '').upper()]
        recent_mechanical = [p for p in mechanical_permits if self.client._is_recent_permit(p)]
        
        for permit in recent_mechanical:
            if self._needs_follow_up_inspection(permit):
                actions.append({
                    'id': f"followup_{permit.get('permitnumber', 'unknown')}",
                    'type': 'PREVENTIVE_INSPECTION',
                    'priority': 'MEDIUM',
                    'title': 'Schedule Follow-up Inspection',
                    'description': f"Follow-up on {permit.get('permittype')} permit work",
                    'permit_date': permit.get('permitissuedate'),
                    'estimated_cost_min': 200,
                    'estimated_cost_max': 500,
                    'deadline': self._calculate_deadline(permit.get('permitissuedate'), 'MEDIUM'),
                    'compliance_benefit': 'Prevent future violations'
                })
        
        # Sort by priority
        priority_order = {'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3}
        actions.sort(key=lambda x: (priority_order.get(x['priority'], 3), x['estimated_cost_max']))
        
        return actions
    
    def _calculate_cost_projections(self, property_data: Dict, action_plan: List[Dict]) -> Dict[str, Any]:
        """Calculate comprehensive cost projections"""
        
        immediate_costs = {'min': 0, 'max': 0}
        annual_costs = {'min': 0, 'max': 0}
        
        # Immediate action costs
        critical_actions = [a for a in action_plan if a['priority'] in ['CRITICAL', 'HIGH']]
        for action in critical_actions:
            immediate_costs['min'] += action.get('estimated_cost_min', 0)
            immediate_costs['max'] += action.get('estimated_cost_max', 0)
        
        # Annual maintenance costs (estimate based on property data)
        total_permits = property_data['permits']['total']
        annual_costs['min'] = total_permits * 100  # Base estimate
        annual_costs['max'] = total_permits * 300
        
        return {
            'immediate_costs': immediate_costs,
            'annual_maintenance_costs': annual_costs,
            'total_projected_costs': {
                'min': immediate_costs['min'] + annual_costs['min'],
                'max': immediate_costs['max'] + annual_costs['max']
            },
            'cost_breakdown_by_category': self._breakdown_costs_by_category(action_plan),
            'roi_analysis': self._calculate_roi_analysis(immediate_costs, property_data)
        }
    
    def _analyze_compliance_trends(self, property_data: Dict) -> Dict[str, Any]:
        """Analyze compliance trends over time"""
        
        permits = property_data['permits']['records']
        violations = property_data['violations']['records']
        
        # Analyze permit activity by year
        permit_trends = {}
        for permit in permits:
            if permit.get('permitissuedate'):
                try:
                    year = permit['permitissuedate'][:4]
                    permit_trends[year] = permit_trends.get(year, 0) + 1
                except:
                    continue
        
        # Analyze violation trends
        violation_trends = {}
        for violation in violations:
            if violation.get('violationdate'):
                try:
                    year = violation['violationdate'][:4]
                    violation_trends[year] = violation_trends.get(year, 0) + 1
                except:
                    continue
        
        return {
            'permit_activity_by_year': permit_trends,
            'violation_activity_by_year': violation_trends,
            'compliance_trajectory': self._assess_compliance_trajectory(permit_trends, violation_trends),
            'maintenance_pattern': self._assess_maintenance_pattern(permits)
        }
    
    def _generate_recommendations(self, property_data: Dict, risk_assessment: Dict) -> List[Dict]:
        """Generate strategic recommendations"""
        
        recommendations = []
        
        # Risk-based recommendations
        if risk_assessment['fire_safety_risk'] > 20:
            recommendations.append({
                'category': 'Fire Safety',
                'priority': 'CRITICAL',
                'recommendation': 'Immediate fire safety system review required',
                'rationale': f"Fire safety risk score: {risk_assessment['fire_safety_risk']}",
                'estimated_impact': 'Prevent potential closure/fines'
            })
        
        if risk_assessment['structural_risk'] > 15:
            recommendations.append({
                'category': 'Structural Integrity',
                'priority': 'HIGH',
                'recommendation': 'Professional structural assessment recommended',
                'rationale': f"Structural risk score: {risk_assessment['structural_risk']}",
                'estimated_impact': 'Prevent costly emergency repairs'
            })
        
        # Proactive maintenance recommendations
        if property_data['permits']['recent'] < 2:
            recommendations.append({
                'category': 'Preventive Maintenance',
                'priority': 'MEDIUM',
                'recommendation': 'Increase preventive maintenance frequency',
                'rationale': 'Low recent permit activity suggests deferred maintenance',
                'estimated_impact': 'Reduce future violation risk'
            })
        
        return recommendations
    
    def _determine_priority_status(self, risk_assessment: Dict) -> str:
        """Determine overall priority status for property"""
        
        risk_level = risk_assessment['overall_risk_level']
        
        if risk_level == 'CRITICAL':
            return 'IMMEDIATE_ACTION_REQUIRED'
        elif risk_level == 'HIGH':
            return 'URGENT_ATTENTION_NEEDED'
        elif risk_level == 'MEDIUM':
            return 'MONITORING_REQUIRED'
        else:
            return 'ROUTINE_MAINTENANCE'
    
    def _calculate_deadline(self, reference_date: str, priority: str) -> str:
        """Calculate action deadline based on priority"""
        
        deadline_days = {
            'CRITICAL': 7,
            'HIGH': 30,
            'MEDIUM': 90,
            'LOW': 180
        }
        
        days = deadline_days.get(priority, 30)
        deadline = datetime.now() + timedelta(days=days)
        return deadline.strftime('%Y-%m-%d')
    
    def _assess_regulatory_impact(self, violation_type: str) -> str:
        """Assess potential regulatory impact"""
        
        impact_map = {
            'FIRE': 'Potential building closure, heavy fines',
            'STRUCTURAL': 'Evacuation order possible, liability issues',
            'ELECTRICAL': 'Safety hazard, potential utility disconnection',
            'MECHANICAL': 'System failure risk, comfort/health issues',
            'PLUMBING': 'Health code violations, tenant complaints',
            'HOUSING': 'Habitability issues, rental license risk',
            'ZONING': 'Use restrictions, permit complications'
        }
        
        return impact_map.get(violation_type, 'Compliance issues, potential fines')
    
    def _needs_follow_up_inspection(self, permit: Dict) -> bool:
        """Determine if permit needs follow-up inspection"""
        
        if not permit.get('permitissuedate'):
            return False
        
        try:
            date_str = permit['permitissuedate']
            if 'T' in date_str:
                date_str = date_str.split('T')[0]
            permit_date = datetime.strptime(date_str, '%Y-%m-%d')
            days_since = (datetime.now() - permit_date).days
            
            # Mechanical permits typically need follow-up after 30-90 days
            return 30 <= days_since <= 90 and permit.get('status', '').upper() == 'COMPLETED'
        except:
            return False
    
    def _breakdown_costs_by_category(self, action_plan: List[Dict]) -> Dict[str, Dict]:
        """Break down costs by violation/action category"""
        
        breakdown = {}
        
        for action in action_plan:
            category = action.get('type', 'OTHER')
            if category not in breakdown:
                breakdown[category] = {'min': 0, 'max': 0, 'count': 0}
            
            breakdown[category]['min'] += action.get('estimated_cost_min', 0)
            breakdown[category]['max'] += action.get('estimated_cost_max', 0)
            breakdown[category]['count'] += 1
        
        return breakdown
    
    def _calculate_roi_analysis(self, immediate_costs: Dict, property_data: Dict) -> Dict[str, Any]:
        """Calculate return on investment for compliance actions"""
        
        # Estimate potential savings from avoiding violations
        open_violations = property_data['violations']['open']
        potential_fines_avoided = open_violations * 1500  # Average fine estimate
        
        # Estimate insurance/liability benefits
        insurance_benefits = immediate_costs['max'] * 0.1  # 10% of investment
        
        return {
            'potential_fines_avoided': potential_fines_avoided,
            'insurance_benefits': insurance_benefits,
            'total_potential_savings': potential_fines_avoided + insurance_benefits,
            'roi_ratio': (potential_fines_avoided + insurance_benefits) / max(immediate_costs['max'], 1),
            'payback_period_months': max(immediate_costs['max'], 1) / max((potential_fines_avoided / 12), 1)
        }
    
    def _assess_compliance_trajectory(self, permit_trends: Dict, violation_trends: Dict) -> str:
        """Assess overall compliance trajectory"""
        
        recent_years = [str(year) for year in range(datetime.now().year - 2, datetime.now().year + 1)]
        
        recent_permits = sum(permit_trends.get(year, 0) for year in recent_years)
        recent_violations = sum(violation_trends.get(year, 0) for year in recent_years)
        
        if recent_permits > recent_violations * 2:
            return 'IMPROVING'
        elif recent_violations > recent_permits:
            return 'DECLINING'
        else:
            return 'STABLE'
    
    def _assess_maintenance_pattern(self, permits: List[Dict]) -> str:
        """Assess maintenance pattern"""
        
        recent_permits = [p for p in permits if self.client._is_recent_permit(p)]
        
        if len(recent_permits) > 5:
            return 'PROACTIVE'
        elif len(recent_permits) > 2:
            return 'REACTIVE'
        else:
            return 'DEFERRED'

def test_enhanced_analyzer():
    """Test the enhanced compliance analyzer"""
    
    analyzer = EnhancedComplianceAnalyzer()
    
    # Test with a real Philadelphia address
    test_address = "1400 John F Kennedy Blvd"
    
    print(f"🔍 ENHANCED COMPLIANCE ANALYSIS: {test_address}")
    print("=" * 60)
    
    report = analyzer.generate_comprehensive_report(test_address)
    
    if 'error' in report:
        print(f"❌ Error: {report['error']}")
        return
    
    # Display key findings
    compliance = report['compliance_summary']
    print(f"📊 COMPLIANCE SUMMARY:")
    print(f"   Overall Score: {compliance['overall_score']}/100")
    print(f"   Risk Level: {compliance['risk_level']}")
    print(f"   Priority Status: {compliance['priority_status']}")
    
    # Display action plan
    actions = report['action_plan']
    print(f"\n📋 ACTION PLAN ({len(actions)} items):")
    for i, action in enumerate(actions[:5], 1):
        print(f"   {i}. [{action['priority']}] {action['title']}")
        print(f"      Cost: ${action['estimated_cost_min']:,}-${action['estimated_cost_max']:,}")
        print(f"      Deadline: {action['deadline']}")
    
    # Display cost analysis
    costs = report['cost_analysis']
    immediate = costs['immediate_costs']
    print(f"\n💰 COST ANALYSIS:")
    print(f"   Immediate Costs: ${immediate['min']:,}-${immediate['max']:,}")
    print(f"   ROI Ratio: {costs['roi_analysis']['roi_ratio']:.1f}x")

if __name__ == "__main__":
    test_enhanced_analyzer()
