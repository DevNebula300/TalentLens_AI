def generate_recommendations(analysis_data: dict) -> list[str]:
    """
    analysis_data contains: missing_skills, additional_skills, matched_skills,
    semantic_score, skill_score, experience_score, keyword_score,
    overqualification_flag, skill_importance, skill_frequency,
    has_projects, experience_difference
    """
    missing = analysis_data.get("missing_skills", [])
    matched = analysis_data.get("matched_skills", [])
    additional = analysis_data.get("additional_skills", [])
    
    skill_score = analysis_data.get("skill_score", 0.0)
    experience_score = analysis_data.get("experience_score", 0.0)
    keyword_score = analysis_data.get("keyword_score", 0.0)
    semantic_score = analysis_data.get("semantic_score", 0.0)
    is_overqualified = analysis_data.get("overqualification_flag", False)
    
    has_projects = analysis_data.get("has_projects", False)
    exp_diff = analysis_data.get("experience_difference", 0.0)
    
    importance_dict = analysis_data.get("skill_importance", analysis_data.get("skill_frequency", {}))
    scored_recommendations = []
    
    skill_gap = max(0.0, 1.0 - skill_score)
    exp_gap = max(0.0, 1.0 - experience_score)
    keyword_gap = max(0.0, 1.0 - keyword_score)
    
    # Rule 1: Missing Skills
    if missing:
        top_missing = sorted(missing, key=lambda s: importance_dict.get(s, 0), reverse=True)[:3]
        if semantic_score >= 0.7:
            msg = (f"You show strong conceptual alignment with the role, but lack explicit mentions of: "
                   f"{', '.join(top_missing)}. If you have used these specific technologies, add them directly "
                   f"to your experience bullets. If you haven't, consider building a quick project to bridge the gap.")
        else:
            msg = (f"Prioritize learning and gaining practical experience in these key missing requirements: "
                   f"{', '.join(top_missing)}.")
        
        priority = skill_gap * 2.0 + 0.5
        scored_recommendations.append((priority, msg))
        
    # Rule 2: Keyword Mismatch
    if keyword_score < 0.5 and semantic_score > 0.65:
        msg = ("Your background aligns well conceptually, but your resume's terminology differs from the job posting. "
               "Mirror exact keywords used in the job description to improve your automated match rate.")
        priority = keyword_gap * 1.5 + (semantic_score - 0.65)
        scored_recommendations.append((priority, msg))
        
    # Rule 3: Weak Experience Match (Now uses has_projects flag)
    if experience_score < 0.7:
        if has_projects:
            msg = (f"You fall short of the required formal years of experience, but your strong project portfolio "
                   f"helps offset this. Ensure your project descriptions clearly map to the required skills to maximize their impact.")
        else:
            msg = ("If you lack the required formal years of work experience, strongly emphasize relevant personal projects, "
                   "open-source contributions, or academic work that demonstrate equivalent practical capabilities. "
                   "Otherwise, restructure your experience section to more clearly surface aligned responsibilities.")
        priority = exp_gap * 1.5
        scored_recommendations.append((priority, msg))
        
    # Rule 4: Overqualification
    if is_overqualified:
        msg = ("Your profile may appear overqualified. Consider emphasizing adaptability, mentorship, "
               "or scope-appropriate achievements rather than advanced technical depth alone.")
        priority = 1.2
        scored_recommendations.append((priority, msg))
        
    # Rule 5: Leverage Additional Skills
    if additional and skill_score >= 0.7:
        msg = (f"You possess valuable extra skills ({', '.join(additional[:3])}) not explicitly requested. "
               f"Highlight how these uniquely position you to add value beyond the core requirements.")
        priority = 0.4 + (skill_score * 0.5)
        scored_recommendations.append((priority, msg))

    # Rule 6: Strong Overall Match Differentiation
    if skill_score >= 0.8 and experience_score >= 0.75:
        msg = ("Your core qualifications align strongly. Focus on quantifying your impact "
               "(e.g., metrics, scale, outcomes) in your bullet points to stand out from other qualified candidates.")
        priority = (skill_score + experience_score) / 2.0
        scored_recommendations.append((priority, msg))

    scored_recommendations.sort(key=lambda x: x[0], reverse=True)
    recommendations = [msg for _, msg in scored_recommendations]
    
    if not recommendations:
        recommendations.append(
            "Your resume is reasonably aligned with this role. Review the job description "
            "closely to ensure your most relevant experiences are featured prominently."
        )

    return recommendations[:4]
