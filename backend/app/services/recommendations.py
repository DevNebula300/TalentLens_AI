import re

def _extract_bullets(text: str) -> list[str]:
    bullets = []
    for line in text.split('\n'):
        line = line.strip()
        if not line:
            continue
        if line.startswith(('-', '*', '•')) or (len(line) > 15 and not line.endswith(':')):
            clean_line = re.sub(r'^[-*•]\s*', '', line)
            if clean_line:
                bullets.append(clean_line)
    return bullets

def _analyze_weak_bullets(sections: dict) -> list[tuple[float, str]]:
    weak_recommendations = []
    target_sections = ["Experience", "Projects", "Employment", "Work Experience", "Professional Experience"]
    
    bullets = []
    for sec_name, sec_text in sections.items():
        if any(ts.lower() in sec_name.lower() for ts in target_sections):
            bullets.extend(_extract_bullets(sec_text))
            
    weak_verbs = ['helped', 'worked on', 'responsible for', 'assisted', 'managed', 'did', 'was', 'were', 'handled']
    metrics_pattern = r'\d+%|\$\d+|\b\d+\s*(?:users|clients|servers|months|years|days|hours)\b|\d+x'
    
    # Collect bullets by issue type
    weak_verb_bullets = []
    no_metrics_bullets = []
    
    for bullet in bullets:
        words = bullet.split()
        if len(words) < 4:
            continue 
            
        has_metrics = bool(re.search(metrics_pattern, bullet, re.IGNORECASE))
        has_number = any(char.isdigit() for char in bullet)
        
        lower_bullet = bullet.lower()
        found_weak_verb = next((v for v in weak_verbs if lower_bullet.startswith(v) or f" {v} " in lower_bullet), None)
        
        snippet = f"{bullet[:100]}..." if len(bullet) > 100 else bullet
        
        if found_weak_verb and not has_number and len(weak_verb_bullets) < 2:
            weak_verb_bullets.append((snippet, found_weak_verb))
        elif not has_metrics and not has_number and len(words) > 8 and len(no_metrics_bullets) < 2:
            no_metrics_bullets.append(snippet)
            
    if weak_verb_bullets:
        if len(weak_verb_bullets) == 1:
            snippet, verb = weak_verb_bullets[0]
            msg = f"Improve the bullet: '{snippet}' by replacing '{verb}' with a stronger action verb and adding measurable impact."
        else:
            snippets_text = " | ".join(f"'{b[0]}'" for b in weak_verb_bullets)
            verbs = set(b[1] for b in weak_verb_bullets)
            verbs_str = ", ".join(f"'{v}'" for v in verbs)
            msg = f"Improve these bullets by replacing weak verbs ({verbs_str}) with stronger action verbs and adding measurable impact: {snippets_text}."
        weak_recommendations.append((1.8, msg))
        
    if no_metrics_bullets:
        if len(no_metrics_bullets) == 1:
            msg = f"Quantify your impact in this bullet: '{no_metrics_bullets[0]}'."
        else:
            snippets_text = " | ".join(f"'{b}'" for b in no_metrics_bullets)
            msg = f"Quantify your impact in these bullets: {snippets_text}."
        weak_recommendations.append((1.4, msg))
        
    return weak_recommendations

def generate_recommendations(analysis_data: dict) -> list[str]:
    """
    analysis_data contains: missing_skills, additional_skills, matched_skills,
    semantic_score, skill_score, experience_score, keyword_score,
    overqualification_flag, skill_importance, skill_frequency,
    has_projects, experience_difference, resume_sections
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
    resume_sections = analysis_data.get("resume_sections", {})
    
    importance_dict = analysis_data.get("skill_importance", analysis_data.get("skill_frequency", {}))
    scored_recommendations = []
    
    skill_gap = max(0.0, 1.0 - skill_score)
    exp_gap = max(0.0, 1.0 - experience_score)
    keyword_gap = max(0.0, 1.0 - keyword_score)
    
    # weak bullet detection
    if resume_sections:
        weak_bullets = _analyze_weak_bullets(resume_sections)
        scored_recommendations.extend(weak_bullets)
        
        # skill misplacement check
        skills_text = ""
        exp_text = ""
        for sec_name, text in resume_sections.items():
            if "skill" in sec_name.lower():
                skills_text += text.lower() + " "
            elif any(ts in sec_name.lower() for ts in ["experience", "employment", "work"]):
                exp_text += text.lower() + " "
                
        if skills_text and exp_text:
            for skill in matched[:5]:
                skill_lower = skill.lower()
                if skill_lower in skills_text and skill_lower not in exp_text:
                    msg = f"You listed '{skill}' in your Skills section, but it is not mentioned in your Experience section. Add bullet points detailing how you used this skill in practice."
                    scored_recommendations.append((1.6, msg))
                    break # just do one so we don't spam

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
            msg = ("You fall short of the required formal years of experience, but your strong project portfolio "
                   "helps offset this. Ensure your project descriptions clearly map to the required skills to maximize their impact.")
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

    # up to 6 recommendations to show the specific bullet ones
    return recommendations[:6]

