#!/usr/bin/env python3
"""
Philadelphia Integration Service
Integrates enhanced compliance analysis with Supabase database
"""

from enhanced_compliance_analyzer import EnhancedComplianceAnalyzer
from philly_enhanced_data_client import PhillyEnhancedDataClient
import os
import json
from datetime import datetime
from typing import Dict, List, Any
import logging

logger = logging.getLogger(__name__)

class PhiladelphiaIntegrationService:
    """
    Service to integrate Philadelphia compliance data with the platform
    """
    
    def __init__(self, supabase_url: str = None, supabase_key: str = None):
        """Initialize with Supabase configuration"""
        self.analyzer = EnhancedComplianceAnalyzer()
        self.client = PhillyEnhancedDataClient()
        
        # Supabase configuration (would be used with actual Supabase client)
        self.supabase_url = supabase_url or os.getenv('SUPABASE_URL')
        self.supabase_key = supabase_key or os.getenv('SUPABASE_ANON_KEY')
        
        # For now, we'll simulate database operations
        self.simulate_db = True
    
    def sync_property_compliance(self, address: str, property_id: str = None) -> Dict[str, Any]:
        """
        Sync property compliance data with the database
        
        Args:
            address: Property address
            property_id: Optional property UUID from database
            
        Returns:
            Sync results and compliance summary
        """
        logger.info(f"Syncing compliance data for: {address}")
        
        try:
            # Generate comprehensive compliance report
            compliance_report = self.analyzer.generate_comprehensive_report(address)
            
            if 'error' in compliance_report:
                return {'error': compliance_report['error']}
            
            # Simulate database operations
            if self.simulate_db:
                return self._simulate_database_sync(compliance_report, property_id)
            
            # In a real implementation, this would use Supabase client
            # return self._sync_with_supabase(compliance_report, property_id)
            
        except Exception as e:
            logger.error(f"Error syncing property compliance: {e}")
            return {'error': str(e)}
    
    def _simulate_database_sync(self, compliance_report: Dict, property_id: str = None) -> Dict[str, Any]:
        """Simulate database sync operations"""
        
        sync_results = {
            'property_id': property_id or f"prop_{hash(compliance_report['property_info']['address']) % 10000}",
            'sync_timestamp': datetime.now().isoformat(),
            'operations_performed': []
        }
        
        # Simulate updating compliance score
        compliance_score = compliance_report['compliance_summary']['overall_score']
        sync_results['operations_performed'].append({
            'operation': 'update_compliance_score',
            'table': 'properties',
            'new_score': compliance_score,
            'status': 'success'
        })
        
        # Simulate storing risk assessment
        risk_assessment = compliance_report['risk_assessment']
        sync_results['operations_performed'].append({
            'operation': 'store_risk_assessment',
            'table': 'compliance_risk_assessments',
            'risk_level': risk_assessment['overall_risk_level'],
            'total_risk_score': risk_assessment['total_risk_score'],
            'status': 'success'
        })
        
        # Simulate storing action plan
        action_plan = compliance_report['action_plan']
        sync_results['operations_performed'].append({
            'operation': 'store_action_plan',
            'table': 'compliance_action_plans',
            'actions_created': len(action_plan),
            'critical_actions': len([a for a in action_plan if a['priority'] == 'CRITICAL']),
            'status': 'success'
        })
        
        # Simulate storing cost analysis
        cost_analysis = compliance_report['cost_analysis']
        sync_results['operations_performed'].append({
            'operation': 'store_cost_analysis',
            'table': 'compliance_cost_tracking',
            'immediate_cost_min': cost_analysis['immediate_costs']['min'],
            'immediate_cost_max': cost_analysis['immediate_costs']['max'],
            'status': 'success'
        })
        
        # Simulate storing analytics
        sync_results['operations_performed'].append({
            'operation': 'store_analytics',
            'table': 'compliance_analytics',
            'violations_total': compliance_report['compliance_summary']['total_violations'],
            'violations_open': compliance_report['compliance_summary']['open_violations'],
            'status': 'success'
        })
        
        # Add compliance summary to results
        sync_results['compliance_summary'] = compliance_report['compliance_summary']
        sync_results['next_actions'] = compliance_report['action_plan'][:5]  # Top 5 actions
        
        return sync_results
    
    def batch_sync_properties(self, addresses: List[str]) -> Dict[str, Any]:
        """
        Batch sync multiple properties
        
        Args:
            addresses: List of property addresses
            
        Returns:
            Batch sync results
        """
        logger.info(f"Starting batch sync for {len(addresses)} properties")
        
        batch_results = {
            'total_properties': len(addresses),
            'successful_syncs': 0,
            'failed_syncs': 0,
            'sync_timestamp': datetime.now().isoformat(),
            'property_results': []
        }
        
        for address in addresses:
            try:
                result = self.sync_property_compliance(address)
                
                if 'error' in result:
                    batch_results['failed_syncs'] += 1
                    batch_results['property_results'].append({
                        'address': address,
                        'status': 'failed',
                        'error': result['error']
                    })
                else:
                    batch_results['successful_syncs'] += 1
                    batch_results['property_results'].append({
                        'address': address,
                        'status': 'success',
                        'compliance_score': result['compliance_summary']['overall_score'],
                        'risk_level': result.get('risk_level', 'UNKNOWN'),
                        'critical_actions': len([a for a in result['next_actions'] if a['priority'] == 'CRITICAL'])
                    })
                    
            except Exception as e:
                batch_results['failed_syncs'] += 1
                batch_results['property_results'].append({
                    'address': address,
                    'status': 'failed',
                    'error': str(e)
                })
        
        return batch_results
    
    def generate_compliance_dashboard_data(self, property_ids: List[str] = None) -> Dict[str, Any]:
        """
        Generate dashboard data for compliance overview
        
        Args:
            property_ids: Optional list of property IDs to include
            
        Returns:
            Dashboard data structure
        """
        # In a real implementation, this would query the database
        # For now, simulate dashboard data
        
        dashboard_data = {
            'overview': {
                'total_properties': 150,
                'properties_at_risk': 23,
                'critical_actions_pending': 45,
                'average_compliance_score': 78.5
            },
            'risk_distribution': {
                'CRITICAL': 8,
                'HIGH': 15,
                'MEDIUM': 42,
                'LOW': 85
            },
            'violation_categories': {
                'FIRE': 12,
                'STRUCTURAL': 8,
                'ELECTRICAL': 15,
                'MECHANICAL': 18,
                'PLUMBING': 22,
                'HOUSING': 35,
                'ZONING': 5
            },
            'cost_projections': {
                'immediate_costs_total': {'min': 125000, 'max': 450000},
                'annual_maintenance_total': {'min': 85000, 'max': 220000}
            },
            'recent_activity': {
                'new_violations_this_month': 12,
                'permits_issued_this_month': 28,
                'actions_completed_this_month': 15
            }
        }
        
        return dashboard_data
    
    def export_compliance_report(self, address: str, format: str = 'json') -> str:
        """
        Export compliance report in specified format
        
        Args:
            address: Property address
            format: Export format ('json', 'csv', 'pdf')
            
        Returns:
            File path of exported report
        """
        compliance_report = self.analyzer.generate_comprehensive_report(address)
        
        if 'error' in compliance_report:
            raise Exception(f"Cannot export report: {compliance_report['error']}")
        
        # Generate filename
        safe_address = address.replace(' ', '_').replace(',', '').replace('/', '_')
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"compliance_report_{safe_address}_{timestamp}.{format}"
        filepath = os.path.join('reports', filename)
        
        # Ensure reports directory exists
        os.makedirs('reports', exist_ok=True)
        
        if format == 'json':
            with open(filepath, 'w') as f:
                json.dump(compliance_report, f, indent=2, default=str)
        
        # For CSV and PDF, would implement additional formatting
        # elif format == 'csv':
        #     self._export_to_csv(compliance_report, filepath)
        # elif format == 'pdf':
        #     self._export_to_pdf(compliance_report, filepath)
        
        return filepath

def demo_integration_service():
    """Demonstrate the integration service"""
    
    service = PhiladelphiaIntegrationService()
    
    print("🔗 PHILADELPHIA INTEGRATION SERVICE DEMO")
    print("=" * 60)
    
    # Test single property sync
    test_address = "1400 John F Kennedy Blvd"
    print(f"📍 Syncing property: {test_address}")
    
    sync_result = service.sync_property_compliance(test_address)
    
    if 'error' in sync_result:
        print(f"❌ Sync failed: {sync_result['error']}")
        return
    
    print(f"✅ Sync completed successfully!")
    print(f"   Property ID: {sync_result['property_id']}")
    print(f"   Compliance Score: {sync_result['compliance_summary']['overall_score']}/100")
    print(f"   Risk Level: {sync_result['compliance_summary']['risk_level']}")
    print(f"   Operations Performed: {len(sync_result['operations_performed'])}")
    
    # Test batch sync
    print(f"\n📊 Testing batch sync...")
    test_addresses = [
        "1400 John F Kennedy Blvd",
        "1234 Market St",
        "123 S Broad St"
    ]
    
    batch_result = service.batch_sync_properties(test_addresses)
    print(f"   Batch Results: {batch_result['successful_syncs']}/{batch_result['total_properties']} successful")
    
    # Test dashboard data
    print(f"\n📈 Generating dashboard data...")
    dashboard = service.generate_compliance_dashboard_data()
    print(f"   Total Properties: {dashboard['overview']['total_properties']}")
    print(f"   Properties at Risk: {dashboard['overview']['properties_at_risk']}")
    print(f"   Average Compliance Score: {dashboard['overview']['average_compliance_score']}")
    
    # Test export
    print(f"\n📄 Exporting compliance report...")
    try:
        report_path = service.export_compliance_report(test_address)
        print(f"   Report exported to: {report_path}")
    except Exception as e:
        print(f"   Export failed: {e}")

if __name__ == "__main__":
    demo_integration_service()
