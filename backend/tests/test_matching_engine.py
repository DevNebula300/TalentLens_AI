from app.services.matching_engine import ResumeMatchingEngine

# ============ TESTING DATA ============

# --- JOB REQUIREMENTS ---

JOB_REQUIREMENTS = {
    # Technical Roles
    "data_scientist": {
        "required_skills": ["Python", "Machine Learning", "Deep Learning", "SQL", "Statistics", 
                           "Data Visualization", "TensorFlow", "PyTorch", "Pandas", "NumPy"],
        "required_years": 4,
        "keywords": ["predictive modeling", "feature engineering", "data pipeline", "ETL", "MLOps"]
    },
    
    "backend_engineer": {
        "required_skills": ["Python", "Java", "SQL", "AWS", "Docker", "Kubernetes", 
                           "REST APIs", "Microservices", "PostgreSQL", "Redis", "Kafka"],
        "required_years": 5,
        "keywords": ["distributed systems", "cloud", "CI/CD", "scalable", "high performance"]
    },
    
    "frontend_developer": {
        "required_skills": ["JavaScript", "React", "TypeScript", "CSS", "HTML", "Redux", 
                           "Node.js", "Webpack", "GraphQL", "Jest"],
        "required_years": 3,
        "keywords": ["responsive design", "SPA", "user interface", "UX", "component library"]
    },
    
    "devops_engineer": {
        "required_skills": ["AWS", "Docker", "Kubernetes", "Terraform", "Python", "Bash", 
                           "CI/CD", "Jenkins", "Git", "Ansible", "Prometheus", "Grafana"],
        "required_years": 6,
        "keywords": ["infrastructure as code", "monitoring", "automation", "cloud", "security"]
    },
    
    "product_manager": {
        "required_skills": ["Product Strategy", "Roadmapping", "Agile", "JIRA", "Data Analysis", 
                           "User Research", "A/B Testing", "Wireframing", "Communication"],
        "required_years": 5,
        "keywords": ["product vision", "stakeholder management", "prioritization", "MVP", "go-to-market"]
    },
    
    # Leadership Roles
    "engineering_manager": {
        "required_skills": ["Leadership", "Project Management", "Agile", "Scrum", "Technical Architecture", 
                           "Mentoring", "Hiring", "Budget Management", "Strategic Planning"],
        "required_years": 10,
        "keywords": ["team building", "performance reviews", "cross-functional", "resource allocation"]
    },
    
    "cto": {
        "required_skills": ["Technology Strategy", "Team Leadership", "System Architecture", "Cloud Computing", 
                           "Security", "Innovation", "Budgeting", "Stakeholder Management", "Data Governance"],
        "required_years": 15,
        "keywords": ["digital transformation", "scalability", "technology vision", "enterprise", "roadmap"]
    },
    
    # Entry Level Roles
    "junior_developer": {
        "required_skills": ["Python", "JavaScript", "HTML", "CSS", "SQL", "Git", "REST APIs"],
        "required_years": 1,
        "keywords": ["learning", "growth", "team player", "problem solving", "collaboration"]
    },
    
    "intern_data_scientist": {
        "required_skills": ["Python", "Statistics", "SQL", "Data Analysis", "Machine Learning"],
        "required_years": 0,
        "keywords": ["internship", "learning", "support", "data cleaning", "exploratory analysis"]
    },
}

# --- CANDIDATE PROFILES ---

CANDIDATES = {
    "alice_senior_data_scientist": {
        "id": "CS001",
        "name": "Alice Johnson",
        "skills": ["Python", "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", 
                  "NumPy", "Pandas", "SQL", "Statistics", "Data Visualization", "Airflow"],
        "resume_text": """
        Senior Data Scientist with 7+ years of experience in machine learning and deep learning.
        Led predictive modeling initiatives for financial services, improving accuracy by 25%.
        Built scalable data pipelines using Python and Airflow.
        Expert in feature engineering and model deployment.
        Ph.D. in Machine Learning.
        """
    },
    
    "bob_backend_lead": {
        "id": "CS002",
        "name": "Bob Williams",
        "skills": ["Python", "Java", "AWS", "Docker", "Kubernetes", "PostgreSQL", 
                  "Redis", "Kafka", "Microservices", "REST APIs"],
        "resume_text": """
        Backend Engineering Lead with 9+ years of experience building distributed systems.
        Led a team of 12 engineers on a microservices architecture serving 10M+ users.
        Expert in cloud infrastructure and CI/CD pipelines.
        Scaled systems to handle 100K+ concurrent requests.
        """
    },
    
    "carol_frontend_dev": {
        "id": "CS003",
        "name": "Carol Martinez",
        "skills": ["JavaScript", "React", "TypeScript", "CSS", "HTML", "Redux", 
                  "Webpack", "Jest", "GraphQL", "Next.js"],
        "resume_text": """
        Frontend Developer with 4+ years of experience building responsive web applications.
        Built a component library used across 5+ teams.
        Improved application performance by 40% through code splitting and lazy loading.
        Led the migration from class components to hooks.
        """
    },
    
    "david_devops_architect": {
        "id": "CS004",
        "name": "David Chen",
        "skills": ["AWS", "Docker", "Kubernetes", "Terraform", "Python", "Bash", 
                  "Jenkins", "Git", "Ansible", "Prometheus", "Grafana", "Helm"],
        "resume_text": """
        DevOps Architect with 8+ years of experience in cloud infrastructure and automation.
        Designed and implemented Kubernetes clusters for 50+ microservices.
        Reduced deployment time from 2 hours to 15 minutes through CI/CD automation.
        Implemented comprehensive monitoring and alerting systems.
        AWS Certified Solutions Architect.
        """
    },
    
    "emma_product_lead": {
        "id": "CS005",
        "name": "Emma Thompson",
        "skills": ["Product Strategy", "Roadmapping", "Agile", "JIRA", "Data Analysis", 
                  "User Research", "A/B Testing", "Wireframing", "Communication"],
        "resume_text": """
        Senior Product Manager with 6+ years of experience launching B2B SaaS products.
        Led the development of a product roadmap that increased user engagement by 35%.
        Managed cross-functional teams of 20+ engineers, designers, and marketers.
        Launched 3 major products from conception to market.
        """
    },
    
    "frank_engineering_director": {
        "id": "CS006",
        "name": "Frank Rodriguez",
        "skills": ["Leadership", "Project Management", "Agile", "Scrum", "Technical Architecture", 
                  "Mentoring", "Hiring", "Budget Management", "Strategic Planning", "Cloud Computing"],
        "resume_text": """
        Engineering Director with 12+ years of experience leading engineering organizations.
        Managed a team of 80+ engineers across 6 teams.
        Scaled the engineering organization from 15 to 80 people in 3 years.
        Reduced attrition from 25% to 8% through mentoring and career development programs.
        Led the company's cloud migration initiative.
        """
    },
    
    "grace_junior_dev": {
        "id": "CS007",
        "name": "Grace Kim",
        "skills": ["Python", "JavaScript", "HTML", "CSS", "SQL", "Git", "React"],
        "resume_text": """
        Computer Science graduate with 1+ year of internship experience.
        Built a full-stack web application using React and Node.js.
        Strong foundation in data structures and algorithms.
        Eager to learn and contribute to a collaborative team.
        """
    },
    
    "henry_intern": {
        "id": "CS008",
        "name": "Henry Park",
        "skills": ["Python", "Statistics", "SQL", "Data Analysis", "Pandas", "Matplotlib"],
        "resume_text": """
        MS in Statistics candidate with internship experience in data analysis.
        Conducted exploratory data analysis on customer datasets.
        Built predictive models for customer churn prediction.
        Strong communication and presentation skills.
        """
    },
    
    "irene_fullstack": {
        "id": "CS009",
        "name": "Irene Okafor",
        "skills": ["Python", "JavaScript", "React", "Node.js", "MongoDB", "AWS", 
                  "Docker", "REST APIs", "GraphQL", "TypeScript"],
        "resume_text": """
        Full-Stack Developer with 5+ years of experience.
        Built end-to-end solutions for enterprise clients.
        Experience with both relational and NoSQL databases.
        Implemented authentication and authorization systems.
        """
    },
}

# --- TEST SCENARIOS ---

TEST_SCENARIOS = {
    "scenario_1": {
        "name": "Data Scientist Role vs Multiple Candidates",
        "job_key": "data_scientist",
        "candidate_ids": ["alice_senior_data_scientist", "bob_backend_lead", "carol_frontend_dev", 
                         "grace_junior_dev", "henry_intern"],
        "description": "Testing which candidate best matches a Data Scientist role"
    },
    
    "scenario_2": {
        "name": "Backend Engineer vs Fullstack vs Frontend",
        "job_key": "backend_engineer",
        "candidate_ids": ["bob_backend_lead", "irene_fullstack", "carol_frontend_dev"],
        "description": "Testing the difference between backend, fullstack, and frontend candidates"
    },
    
    "scenario_3": {
        "name": "Leadership Role Comparison",
        "job_key": "engineering_manager",
        "candidate_ids": ["frank_engineering_director", "alice_senior_data_scientist", 
                         "bob_backend_lead", "emma_product_lead"],
        "description": "Testing how leadership roles evaluate non-traditional candidates"
    },
    
    "scenario_4": {
        "name": "Entry Level vs Senior for Junior Role",
        "job_key": "junior_developer",
        "candidate_ids": ["grace_junior_dev", "henry_intern", "bob_backend_lead"],
        "description": "Testing if overqualified candidates still score well for junior roles"
    },
    
    "scenario_5": {
        "name": "DevOps Role Candidate Comparison",
        "job_key": "devops_engineer",
        "candidate_ids": ["david_devops_architect", "bob_backend_lead", "irene_fullstack"],
        "description": "Testing DevOps-specific role matching"
    },
    
    "scenario_6": {
        "name": "Product Management Role",
        "job_key": "product_manager",
        "candidate_ids": ["emma_product_lead", "frank_engineering_director", "alice_senior_data_scientist"],
        "description": "Testing how well technical candidates match a product role"
    },
    
    "scenario_7": {
        "name": "CTO Search - Leadership Focus",
        "job_key": "cto",
        "candidate_ids": ["frank_engineering_director", "bob_backend_lead", "david_devops_architect"],
        "description": "Testing CTO role matching with leadership and technical candidates"
    },
    
    "scenario_8": {
        "name": "Intern Position - Future Potential",
        "job_key": "intern_data_scientist",
        "candidate_ids": ["henry_intern", "grace_junior_dev", "alice_senior_data_scientist"],
        "description": "Testing if senior candidates are appropriately evaluated for intern roles"
    },
}


# ============ RUN TESTS ============
# ============ RUN TESTS ============

def print_stats_breakdown(result, prefix="   "):
    print(f"\n{prefix}Score Breakdown:")
    if "score_breakdown" in result:
        for category, score in result["score_breakdown"].items():
            print(f"{prefix}   {category:<18}: {score * 100:5.1f}%")
            
    if result.get("weight_explanations"):
        print(f"\n{prefix}Weight Adjustments (Reasoning):")
        for category, explanation in result["weight_explanations"].items():
            print(f"{prefix}   {category:<18}: {explanation}")
            
    print(f"\n{prefix}Matched Skills: {', '.join(result.get('matched_skills', [])) if result.get('matched_skills') else 'None'}")
    print(f"{prefix}Missing Skills: {', '.join(result.get('missing_skills', [])) if result.get('missing_skills') else 'None'}")
    print(f"{prefix}Additional Skills: {', '.join(result.get('additional_skills', [])) if result.get('additional_skills') else 'None'}")
    
    print(f"\n{prefix}Strengths:")
    if result.get("strengths"):
        for s in result["strengths"]:
            print(f"{prefix}   + {s}")
    else:
        print(f"{prefix}   None")
        
    print(f"\n{prefix}Gaps:")
    if result.get("gaps"):
        for g in result["gaps"]:
            print(f"{prefix}   - {g}")
    else:
        print(f"{prefix}   None")

def run_all_tests():
    """Run all test scenarios and display results."""
    engine = ResumeMatchingEngine()
    
    print("=" * 100)
    print("RESUME MATCHING ENGINE - COMPREHENSIVE TESTS")
    print("=" * 100)
    print()
    
    # Test 1: Static Weights (Standard)
    print("\n" + "=" * 80)
    print("TEST 1: STATIC WEIGHTS (Standard 40/30/20/10)")
    print("=" * 80)
    
    static_test = engine.calculate_overall_score(
        required_skills=JOB_REQUIREMENTS["data_scientist"]["required_skills"],
        candidate_skills=CANDIDATES["alice_senior_data_scientist"]["skills"],
        required_experience_years=JOB_REQUIREMENTS["data_scientist"]["required_years"],
        candidate_resume_text=CANDIDATES["alice_senior_data_scientist"]["resume_text"],
        required_keywords=JOB_REQUIREMENTS["data_scientist"]["keywords"],
        use_dynamic_weights=False
    )
    
    print("\n[Stats] Static Weights Test Results:")
    print("   Candidate: Alice Senior Data Scientist")
    print("   Job: Data Scientist")
    print(f"   Overall Score: {static_test['overall_score'] * 100:.1f}%")
    print_stats_breakdown(static_test)
    
    # Test 2: Dynamic Weights (Technical Role)
    print("\n" + "=" * 80)
    print("TEST 2: DYNAMIC WEIGHTS - Technical Role (Backend Engineer)")
    print("=" * 80)
    
    tech_weights = engine.calculate_dynamic_weights(
        JOB_REQUIREMENTS["backend_engineer"],
        "We need a skilled backend engineer with cloud and microservices experience."
    )
    
    print("\n[Stats] Dynamic Weights for Backend Engineer:")
    for category, weight in tech_weights.items():
        print(f"   {category:<18}: {weight * 100:5.1f}%")
    
    dynamic_test = engine.calculate_overall_score(
        required_skills=JOB_REQUIREMENTS["backend_engineer"]["required_skills"],
        candidate_skills=CANDIDATES["bob_backend_lead"]["skills"],
        required_experience_years=JOB_REQUIREMENTS["backend_engineer"]["required_years"],
        candidate_resume_text=CANDIDATES["bob_backend_lead"]["resume_text"],
        required_keywords=JOB_REQUIREMENTS["backend_engineer"]["keywords"],
        job_description="We need a skilled backend engineer with cloud and microservices experience.",
        job_requirements=JOB_REQUIREMENTS["backend_engineer"],
        use_dynamic_weights=True
    )
    
    print(f"\n   Overall Score: {dynamic_test['overall_score'] * 100:.1f}%")
    print(f"   Weight Source: {dynamic_test['weight_source']}")
    print_stats_breakdown(dynamic_test)
    
    # Run all test scenarios
    print("\n" + "=" * 80)
    print("TEST 3: ALL SCENARIOS - Candidate Ranking")
    print("=" * 80)
    
    for scenario_key, scenario in TEST_SCENARIOS.items():
        print(f"\n[Scenario] SCENARIO: {scenario['name']}")
        print(f"   {scenario['description']}")
        print("   " + "-" * 50)
        
        job_req = JOB_REQUIREMENTS[scenario['job_key']]
        candidates = [CANDIDATES[cid] for cid in scenario['candidate_ids']]
        
        ranked = engine.rank_candidates(
            job_requirements=job_req,
            candidates=candidates,
            job_description=f"Testing {scenario['name']}",
            use_dynamic_weights=True
        )
        
        print(f"\n   Job: {scenario['job_key'].replace('_', ' ').title()}")
        print(f"   Required Experience: {job_req['required_years']} years")
        print("\n   Ranked Candidates:")
        for i, candidate in enumerate(ranked, 1):
            print(f"      {i}. {candidate['candidate_name']:<25} Score: {candidate['overall_score'] * 100:.1f}%  "
                  f"(Weights: {candidate['weight_source']})")
            if candidate['weight_source'] == 'dynamic':
                weights = candidate['weights_used']
                print(f"         -> S:{weights['skill_match']*100:.0f}% Sem:{weights['semantic_match']*100:.0f}% "
                      f"Exp:{weights['experience_match']*100:.0f}% Key:{weights['keyword_match']*100:.0f}%")
            print_stats_breakdown(candidate, prefix="         ")
    
    # Test 4: Edge Cases
    print("\n" + "=" * 80)
    print("TEST 4: EDGE CASES")
    print("=" * 80)
    
    # Edge Case 1: No skills provided
    print("\n[Edge Case] Edge Case 1: No Required Skills")
    no_skills_result = engine.calculate_overall_score(
        required_skills=[],
        candidate_skills=CANDIDATES["grace_junior_dev"]["skills"],
        required_experience_years=0,
        candidate_resume_text=CANDIDATES["grace_junior_dev"]["resume_text"],
        required_keywords=[],
        use_dynamic_weights=True
    )
    print(f"   Score: {no_skills_result['overall_score'] * 100:.1f}% (Expected: 100% - no requirements)")
    
    # Edge Case 2: No candidate skills
    print("\n[Edge Case] Edge Case 2: No Candidate Skills")
    no_candidate_skills_result = engine.calculate_overall_score(
        required_skills=JOB_REQUIREMENTS["junior_developer"]["required_skills"],
        candidate_skills=[],
        required_experience_years=1,
        candidate_resume_text="No skills listed",
        required_keywords=JOB_REQUIREMENTS["junior_developer"]["keywords"],
        use_dynamic_weights=True
    )
    print(f"   Score: {no_candidate_skills_result['overall_score'] * 100:.1f}% (Expected: Low score)")
    
    # Edge Case 3: Custom weights
    print("\n[Edge Case] Edge Case 3: Custom Weights")
    custom_weights_test = engine.calculate_overall_score(
        required_skills=JOB_REQUIREMENTS["data_scientist"]["required_skills"],
        candidate_skills=CANDIDATES["alice_senior_data_scientist"]["skills"],
        required_experience_years=JOB_REQUIREMENTS["data_scientist"]["required_years"],
        candidate_resume_text=CANDIDATES["alice_senior_data_scientist"]["resume_text"],
        required_keywords=JOB_REQUIREMENTS["data_scientist"]["keywords"],
        custom_weights={
            "semantic_match": 0.50,
            "skill_match": 0.30,
            "experience_match": 0.15,
            "keyword_match": 0.05,
        },
        use_dynamic_weights=False
    )
    print("   Custom Weights Applied (50/30/15/5):")
    print(f"   Score: {custom_weights_test['overall_score'] * 100:.1f}%")
    
    
    print("\n" + "=" * 80)
    print("TEST 5: CONFIDENCE SCORING")
    print("=" * 80)
    
    confidence_cases = [
        ("High Confidence", "alice_senior_data_scientist", "data_scientist"),
        ("Medium Confidence", "grace_junior_dev", "data_scientist"),
        ("Low Confidence", "henry_intern", "cto"),
    ]
    
    for conf_case, candidate_key, job_key in confidence_cases:
        result = engine.calculate_overall_score(
            required_skills=JOB_REQUIREMENTS[job_key]["required_skills"],
            candidate_skills=CANDIDATES[candidate_key]["skills"],
            required_experience_years=JOB_REQUIREMENTS[job_key]["required_years"],
            candidate_resume_text=CANDIDATES[candidate_key]["resume_text"],
            required_keywords=JOB_REQUIREMENTS[job_key]["keywords"],
            use_dynamic_weights=True
        )
        print(f"\n   {conf_case}:")
        print(f"      Candidate: {CANDIDATES[candidate_key]['name']}")
        print(f"      Job: {job_key.replace('_', ' ').title()}")
        print(f"      Confidence: {result['confidence']['level'].upper()} ({result['confidence']['score']*100:.1f}%)")
        print(f"      Factors: {result['confidence']['factors']}")


if __name__ == "__main__":
    run_all_tests()