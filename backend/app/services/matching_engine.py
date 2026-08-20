import re
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.services.skill_similarity import classify_skill_pair, calculate_similarity
from app.services.recommendations import generate_recommendations

class ResumeMatchingEngine:
    
    STATIC_WEIGHTS = {
        "semantic_match": 0.40,
        "skill_match": 0.30,
        "experience_match": 0.20,
        "keyword_match": 0.10,
    }
    
    def __init__(self, config: Optional[Dict] = None):
        self.config = config or {
            "static_weights": self.STATIC_WEIGHTS,
            "experience_levels": {
                "entry": (0, 2),
                "junior": (2, 4),
                "mid": (4, 7),
                "senior": (7, 10),
                "lead": (10, 15),
                "principal": (15, float('inf')),
            },
            "dynamic_weight_factors": {
                "skill_importance_threshold": 0.5,
                "experience_importance_threshold": 5,
                "keyword_density_threshold": 30,
            }
        }
    
    def calculate_dynamic_weights(
        self,
        job_requirements: Dict[str, Any],
        job_description: str = ""
    ) -> Dict[str, float]:
        weights = self.STATIC_WEIGHTS.copy()
        
        required_skills = job_requirements.get("required_skills", [])
        required_years = job_requirements.get("required_years", 0)
        keywords = job_requirements.get("keywords", [])
        
        adjustments_made = False
        
        if required_skills:
            skill_count = len(required_skills)
            
            if skill_count >= 15:
                skill_boost = 0.15
            elif skill_count >= 10:
                skill_boost = 0.10
            elif skill_count >= 5:
                skill_boost = 0.05
            else:
                skill_boost = -0.05
            
            technical_skills = ["python", "java", "javascript", "c++", "sql",
                              "aws", "docker", "kubernetes", "react", "angular"]
            tech_count = sum(1 for s in required_skills if any(
                tech in s.lower() for tech in technical_skills
            ))
            
            tech_ratio = tech_count / skill_count if skill_count > 0 else 0
            
            if tech_ratio > 0.6:
                skill_boost += 0.10
                weights["semantic_match"] += 0.05
                adjustments_made = True
            
            weights["skill_match"] += skill_boost
            adjustments_made = True
        
        if required_years > 0:
            if required_years >= 10:
                exp_boost = 0.15
            elif required_years >= 7:
                exp_boost = 0.10
            elif required_years >= 5:
                exp_boost = 0.05
            elif required_years >= 3:
                exp_boost = 0.0
            else:
                exp_boost = -0.05
            
            weights["experience_match"] += exp_boost
            
            leadership_keywords = ["lead", "senior", "director", "manager",
                                  "head", "principal", "staff"]
            if job_description and any(kw in job_description.lower() for kw in leadership_keywords):
                weights["experience_match"] += 0.05
                adjustments_made = True
            
            adjustments_made = True
        
        if keywords:
            keyword_count = len(keywords)
            
            if keyword_count >= 15:
                keyword_boost = 0.08
            elif keyword_count >= 10:
                keyword_boost = 0.05
            elif keyword_count >= 5:
                keyword_boost = 0.02
            else:
                keyword_boost = -0.02
            
            weights["keyword_match"] += keyword_boost
            adjustments_made = True
        
        if job_description:
            semantic_indicators = ["understand", "familiar", "knowledge", "concept",
                                  "theory", "foundation", "principle", "approach"]
            semantic_count = sum(1 for word in semantic_indicators
                               if word in job_description.lower())
            
            if semantic_count >= 3:
                weights["semantic_match"] += 0.05
                adjustments_made = True
            
            domain_keywords = ["full stack", "end-to-end", "comprehensive", "broad",
                              "wide", "diverse", "multifaceted"]
            domain_count = sum(1 for kw in domain_keywords
                             if kw in job_description.lower())
            
            if domain_count >= 2:
                weights["semantic_match"] += 0.05
                adjustments_made = True
        
        if not adjustments_made:
            return self.STATIC_WEIGHTS.copy()
        
        for key in weights:
            weights[key] = max(0.05, weights[key])
        
        total = sum(weights.values())
        if total > 0:
            normalized_weights = {k: v / total for k, v in weights.items()}
        else:
            normalized_weights = self.STATIC_WEIGHTS.copy()
        
        for key in normalized_weights:
            normalized_weights[key] = min(0.60, normalized_weights[key])
        
        total = sum(normalized_weights.values())
        if total > 0:
            normalized_weights = {k: v / total for k, v in normalized_weights.items()}
        
        return normalized_weights
    
    def explain_weights(self, weights: Dict[str, float]) -> Dict[str, str]:
        explanations = {}
        
        if weights.get("semantic_match", 0) > 0.40:
            explanations["semantic_match"] = "Boosted due to: Technical role, broad skill requirements, or emphasis on understanding concepts."
        elif weights.get("semantic_match", 0) < 0.35:
            explanations["semantic_match"] = "Reduced due to: Very specific skill requirements with clear exact matches expected."
        else:
            explanations["semantic_match"] = "Standard weight (40%) - balanced emphasis on skill understanding."
        
        if weights.get("skill_match", 0) > 0.35:
            explanations["skill_match"] = "Boosted due to: Large number of required skills or high percentage of technical skills."
        elif weights.get("skill_match", 0) < 0.25:
            explanations["skill_match"] = "Reduced due to: Few skills required or emphasis on broader qualifications."
        else:
            explanations["skill_match"] = "Standard weight (30%) - balanced emphasis on exact skill matches."
        
        if weights.get("experience_match", 0) > 0.25:
            explanations["experience_match"] = "Boosted due to: High experience requirement or senior/leadership role."
        elif weights.get("experience_match", 0) < 0.15:
            explanations["experience_match"] = "Reduced due to: Entry-level role or low experience requirement."
        else:
            explanations["experience_match"] = "Standard weight (20%) - balanced emphasis on experience."
        
        if weights.get("keyword_match", 0) > 0.15:
            explanations["keyword_match"] = "Boosted due to: Many specific keywords in requirements."
        elif weights.get("keyword_match", 0) < 0.05:
            explanations["keyword_match"] = "Reduced due to: Few keywords or emphasis on broader skills."
        else:
            explanations["keyword_match"] = "Standard weight (10%) - balanced emphasis on keyword matching."
        
        return explanations
    
    def calculate_skill_match_score(
        self,
        required_skills: List[str],
        preferred_skills: List[str],
        candidate_skills: List[str]
    ) -> Dict[str, Any]:
        if not required_skills:
            return {
                "score": 1.0,
                "matched": [],
                "missing": [],
                "partial": [],
                "additional": [],
                "details": {}
            }
        
        matched = []
        partial_matches = []
        missing = []
        details = {}
        
        for req_skill in required_skills:
            best_match = None
            best_score = 0.0
            best_classification = "unknown"
            
            for cand_skill in candidate_skills:
                result = classify_skill_pair(req_skill, cand_skill)
                similarity = result["similarity"]
                classification = result["classification"]
                
                if classification == "equivalent":
                    weighted_score = similarity * 1.0
                elif classification == "related":
                    weighted_score = similarity * 0.7
                else:
                    weighted_score = 0.0
                
                if weighted_score > best_score:
                    best_score = weighted_score
                    best_match = cand_skill
                    best_classification = classification
            
            if best_score >= 0.7:
                matched.append({
                    "required": req_skill,
                    "matched_with": best_match,
                    "score": best_score,
                    "classification": best_classification
                })
            elif best_score >= 0.3:
                partial_matches.append({
                    "required": req_skill,
                    "matched_with": best_match,
                    "score": best_score,
                    "classification": best_classification
                })
            else:
                missing.append(req_skill)
            
            details[req_skill] = {
                "best_match": best_match,
                "score": best_score,
                "classification": best_classification
            }
        
        total_required = len(required_skills)
        if total_required == 0:
            skill_score = 1.0
        else:
            weighted_matches = sum(m["score"] for m in matched)
            partial_weighted = sum(p["score"] * 0.5 for p in partial_matches)
            skill_score = (weighted_matches + partial_weighted) / total_required
            
        matched_candidate_skills = {m["matched_with"] for m in matched if m.get("matched_with")}
        matched_candidate_skills.update({p["matched_with"] for p in partial_matches if p.get("matched_with")})
        
        # Calculate preferred skills match
        preferred_matched = []
        preferred_missing = []
        preferred_score_bonus = 0.0
        
        for pref_skill in (preferred_skills or []):
            best_match = None
            best_score = 0.0
            best_classification = "unknown"
            
            for cand_skill in candidate_skills:
                result = classify_skill_pair(pref_skill, cand_skill)
                similarity = result["similarity"]
                classification = result["classification"]
                
                weighted_score = similarity if classification == "equivalent" else (similarity * 0.7 if classification == "related" else 0.0)
                
                if weighted_score > best_score:
                    best_score = weighted_score
                    best_match = cand_skill
                    best_classification = classification
            
            if best_score >= 0.7:
                preferred_matched.append({
                    "required": pref_skill,
                    "matched_with": best_match,
                    "score": best_score,
                    "classification": best_classification
                })
                matched_candidate_skills.add(best_match)
                preferred_score_bonus += 0.05  # bonus for each preferred skill matched
            else:
                preferred_missing.append(pref_skill)
                
            details[pref_skill] = {
                "best_match": best_match,
                "score": best_score,
                "classification": best_classification
            }
            
        additional_skills = [skill for skill in candidate_skills if skill not in matched_candidate_skills]
        
        return {
            "score": round(min(skill_score, 1.0), 4),
            "bonus_score": preferred_score_bonus,
            "matched": matched,
            "partial": partial_matches,
            "missing": missing,
            "preferred_matched": preferred_matched,
            "preferred_missing": preferred_missing,
            "additional": additional_skills,
            "details": details
        }

    def calculate_semantic_match_score(
        self,
        required_skills: List[str],
        candidate_skills: List[str],
        context_text: str = ""
    ) -> Dict[str, Any]:
        if not required_skills or not candidate_skills:
            return {"score": 0.0, "semantic_matches": [], "details": {}}
        
        semantic_matches = []
        total_score = 0.0
        
        for req_skill in required_skills:
            best_match = None
            best_score = 0.0
            
            for cand_skill in candidate_skills:
                similarity = calculate_similarity(req_skill, cand_skill)
                
                if context_text and cand_skill.lower() in context_text.lower():
                    similarity = min(similarity * 1.1, 1.0)
                
                if similarity > best_score:
                    best_score = similarity
                    best_match = cand_skill
            
            if best_score >= 0.3:
                semantic_matches.append({
                    "required": req_skill,
                    "semantic_match": best_match,
                    "score": best_score
                })
                total_score += best_score
        
        avg_score = total_score / len(required_skills) if required_skills else 0
        
        return {
            "score": round(min(avg_score, 1.0), 4),
            "semantic_matches": semantic_matches,
            "details": {
                "avg_semantic_score": avg_score,
                "total_semantic_matches": len(semantic_matches)
            }
        }

    def extract_experience_years(self, text: str, is_jd: bool = False) -> tuple[float, str]:
        text_lower = text.lower()
        extracted_years = []
        evidence_snippet = ""
        
        patterns = [
            r'(\d+)\s*\+\s*years?',
            r'(\d+)\s*-\s*(\d+)\s*years?',
            r'(\d+)\s*years?',
            r'(\d+)\s*\+\s*yrs?',
            r'(\d+)\s*yrs?',
        ]
        
        remaining_text = text_lower
        for pattern in patterns:
            for match in re.finditer(pattern, remaining_text):
                val_match = match.groups()
                current_years = 0.0
                if len(val_match) == 2 and val_match[0] and val_match[1]:
                    if is_jd:
                        current_years = float(val_match[0])  # Use minimum required
                    else:
                        current_years = (float(val_match[0]) + float(val_match[1])) / 2
                elif val_match[0]:
                    current_years = float(val_match[0])
                    
                if current_years > 0:
                    extracted_years.append((current_years, match))
            
            # Remove matched patterns with spaces of same length to preserve indices
            remaining_text = re.sub(pattern, lambda m: ' ' * len(m.group(0)), remaining_text)
            
        total_years = 0.0
        
        if extracted_years:
            if is_jd:
                best_match = min(extracted_years, key=lambda x: x[0])
            else:
                best_match = max(extracted_years, key=lambda x: x[0])
                
            total_years = best_match[0]
            match = best_match[1]
            start = max(0, match.start() - 30)
            end = min(len(text), match.end() + 30)
            evidence_snippet = "..." + text[start:end].replace('\n', ' ').strip() + "..."
                    
        if total_years == 0:
            # Check for months if no years were found
            for match in re.finditer(r'(\d+)\s*months?', text_lower):
                val = float(match.group(1))
                current_years = val / 12.0
                if current_years > total_years:
                    total_years = current_years
                    start = max(0, match.start() - 30)
                    end = min(len(text), match.end() + 30)
                    evidence_snippet = "..." + text[start:end].replace('\n', ' ').strip() + "..."
                    
        if total_years == 0:
            for match in re.finditer(r'since\s+(\d{4})', text_lower, re.IGNORECASE):
                year_str = match.group(1)
                year = int(year_str)
                current_year = datetime.now().year
                if 1900 < year <= current_year:
                    total_years = max(total_years, float(current_year - year))
                    start = max(0, match.start() - 30)
                    end = min(len(text), match.end() + 30)
                    evidence_snippet = "..." + text[start:end].replace('\n', ' ').strip() + "..."
                    
        if total_years == 0:
            months = [
                'january', 'february', 'march', 'april', 'may', 'june', 
                'july', 'august', 'september', 'october', 'november', 'december',
                'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
            ]
            months_pattern = '|'.join(months)
            
            
            date_range_pattern = rf'\b({months_pattern})\s+(\d{{4}})\s*(?:-|to|–|—)\s*(?:({months_pattern})\s+(\d{{4}})|present|current|now)\b'
            
            total_months = 0
            first_match = None
            
            for match in re.finditer(date_range_pattern, text_lower, re.IGNORECASE):
                if not first_match:
                    first_match = match
                    
                start_month_str, start_year_str, end_month_str, end_year_str = match.groups()
                start_year = int(start_year_str)
                
                start_month_idx = 1
                for i, m in enumerate(months):
                    if start_month_str.lower() == m:
                        start_month_idx = (i % 12) + 1
                        break
                        
                if end_month_str and end_year_str:
                    end_year = int(end_year_str)
                    end_month_idx = 1
                    for i, m in enumerate(months):
                        if end_month_str.lower() == m:
                            end_month_idx = (i % 12) + 1
                            break
                else:
                    now = datetime.now()
                    end_year = now.year
                    end_month_idx = now.month
                    
                if end_year >= start_year:
                    months_diff = (end_year - start_year) * 12 + (end_month_idx - start_month_idx)
                    # adding 1 to make it inclusive 
                    if months_diff >= 0:
                        total_months += (months_diff + 1)
                        
            if total_months > 0:
                total_years = total_months / 12.0
                start = max(0, first_match.start() - 30)
                end = min(len(text), first_match.end() + 30)
                evidence_snippet = "..." + text[start:end].replace('\n', ' ').strip() + "..."
        
        return total_years, evidence_snippet

    def get_experience_level(self, years: float) -> str:
        for level, (min_years, max_years) in self.config["experience_levels"].items():
            if min_years <= years < max_years:
                return level
        return "entry" if years == 0 else "principal"

    def calculate_experience_match_score(
        self,
        required_years: float,
        candidate_text: str
    ) -> Dict[str, Any]:
        candidate_years, evidence_snippet = self.extract_experience_years(candidate_text)
        
        project_keywords = ["github", "open source", "portfolio", "hackathon", "personal project"]
        has_strong_projects = any(kw in candidate_text.lower() for kw in project_keywords)
        
        if not evidence_snippet and has_strong_projects:
            evidence_snippet = "Experience inferred from strong project/portfolio evidence."
        elif not evidence_snippet:
            evidence_snippet = "No explicit years of experience found in resume."
        
        if required_years == 0:
            return {
                "score": 1.0,
                "candidate_years": candidate_years,
                "required_years": required_years,
                "difference": 0,
                "level_match": "not_applicable",
                "has_projects": has_strong_projects,
                "evidence": evidence_snippet
            }
        
        if candidate_years == 0:
            base_score = 0.3 if has_strong_projects else 0.0
            return {
                "score": base_score,
                "candidate_years": 0,
                "required_years": required_years,
                "difference": required_years,
                "level_match": "unknown",
                "has_projects": has_strong_projects,
                "evidence": evidence_snippet
            }
        
        diff = candidate_years - required_years
        diff_ratio = abs(diff) / required_years
        
        if diff_ratio <= 0.2:
            score = 1.0
        elif diff_ratio <= 0.5:
            score = 0.8
        elif diff_ratio <= 1.0:
            score = 0.6
        else:
            score = 0.3
        
        required_level = self.get_experience_level(required_years)
        candidate_level = self.get_experience_level(candidate_years)
        
        if required_level == candidate_level:
            score = min(score + 0.1, 1.0)
            
        if diff < 0 and has_strong_projects:
            score = min(score + 0.2, 1.0)
        
        return {
            "score": round(min(score, 1.0), 4),
            "candidate_years": candidate_years,
            "required_years": required_years,
            "difference": diff,
            "level_match": f"{candidate_level} vs {required_level}",
            "has_projects": has_strong_projects,
            "evidence": evidence_snippet,
            "details": {
                "extracted_from": evidence_snippet
            }
        }

    def calculate_keyword_match_score(
        self,
        required_keywords: List[str],
        candidate_text: str,
        weight_by_importance: bool = True
    ) -> Dict[str, Any]:
        if not required_keywords:
            return {"score": 1.0, "found": [], "missing": [], "details": {}}
        
        candidate_lower = candidate_text.lower()
        found = []
        missing = []
        details = {}
        
        for keyword in required_keywords:
            keyword_lower = keyword.lower()
            pattern = r'\b' + re.escape(keyword_lower) + r'\b'
            found_in_text = bool(re.search(pattern, candidate_lower))
            
            details[keyword] = {"found": found_in_text}
            
            if found_in_text:
                found.append(keyword)
            else:
                missing.append(keyword)
        
        total_keywords = len(required_keywords)
        if total_keywords == 0:
            keyword_score = 1.0
        else:
            if weight_by_importance:
                tech_keywords = ["python", "java", "aws", "docker", "kubernetes",
                               "react", "node", "tensorflow", "pytorch", "sql"]
                weights = {
                    kw: 2.0 if any(tech in kw.lower() for tech in tech_keywords) else 1.0
                    for kw in required_keywords
                }
                total_weight = sum(weights.values())
                score_weighted = sum(
                    weights[kw] for kw in found
                ) / total_weight
                keyword_score = score_weighted
            else:
                keyword_score = len(found) / total_keywords
        
        return {
            "score": round(min(keyword_score, 1.0), 4),
            "found": found,
            "missing": missing,
            "details": details
        }

    def calculate_overall_score(
        self,
        required_skills: List[str],
        preferred_skills: List[str],
        candidate_skills: List[str],
        required_experience_years: float,
        candidate_resume_text: str,
        required_keywords: Optional[List[str]] = None,
        context_text: str = "",
        job_description: str = "",
        job_requirements: Optional[Dict[str, Any]] = None,
        use_dynamic_weights: bool = True,
        custom_weights: Optional[Dict[str, float]] = None,
        resume_sections: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        if custom_weights:
            weights = custom_weights
            weight_source = "custom"
            weight_explanations = None
        else:
            if use_dynamic_weights:
                if job_requirements is None:
                    job_requirements = {
                        "required_skills": required_skills,
                        "required_years": required_experience_years,
                        "keywords": required_keywords or []
                    }
                
                weights = self.calculate_dynamic_weights(
                    job_requirements,
                    job_description
                )
                weight_source = "dynamic"
                weight_explanations = self.explain_weights(weights)
            else:
                weights = self.STATIC_WEIGHTS.copy()
                weight_source = "static"
                weight_explanations = {k: "Static weight (fallback)" for k in weights}
        
        skill_result = self.calculate_skill_match_score(
            required_skills,
            preferred_skills,
            candidate_skills
        )
        skill_score = skill_result["score"]
        bonus_score = skill_result.get("bonus_score", 0.0)
        
        semantic_result = self.calculate_semantic_match_score(
            required_skills,
            candidate_skills,
            context_text
        )
        semantic_score = semantic_result["score"]
        
        experience_result = self.calculate_experience_match_score(
            required_experience_years,
            candidate_resume_text
        )
        experience_score = experience_result["score"]
        
        keywords = required_keywords or required_skills
        keyword_result = self.calculate_keyword_match_score(
            keywords,
            candidate_resume_text
        )
        keyword_score = keyword_result["score"]
        
        final_score = (
            weights["semantic_match"] * semantic_score +
            weights["skill_match"] * skill_score +
            weights["experience_match"] * experience_score +
            weights["keyword_match"] * keyword_score
        ) + bonus_score
        final_score = min(final_score, 1.0)
        
        confidence = self._calculate_confidence(
            skill_result, semantic_result, experience_result, keyword_result
        )
        
        insights = self._identify_strengths_and_gaps(
            skill_result, experience_result, keyword_result, candidate_resume_text
        )
        
        analysis_data = {
            "missing_skills": skill_result.get("missing", []),
            "matched_skills": [s.get("matched_with") for s in skill_result.get("matched", []) if s.get("matched_with")],
            "additional_skills": skill_result.get("additional", []),
            "skill_score": skill_score,
            "experience_score": experience_score,
            "keyword_score": keyword_score,
            "semantic_score": semantic_score,
            "overqualification_flag": any("overqualified" in gap.lower() for gap in insights["gaps"]),
            "skill_importance": job_requirements.get("skill_importance", {}) if job_requirements else {},
            "skill_frequency": job_requirements.get("skill_frequency", {}) if job_requirements else {},
            "has_projects": experience_result.get("has_projects", False),
            "experience_difference": experience_result.get("difference", 0.0),
            "resume_sections": resume_sections or {}
        }
        recommendations = generate_recommendations(analysis_data)
        
        matched_skills_list = analysis_data["matched_skills"]
        compatibility_level = "Excellent" if final_score >= 0.85 else "Strong" if final_score >= 0.7 else "Moderate" if final_score >= 0.5 else "Low"
        
        compatibility_analysis = {
            "overall_compatibility": compatibility_level,
            "score": round(final_score, 4),
            "evidence": {
                "skills_evidence": f"Explicitly matched {len(matched_skills_list)} required skills ({', '.join(matched_skills_list[:5])}{'...' if len(matched_skills_list) > 5 else ''})." if matched_skills_list else "No explicit required skills matched.",
                "experience_evidence": experience_result.get("evidence", "No evidence found."),
                "semantic_evidence": "Resume concepts align strongly with the job description." if semantic_score >= 0.6 else "Concepts somewhat differ from job requirements.",
                "keyword_evidence": f"Found {len(keyword_result.get('found', []))} exact keyword matches." if keyword_result.get('found') else "Low keyword alignment."
            }
        }
        
        return {
            "overall_score": round(final_score, 4),
            "compatibility_analysis": compatibility_analysis,
            "weight_source": weight_source,
            "weights_used": weights,
            "weight_explanations": weight_explanations,
            "score_breakdown": {
                "semantic_match": round(semantic_score, 4),
                "skill_match": round(skill_score, 4),
                "experience_match": round(experience_score, 4),
                "keyword_match": round(keyword_score, 4),
            },
            "weighted_contributions": {
                "semantic_match": round(weights["semantic_match"] * semantic_score, 4),
                "skill_match": round(weights["skill_match"] * skill_score, 4),
                "experience_match": round(weights["experience_match"] * experience_score, 4),
                "keyword_match": round(weights["keyword_match"] * keyword_score, 4),
            },
            "confidence": confidence,
            "matched_skills": [s["matched_with"] for s in skill_result.get("matched", []) if s.get("matched_with")],
            "missing_skills": skill_result.get("missing", []),
            "preferred_matched": [s["matched_with"] for s in skill_result.get("preferred_matched", []) if s.get("matched_with")],
            "preferred_missing": skill_result.get("preferred_missing", []),
            "additional_skills": skill_result.get("additional", []),
            "strengths": insights["strengths"],
            "gaps": insights["gaps"],
            "recommendations": recommendations,
            "details": {
                "skill_details": skill_result,
                "semantic_details": semantic_result,
                "experience_details": experience_result,
                "keyword_details": keyword_result,
            }
        }

    def _calculate_confidence(
        self,
        skill_result: Dict,
        semantic_result: Dict,
        experience_result: Dict,
        keyword_result: Dict
    ) -> Dict[str, Any]:
        confidence_factors = []
        
        total_required = len(skill_result.get("details", {}))
        if total_required > 0:
            factor = min(1.0, total_required / 10)
            confidence_factors.append(factor)
        
        if experience_result.get("candidate_years", 0) > 0:
            confidence_factors.append(1.0)
        else:
            confidence_factors.append(0.3)
        
        semantic_matches = semantic_result.get("semantic_matches", [])
        if semantic_matches:
            avg_sem_score = sum(m["score"] for m in semantic_matches) / len(semantic_matches)
            confidence_factors.append(min(1.0, avg_sem_score))
        else:
            confidence_factors.append(0.5)
        
        avg_confidence = sum(confidence_factors) / len(confidence_factors) if confidence_factors else 0.5
        
        if avg_confidence >= 0.8:
            level = "high"
        elif avg_confidence >= 0.6:
            level = "medium"
        elif avg_confidence >= 0.4:
            level = "low"
        else:
            level = "very_low"
        
        return {
            "level": level,
            "score": round(avg_confidence, 4),
            "factors": {
                "skill_count": total_required,
                "experience_available": experience_result.get("candidate_years", 0) > 0,
                "semantic_coverage": len(semantic_matches) > 0
            }
        }

    def _identify_strengths_and_gaps(
        self,
        skill_result: Dict,
        experience_result: Dict,
        keyword_result: Dict,
        candidate_resume_text: str
    ) -> Dict[str, List[str]]:
        strengths = []
        gaps = []
        
        req_years = experience_result.get("required_years", 0)
        cand_years = experience_result.get("candidate_years", 0)
        if req_years >= 0:
            if cand_years >= req_years:
                diff = cand_years - req_years
                if req_years <= 1 and diff >= 3:
                    gaps.append(f"May be overqualified for this position ({cand_years} years vs required {req_years}).")
                elif diff >= 2:
                    strengths.append(f"Exceeds experience requirement by {diff} years.")
                elif req_years > 0:
                    strengths.append("Meets experience requirement.")
            else:
                diff = req_years - cand_years
                has_projects = experience_result.get("has_projects", False)
                if has_projects:
                    gaps.append(f"Falls short of formal experience requirement by {diff:.1f} years, but this may be offset by strong project work.")
                    strengths.append("Demonstrates practical experience through projects/portfolio.")
                else:
                    gaps.append(f"Falls short of experience requirement by {diff:.1f} years.")
        
        matched_skills = skill_result.get("matched", [])
        if matched_skills:
            top_skills = [s["matched_with"] for s in matched_skills[:5] if s.get("matched_with")]
            if top_skills:
                strengths.append(f"Strong match for required skills: {', '.join(top_skills)}.")
                
        additional_skills = skill_result.get("additional", [])
        if additional_skills:
            strengths.append(f"Brings additional skills not explicitly required: {', '.join(additional_skills)}.")
            
        missing_skills = skill_result.get("missing", [])
        if missing_skills:
            gaps.append(f"Missing required skills: {', '.join(missing_skills)}.")
            
        keyword_score = keyword_result.get("score", 0)
        if keyword_score >= 0.8:
            strengths.append("Resume terminology highly aligns with job description.")
        elif keyword_score <= 0.4:
            gaps.append("Resume terminology lacks key terms from the job description.")
        
        text_lower = candidate_resume_text.lower()
        if any(term in text_lower for term in ["ph.d", "phd", "doctorate"]):
            strengths.append("Holds a Doctorate degree (Ph.D).")
        elif any(term in text_lower for term in ["master's", "masters", "m.s.", "m.a.", "mba"]):
            strengths.append("Holds a Master's degree.")
            
        if any(term in text_lower for term in ["volunteer", "volunteering"]):
            strengths.append("Has volunteer experience.")
            
        if any(term in text_lower for term in ["certif"]):
            strengths.append("Has professional certifications.")
            
        if any(term in text_lower for term in ["published", "publication"]):
            strengths.append("Has publications or published work.")
            
        if any(term in text_lower for term in ["award", "won "]):
            strengths.append("Has received professional awards or recognition.")
            
        if any(term in text_lower for term in ["launched", "shipped", "released"]):
            strengths.append("Has experience successfully launching products or projects.")
            
        if any(term in text_lower for term in ["led a team", "managed a team", "leading", "leadership", "led"]):
            strengths.append("Possesses team leadership or management experience.")
            
        return {
            "strengths": strengths,
            "gaps": gaps
        }
    
    def rank_candidates(
        self,
        job_requirements: Dict[str, Any],
        candidates: List[Dict[str, Any]],
        job_description: str = "",
        use_dynamic_weights: bool = True
    ) -> List[Dict[str, Any]]:
        ranked_candidates = []
        
        for candidate in candidates:
            score_result = self.calculate_overall_score(
                required_skills=job_requirements.get("required_skills", []),
                candidate_skills=candidate.get("skills", []),
                required_experience_years=job_requirements.get("required_years", 0),
                candidate_resume_text=candidate.get("resume_text", ""),
                required_keywords=job_requirements.get("keywords", None),
                context_text=candidate.get("context", ""),
                job_description=job_description,
                job_requirements=job_requirements,
                use_dynamic_weights=use_dynamic_weights
            )
            
            ranked_candidates.append({
                "candidate_id": candidate.get("id"),
                "candidate_name": candidate.get("name"),
                "overall_score": score_result["overall_score"],
                "weight_source": score_result["weight_source"],
                "weights_used": score_result["weights_used"],
                "weight_explanations": score_result.get("weight_explanations", {}),
                "score_breakdown": score_result["score_breakdown"],
                "confidence": score_result["confidence"],
                "matched_skills": score_result.get("matched_skills", []),
                "missing_skills": score_result.get("missing_skills", []),
                "additional_skills": score_result.get("additional_skills", []),
                "strengths": score_result.get("strengths", []),
                "gaps": score_result.get("gaps", []),
                "details": score_result["details"]
            })
        
        return sorted(ranked_candidates, key=lambda x: x["overall_score"], reverse=True)