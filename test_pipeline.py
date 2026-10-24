import unittest
from backend.app.engine.analysis import calculate_stats, analyze_asset_health

class TestMechShieldPipeline(unittest.TestCase):
    def test_stats_calculation(self):
        vals = [10.0, 10.0, 10.0, 10.0]
        mean, std = calculate_stats(vals)
        self.assertEqual(mean, 10.0)
        self.assertEqual(std, 0.0)

    def test_health_healthy_asset(self):
        asset = {"id": "test-motor", "name": "Test Motor"}
        template = {
            "sensors": {
                "vibration": {"nominal": 2.0, "max_safe": 4.5, "critical_high": 7.1, "unit": "mm/s"}
            }
        }
        telemetry = {
            "vibration": [{"value": 2.05}, {"value": 2.10}, {"value": 2.08}]
        }
        res = analyze_asset_health(asset, template, telemetry)
        self.assertEqual(res["status"], "HEALTHY")
        self.assertGreaterEqual(res["health_score"], 90.0)

    def test_health_critical_breach(self):
        asset = {"id": "test-motor", "name": "Test Motor"}
        template = {
            "sensors": {
                "vibration": {"nominal": 2.0, "max_safe": 4.5, "critical_high": 7.1, "unit": "mm/s"}
            }
        }
        telemetry = {
            "vibration": [{"value": 2.0}, {"value": 2.1}, {"value": 8.5}]
        }
        res = analyze_asset_health(asset, template, telemetry)
        self.assertEqual(res["status"], "CRITICAL")
        self.assertEqual(len(res["anomalies"]), 1)

if __name__ == "__main__":
    unittest.main()
