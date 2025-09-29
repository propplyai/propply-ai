#!/usr/bin/env python3
"""
Compliance Platform Data Optimization Strategy
Enhances Philadelphia data for better compliance management
"""

from philly_enhanced_data_client import PhillyEnhancedDataClient
from datetime import datetime, timedelta
import json
from typing import Dict, List, Any

class ComplianceOptimizer:
    """
    Optimizes Philadelphia L&I data for compliance platform use
    """
    
    def __init__(self):
        self.client = PhillyEnhancedDataClient()
        
        # Compliance risk weights
        self.violation_risk_weights = {
            'FIRE': 25,      # Fire code violations are critical
            'STRUCTURAL': 20, # Structural issues are high risk
            'ELECTRICAL': 15, # Electrical hazards
            'MECHANICAL': 12, # HVAC/boiler issues
            'PLUMBING': 8,   # Plumbing violations
            'HOUSING': 5,    # General housing code
            'ZONING': 3      # Zoning violations
        }
        
        # Certification priority levels
        self.certification_priorities = {
            'sprinkler': 'CRITICAL',
            'fire_alarm': 'CRITICAL', 
            'facade': 'HIGH',
            'fire_escape': 'HIGH',
            'standpipe': 'MEDIUM',
            'smoke_control': 'MEDIUM',
            'damper': 'LOW'
        }
    
    def enhance_compliance_scoring(self, property_data: Dict) -> Dict[str, Any]:
        """
        Enhanced compliance scoring based on Philadelphia-specific factors
        """
        violations = property_data.get('violations', [])
        permits = property_data.get('permits', [])
        certifications = property_data.get('certifications', [])
        
        # Base score
        compliance_score = 100
        
        # Analyze violations by severity and type
        violation_analysis = self._analyze_violations(violations)
        compliance_score -= violation_analysis['total_deduction']
        
        # Analyze permit compliance
        permit_analysis = self._analyze_permits(permits)
        compliance_score += permit_analysis['bonus_points']
        compliance_score -= permit_analysis['penalty_points']
        
        # Analyze certification status
        cert_analysis = self._analyze_certifications(certifications)
        compliance_score -= cert_analysis['deduction_points']
        
        # Calculate risk factors
        risk_factors = self._calculate_risk_factors(violations, permits, certifications)
        
        # Determine next actions
        next_actions = self._generate_next_actions(violations, permits, certifications)
        
        return {
            'enhanced_compliance_score': max(0, min(100, compliance_score)),
            'violation_analysis': violation_analysis,
            'permit_analysis': permit_analysis,
            'certification_analysis': cert_analysis,
            'risk_factors': risk_factors,
            'next_actions': next_actions,
            'priority_level': self._determine_priority_level(compliance_score, risk_factors)
        }
    
    def _analyze_violations(self, violations: List[Dict]) -> Dict[str, Any]:
        """Analyze violations for compliance impact"""
        
        open_violations = [v for v in violations if v.get('status', '').upper() in ['OPEN', 'ACTIVE']]
        
        analysis = {
            'total_violations': len(violations),
            'open_violations': len(open_violations),
            'violations_by_type': {},
            'critical_violations': [],
            'total_deduction': 0
        }
        
        for violation in open_violations:
            violation_type = self._categorize_violation(violation.get('violationtype', ''))
            
            if violation_type not in analysis['violations_by_type']:
                analysis['violations_by_type'][violation_type] = 0
            analysis['violations_by_type'][violation_type] += 1
            
            # Calculate deduction based on violation type
            deduction = self.violation_risk_weights.get(violation_type, 5)
            analysis['total_deduction'] += deduction
            
            # Mark critical violations
            if violation_type in ['FIRE', 'STRUCTURAL']:
                analysis['critical_violations'].append({
                    'id': violation.get('violationid'),
                    'type': violation_type,
                    'description': violation.get('violationtype'),
                    'date': violation.get('violationdate'),
                    'risk_level': 'CRITICAL'
                })
        
        return analysis
    
    def _analyze_permits(self, permits: List[Dict]) -> Dict[str, Any]:
        """Analyze permits for compliance benefits and issues"""
        
        recent_permits = [p for p in permits if p.get('permitissuedate') and 
                         p.get('permitissuedate') >= (datetime.now() - timedelta(days=365)).strftime('%Y-%m-%d')]
        
        expired_permits = [p for p in permits if p.get('status', '').upper() == 'EXPIRED']
        
        analysis = {
            'total_permits': len(permits),
            'recent_permits': len(recent_permits),
            'expired_permits': len(expired_permits),
            'permits_by_type': {},
            'bonus_points': 0,
            'penalty_points': 0
        }
        
        # Categorize permits
        for permit in permits:
            permit_type = permit.get('permittype', 'Unknown')
            if permit_type not in analysis['permits_by_type']:
                analysis['permits_by_type'][permit_type] = 0
            analysis['permits_by_type'][permit_type] += 1
        
        # Bonus for recent permits (shows active maintenance)
        analysis['bonus_points'] = min(len(recent_permits) * 2, 10)
        
        # Penalty for expired permits
        analysis['penalty_points'] = len(expired_permits) * 3
        
        return analysis
    
    def _analyze_certifications(self, certifications: List[Dict]) -> Dict[str, Any]:
        """Analyze building certifications for compliance"""
        
        analysis = {
            'total_certifications': len(certifications),
            'expired_certifications': [],
            'missing_critical_certs': [],
            'deduction_points': 0
        }
        
        # Check for expired certifications
        current_date = datetime.now()
        for cert in certifications:
            if cert.get('expiration_date'):
                exp_date = datetime.strptime(cert['expiration_date'], '%Y-%m-%d')
                if exp_date < current_date:
                    analysis['expired_certifications'].append(cert)
                    
                    # Higher penalty for critical certifications
                    cert_type = cert.get('certification_type', '').lower()
                    if any(critical in cert_type for critical in ['sprinkler', 'fire', 'alarm']):
                        analysis['deduction_points'] += 15
                    else:
                        analysis['deduction_points'] += 5
        
        return analysis
    
    def _calculate_risk_factors(self, violations: List[Dict], permits: List[Dict], 
                               certifications: List[Dict]) -> Dict[str, Any]:
        """Calculate comprehensive risk factors"""
        
        risk_factors = {
            'fire_safety_risk': 0,
            'structural_risk': 0,
            'mechanical_risk': 0,
            'overall_risk': 'LOW'
        }
        
        # Fire safety risk
        fire_violations = [v for v in violations if 'FIRE' in v.get('violationtype', '').upper()]
        expired_fire_certs = [c for c in certifications 
                             if 'fire' in c.get('certification_type', '').lower() 
                             and self._is_expired(c.get('expiration_date'))]
        
        risk_factors['fire_safety_risk'] = len(fire_violations) * 20 + len(expired_fire_certs) * 15
        
        # Structural risk
        structural_violations = [v for v in violations 
                               if any(term in v.get('violationtype', '').upper() 
                                     for term in ['STRUCTURAL', 'FACADE', 'BUILDING'])]
        risk_factors['structural_risk'] = len(structural_violations) * 15
        
        # Mechanical risk (boilers, HVAC, etc.)
        mechanical_violations = [v for v in violations 
                               if any(term in v.get('violationtype', '').upper() 
                                     for term in ['MECHANICAL', 'BOILER', 'HVAC'])]
        risk_factors['mechanical_risk'] = len(mechanical_violations) * 10
        
        # Overall risk level
        total_risk = (risk_factors['fire_safety_risk'] + 
                     risk_factors['structural_risk'] + 
                     risk_factors['mechanical_risk'])
        
        if total_risk >= 50:
            risk_factors['overall_risk'] = 'CRITICAL'
        elif total_risk >= 25:
            risk_factors['overall_risk'] = 'HIGH'
        elif total_risk >= 10:
            risk_factors['overall_risk'] = 'MEDIUM'
        else:
            risk_factors['overall_risk'] = 'LOW'
        
        return risk_factors
    
    def _generate_next_actions(self, violations: List[Dict], permits: List[Dict], 
                              certifications: List[Dict]) -> List[Dict]:
        """Generate prioritized next actions for compliance"""
        
        actions = []
        
        # Critical violations first
        open_violations = [v for v in violations if v.get('status', '').upper() in ['OPEN', 'ACTIVE']]
        for violation in open_violations:
            if 'FIRE' in violation.get('violationtype', '').upper():
                actions.append({
                    'priority': 'CRITICAL',
                    'action': 'Resolve Fire Code Violation',
                    'description': violation.get('violationtype'),
                    'deadline': self._calculate_deadline(violation.get('violationdate'), 'CRITICAL'),
                    'estimated_cost': self._estimate_violation_cost(violation),
                    'type': 'VIOLATION_RESOLUTION'
                })
        
        # Expired certifications
        for cert in certifications:
            if self._is_expired(cert.get('expiration_date')):
                actions.append({
                    'priority': 'HIGH',
                    'action': 'Renew Expired Certification',
                    'description': cert.get('certification_type'),
                    'deadline': 'Immediate',
                    'estimated_cost': self._estimate_certification_cost(cert),
                    'type': 'CERTIFICATION_RENEWAL'
                })
        
        # Preventive maintenance based on permits
        mechanical_permits = [p for p in permits if 'MECHANICAL' in p.get('permittype', '').upper()]
        if mechanical_permits:
            last_mechanical = max(mechanical_permits, key=lambda x: x.get('permitissuedate', ''))
            if self._needs_follow_up_inspection(last_mechanical):
                actions.append({
                    'priority': 'MEDIUM',
                    'action': 'Schedule Follow-up Inspection',
                    'description': f"Follow-up on {last_mechanical.get('permittype')} work",
                    'deadline': self._calculate_deadline(last_mechanical.get('permitissuedate'), 'MEDIUM'),
                    'estimated_cost': '$200-500',
                    'type': 'INSPECTION'
                })
        
        # Sort by priority
        priority_order = {'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3}
        actions.sort(key=lambda x: priority_order.get(x['priority'], 3))
        
        return actions[:10]  # Return top 10 actions
    
    def _categorize_violation(self, violation_description: str) -> str:
        """Categorize violation by type for risk assessment"""
        
        description_upper = violation_description.upper()
        
        if any(term in description_upper for term in ['FIRE', 'SMOKE', 'ALARM', 'SPRINKLER', 'EXTINGUISHER']):
            return 'FIRE'
        elif any(term in description_upper for term in ['STRUCTURAL', 'FACADE', 'FOUNDATION', 'BEAM']):
            return 'STRUCTURAL'
        elif any(term in description_upper for term in ['ELECTRICAL', 'WIRING', 'OUTLET']):
            return 'ELECTRICAL'
        elif any(term in description_upper for term in ['MECHANICAL', 'BOILER', 'HVAC', 'HEATING']):
            return 'MECHANICAL'
        elif any(term in description_upper for term in ['PLUMBING', 'WATER', 'PIPE']):
            return 'PLUMBING'
        elif any(term in description_upper for term in ['HOUSING', 'OCCUPANCY']):
            return 'HOUSING'
        elif any(term in description_upper for term in ['ZONING', 'USE']):
            return 'ZONING'
        else:
            return 'OTHER'
    
    def _determine_priority_level(self, compliance_score: float, risk_factors: Dict) -> str:
        """Determine overall priority level for the property"""
        
        if compliance_score < 60 or risk_factors['overall_risk'] == 'CRITICAL':
            return 'CRITICAL'
        elif compliance_score < 75 or risk_factors['overall_risk'] == 'HIGH':
            return 'HIGH'
        elif compliance_score < 85 or risk_factors['overall_risk'] == 'MEDIUM':
            return 'MEDIUM'
        else:
            return 'LOW'
    
    def _is_expired(self, date_str: str) -> bool:
        """Check if a date is expired"""
        if not date_str:
            return False
        try:
            exp_date = datetime.strptime(date_str, '%Y-%m-%d')
            return exp_date < datetime.now()
        except:
            return False
    
    def _calculate_deadline(self, reference_date: str, priority: str) -> str:
        """Calculate deadline based on priority and reference date"""
        
        deadline_days = {
            'CRITICAL': 7,
            'HIGH': 30,
            'MEDIUM': 90,
            'LOW': 180
        }
        
        days = deadline_days.get(priority, 30)
        deadline = datetime.now() + timedelta(days=days)
        return deadline.strftime('%Y-%m-%d')
    
    def _estimate_violation_cost(self, violation: Dict) -> str:
        """Estimate cost to resolve violation"""
        
        violation_type = self._categorize_violation(violation.get('violationtype', ''))
        
        cost_estimates = {
            'FIRE': '$1,000-5,000',
            'STRUCTURAL': '$5,000-25,000',
            'ELECTRICAL': '$500-3,000',
            'MECHANICAL': '$1,000-8,000',
            'PLUMBING': '$300-2,000',
            'HOUSING': '$200-1,500',
            'ZONING': '$100-1,000'
        }
        
        return cost_estimates.get(violation_type, '$500-2,000')
    
    def _estimate_certification_cost(self, certification: Dict) -> str:
        """Estimate cost to renew certification"""
        
        cert_type = certification.get('certification_type', '').lower()
        
        if 'sprinkler' in cert_type:
            return '$800-2,500'
        elif 'fire' in cert_type:
            return '$500-1,500'
        elif 'facade' in cert_type:
            return '$2,000-8,000'
        else:
            return '$300-1,000'
    
    def _needs_follow_up_inspection(self, permit: Dict) -> bool:
        """Determine if permit needs follow-up inspection"""
        
        if not permit.get('permitissuedate'):
            return False
        
        permit_date = datetime.strptime(permit['permitissuedate'], '%Y-%m-%d')
        days_since = (datetime.now() - permit_date).days
        
        # Mechanical permits typically need follow-up after 30-90 days
        return 30 <= days_since <= 90 and permit.get('status', '').upper() == 'COMPLETED'

def demonstrate_compliance_optimization():
    """Demonstrate the compliance optimization functionality"""
    
    print("🎯 COMPLIANCE PLATFORM DATA OPTIMIZATION")
    print("=" * 60)
    
    optimizer = ComplianceOptimizer()
    client = PhillyEnhancedDataClient()
    
    # Test with a property that has various compliance issues
    test_address = "1400 John F Kennedy Blvd"
    
    print(f"📍 Analyzing: {test_address}")
    print("-" * 40)
    
    # Get comprehensive property data
    property_data = client.get_comprehensive_property_data(test_address)
    
    if 'error' in property_data:
        print(f"❌ Error: {property_data['error']}")
        return
    
    # Apply compliance optimization
    optimized_data = optimizer.enhance_compliance_scoring(property_data)
    
    # Display results
    print(f"\n📊 ENHANCED COMPLIANCE ANALYSIS:")
    print(f"   Enhanced Score: {optimized_data['enhanced_compliance_score']}/100")
    print(f"   Priority Level: {optimized_data['priority_level']}")
    print(f"   Overall Risk: {optimized_data['risk_factors']['overall_risk']}")
    
    # Violation analysis
    violation_analysis = optimized_data['violation_analysis']
    print(f"\n⚠️ VIOLATION ANALYSIS:")
    print(f"   Total Violations: {violation_analysis['total_violations']}")
    print(f"   Open Violations: {violation_analysis['open_violations']}")
    print(f"   Critical Violations: {len(violation_analysis['critical_violations'])}")
    print(f"   Score Deduction: -{violation_analysis['total_deduction']} points")
    
    # Risk factors
    risk_factors = optimized_data['risk_factors']
    print(f"\n🔥 RISK ASSESSMENT:")
    print(f"   Fire Safety Risk: {risk_factors['fire_safety_risk']}")
    print(f"   Structural Risk: {risk_factors['structural_risk']}")
    print(f"   Mechanical Risk: {risk_factors['mechanical_risk']}")
    
    # Next actions
    next_actions = optimized_data['next_actions']
    print(f"\n📋 NEXT ACTIONS ({len(next_actions)} recommended):")
    for i, action in enumerate(next_actions[:5], 1):
        print(f"   {i}. [{action['priority']}] {action['action']}")
        print(f"      Description: {action['description']}")
        print(f"      Deadline: {action['deadline']}")
        print(f"      Est. Cost: {action['estimated_cost']}")
        print()

if __name__ == "__main__":
    demonstrate_compliance_optimization()
