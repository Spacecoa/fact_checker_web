"""
Web Adapter for Fact-Checking Program
This module provides functions to integrate the fact-checking program with the web application.
"""

import sys
import os
import json
from datetime import datetime

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(__file__))

from news_collector.rss_collector import RSSCollector
from fact_checker_core.checker import FactChecker
from reports.generator import ReportGenerator


def run_fact_checking(num_news=10, google_api_key=None, output_dir="reports"):
    """
    Run the fact-checking program and return results as JSON
    """
    try:
        print("[INFO] Starting fact-checking process...")
        
        # Collect news
        print("[INFO] Collecting news...")
        collector = RSSCollector()
        df_news = collector.collect_news()
        print(f"[INFO] Collected {len(df_news)} news items")
        
        if df_news.empty:
            return {"success": False, "error": "No news collected"}
        
        # Limit number of news
        df_news = df_news.head(num_news)
        
        # Process news
        print("[INFO] Starting fact-checking...")
        checker = FactChecker(google_api_key=google_api_key)
        
        processed_results = []
        for index, row in df_news.iterrows():
            news_item = row.to_dict()
            result = checker.process_news_item(news_item)
            processed_results.append(result)
            print(f"[INFO] Processed: {result.get('news_title', 'Unknown')[:50]}...")
        
        # Generate reports
        print("[INFO] Generating reports...")
        os.makedirs(output_dir, exist_ok=True)
        generator = ReportGenerator(output_dir=output_dir)
        
        json_report = generator.generate_json_report(processed_results)
        md_report = generator.generate_markdown_report(processed_results)
        csv_report = generator.generate_csv_summary(processed_results)
        
        print(f"[INFO] Reports generated:")
        print(f"  - JSON: {json_report}")
        print(f"  - Markdown: {md_report}")
        print(f"  - CSV: {csv_report}")
        
        return {
            "success": True,
            "processed_count": len(processed_results),
            "results": processed_results,
            "reports": {
                "json": json_report,
                "markdown": md_report,
                "csv": csv_report
            }
        }
    
    except Exception as e:
        print(f"[ERROR] Fact-checking failed: {str(e)}")
        return {"success": False, "error": str(e)}


def send_to_web_api(results, api_url="http://localhost:3000/api/webhook/fact-check"):
    """
    Send processed results to the web application API
    """
    import requests
    
    try:
        print(f"[INFO] Sending results to web API: {api_url}")
        
        for result in results:
            payload = {
                "title": result.get("news_title"),
                "mainClaim": result.get("main_claim"),
                "source": result.get("source", "Unknown"),
                "newsLink": result.get("link"),
                "summary": result.get("summary"),
                "llmAnalysis": result.get("llm_analysis"),
                "keywords": result.get("keywords"),
                "isVerified": result.get("is_verified", False),
                "factCheckResults": result.get("fact_check_results"),
                "verificationStatus": "verified" if result.get("is_verified") else "unverified"
            }
            
            response = requests.post(api_url, json=payload)
            if response.status_code == 201:
                print(f"[INFO] Successfully sent: {result.get('news_title', 'Unknown')[:50]}...")
            else:
                print(f"[WARNING] Failed to send report: {response.status_code}")
        
        return True
    
    except Exception as e:
        print(f"[ERROR] Failed to send results to API: {str(e)}")
        return False


if __name__ == "__main__":
    # Example usage
    results = run_fact_checking(num_news=5)
    if results["success"]:
        print(f"\n✅ Fact-checking completed! Processed {results['processed_count']} items.")
    else:
        print(f"\n❌ Fact-checking failed: {results['error']}")
