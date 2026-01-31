from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models import User, CompliancePolicy
from app.schemas import ChatbotRequest, ChatbotResponse
from app.dependencies import get_current_user
from app.config import settings
from datetime import date
from typing import List, Tuple
import re
import json
import numpy as np

router = APIRouter(prefix="/chatbot", tags=["chatbot"])


def _get_user_policies(db: Session, current_user: User):
    """Policies for user's department or department='All', with parsed rules."""
    policies = db.query(CompliancePolicy).filter(
        or_(
            CompliancePolicy.department == current_user.department,
            CompliancePolicy.department.ilike("all"),
        )
    ).order_by(CompliancePolicy.due_date).all()
    
    # Parse rules JSON for each policy - safely handle missing rules attribute
    for policy in policies:
        rules_data = getattr(policy, 'rules', None)
        if rules_data:
            try:
                parsed = json.loads(rules_data)
                policy.parsed_rules = parsed if isinstance(parsed, list) else []
            except (json.JSONDecodeError, TypeError):
                policy.parsed_rules = []
        else:
            policy.parsed_rules = []
    
    # Reorder: policies with actual rules first, then by due_date
    policies_with_rules = [p for p in policies if hasattr(p, 'parsed_rules') and p.parsed_rules and len(p.parsed_rules) > 0]
    policies_without_rules = [p for p in policies if p not in policies_with_rules]
    
    return policies_with_rules + policies_without_rules


def _get_embedding(text: str, client) -> List[float]:
    """Get embedding for text using OpenAI API."""
    try:
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        return response.data[0].embedding
    except Exception:
        return None


def _cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """Calculate cosine similarity between two vectors."""
    try:
        v1 = np.array(vec1)
        v2 = np.array(vec2)
        dot_product = np.dot(v1, v2)
        norm1 = np.linalg.norm(v1)
        norm2 = np.linalg.norm(v2)
        if norm1 == 0 or norm2 == 0:
            return 0.0
        return dot_product / (norm1 * norm2)
    except Exception:
        return 0.0


def _build_policy_text(policy) -> str:
    """Build searchable text representation of a policy."""
    text_parts = []
    category = getattr(policy, 'category', None)
    if category:
        text_parts.append(category)
    text_parts.append(policy.title)
    if getattr(policy, 'description', None):
        text_parts.append(policy.description)
    
    # Add rules text
    if hasattr(policy, 'parsed_rules') and policy.parsed_rules:
        for rule in policy.parsed_rules:
            rule_text = rule.get('rule_text', '')
            if rule_text:
                text_parts.append(rule_text)
    else:
        rules_data = getattr(policy, 'rules', None)
        if rules_data:
            try:
                rules = json.loads(rules_data)
                for rule in rules:
                    rule_text = rule.get('rule_text', '')
                    if rule_text:
                        text_parts.append(rule_text)
            except (json.JSONDecodeError, TypeError):
                pass
    
    return " ".join(text_parts)


def _retrieve_relevant_policies(
    query: str,
    compliance_policies: List[CompliancePolicy],
    client,
    top_k: int = 3
) -> List[CompliancePolicy]:
    """Retrieve most relevant policies using RAG with cosine similarity."""
    if not compliance_policies or not settings.api_key:
        return compliance_policies[:top_k] if compliance_policies else []
    
    try:
        # Get query embedding
        query_embedding = _get_embedding(query, client)
        if not query_embedding:
            # Fallback: prioritize policies with actual rules
            policies_with_rules = [p for p in compliance_policies 
                                 if hasattr(p, 'parsed_rules') and p.parsed_rules and len(p.parsed_rules) > 0]
            if policies_with_rules:
                return policies_with_rules[:top_k]
            return compliance_policies[:top_k]
        
        # Calculate similarity scores for each policy
        policy_scores = []
        for policy in compliance_policies:
            policy_text = _build_policy_text(policy)
            if not policy_text.strip():
                continue
            
            policy_embedding = _get_embedding(policy_text, client)
            if policy_embedding:
                similarity = _cosine_similarity(query_embedding, policy_embedding)
                
                # Boost policies with actual rules when query mentions "rule" or "rules"
                query_lower = query.lower()
                has_rules = hasattr(policy, 'parsed_rules') and policy.parsed_rules and len(policy.parsed_rules) > 0
                if ("rule" in query_lower or "rules" in query_lower) and has_rules:
                    similarity += 0.2  # Boost policies with rules
                
                policy_scores.append((similarity, policy))
        
        # Sort by similarity and return top_k
        policy_scores.sort(key=lambda x: x[0], reverse=True)
        relevant_policies = [policy for _, policy in policy_scores[:top_k]]
        
        # If query is about rules, ensure we include policies with actual rules
        query_lower = query.lower()
        if "rule" in query_lower or "rules" in query_lower:
            policies_with_rules = [p for p in compliance_policies 
                                 if hasattr(p, 'parsed_rules') and p.parsed_rules and len(p.parsed_rules) > 0]
            # If we don't have enough policies with rules in results, add them
            for policy in policies_with_rules:
                if policy not in relevant_policies and len(relevant_policies) < top_k:
                    relevant_policies.append(policy)
        
        # If we have fewer than top_k, fill with remaining policies
        if len(relevant_policies) < top_k:
            remaining = [p for p in compliance_policies if p not in relevant_policies]
            relevant_policies.extend(remaining[:top_k - len(relevant_policies)])
        
        return relevant_policies if relevant_policies else compliance_policies[:top_k]
    except Exception as e:
        import logging
        logging.error(f"RAG retrieval error: {e}")
        # Fallback: prioritize policies with rules
        policies_with_rules = [p for p in compliance_policies 
                             if hasattr(p, 'parsed_rules') and p.parsed_rules and len(p.parsed_rules) > 0]
        if policies_with_rules:
            return policies_with_rules[:top_k]
        return compliance_policies[:top_k]


def _build_policy_context(compliance_policies: list) -> str:
    """Build comprehensive policy context string for LLM with all rules."""
    if not compliance_policies:
        return "No compliance policies are currently assigned."
    
    context_parts = []
    for policy in compliance_policies:
        category = getattr(policy, 'category', None)
        policy_text = f"Category: {category or 'Uncategorized'}\n"
        policy_text += f"Title: {policy.title}\n"
        policy_text += f"Department: {policy.department}\n"
        policy_text += f"Due Date: {policy.due_date.strftime('%Y-%m-%d')}\n"
        
        if policy.description:
            policy_text += f"Description: {policy.description}\n"
        
        # Add all rules - safely handle missing rules attribute
        if hasattr(policy, 'parsed_rules') and policy.parsed_rules:
            policy_text += "Rules:\n"
            for rule in policy.parsed_rules:
                rule_num = rule.get('rule_number', '')
                rule_text = rule.get('rule_text', '')
                if rule_num:
                    policy_text += f"{rule_num}. {rule_text}\n"
                else:
                    policy_text += f"- {rule_text}\n"
        else:
            # Fallback: try to parse if not already parsed
            rules_data = getattr(policy, 'rules', None)
            if rules_data:
                try:
                    rules = json.loads(rules_data)
                    if rules:
                        policy_text += "Rules:\n"
                        for rule in rules:
                            rule_num = rule.get('rule_number', '')
                            rule_text = rule.get('rule_text', '')
                            if rule_num:
                                policy_text += f"{rule_num}. {rule_text}\n"
                            else:
                                policy_text += f"- {rule_text}\n"
                except (json.JSONDecodeError, TypeError):
                    pass
        
        context_parts.append(policy_text)
    
    return "\n---\n".join(context_parts)


def _rule_based_response(
    request: ChatbotRequest,
    current_user: User,
    compliance_policies: list | None = None,
) -> ChatbotResponse:
    """Fallback when API key is missing or LLM call fails."""
    message = request.message.lower()

    if re.search(r"how.*apply.*leave|apply.*leave|leave.*application", message):
        return ChatbotResponse(
            response="To apply for leave, go to your dashboard and click on 'Apply for Leave'. "
                    "Fill in the from date, to date, and reason. Your manager will review and approve it."
        )
    
    if re.search(r"compliance|policy|policies", message):
        if compliance_policies:
            # Check if asking about specific category
            category_match = None
            for cat in ["hr compliance", "responsible ai", "it security", "financial conduct"]:
                if cat in message:
                    category_match = cat
                    break
            
            if category_match:
                # Find policies matching the category
                matching_policies = [
                    p for p in compliance_policies 
                    if getattr(p, 'category', None) and category_match.lower() in getattr(p, 'category', '').lower()
                ]
                if matching_policies:
                    policy = matching_policies[0]
                    category = getattr(policy, 'category', 'Uncategorized')
                    parts = [f"**{policy.title}** ({category})"]
                    if policy.description:
                        parts.append(f"Description: {policy.description}")
                    parts.append(f"Due Date: {policy.due_date.strftime('%Y-%m-%d')}")
                    if hasattr(policy, 'parsed_rules') and policy.parsed_rules:
                        parts.append("\nRules:")
                        for rule in policy.parsed_rules:
                            rule_num = rule.get('rule_number', '')
                            rule_text = rule.get('rule_text', '')
                            if rule_num:
                                parts.append(f"{rule_num}. {rule_text}")
                            else:
                                parts.append(f"- {rule_text}")
                    return ChatbotResponse(response="\n".join(parts))
            
            # General policy list
            parts = [
                "Here are your assigned compliance policies:",
                *[f"• {p.title} ({getattr(p, 'category', None) or 'Uncategorized'}) - Due: {p.due_date.strftime('%Y-%m-%d')}" 
                  for p in compliance_policies[:10]],
                "\nYou can ask me about specific policies or rules. For example:",
                "- 'What are the HR Compliance rules?'",
                "- 'Tell me about IT Security Policy'",
                "- 'What is rule 5 in Financial Conduct Policy?'",
                "\nGo to **Compliance & Policies** from your dashboard to view full details."
            ]
            return ChatbotResponse(response="\n".join(parts))
        return ChatbotResponse(
            response=f"Based on your role as {current_user.role} in {current_user.department}, "
                    f"go to **Compliance & Policies** from your dashboard to view your assigned policies. "
                    f"You can open it from the Compliance card or the Compliance & Policies link."
        )
    
    if re.search(r"course|learning|recommend|training|skill", message):
        return ChatbotResponse(
            response=f"Based on your skills and department ({current_user.department}), "
                    f"check the 'Learning Recommendations' section on your dashboard. "
                    f"The AI system recommends courses tailored to your role and expertise."
        )
    
    if re.search(r"hello|hi|hey|greet", message):
        return ChatbotResponse(
            response=f"Hello {current_user.name}! I'm Echo, your assistant. "
                    f"How can I help you today? I can assist with leave applications, "
                    f"compliance policies, and learning recommendations."
        )
    
    if re.search(r"dashboard|personalize|customize", message):
        return ChatbotResponse(
            response="You can personalize your dashboard by toggling the cards on or off. "
                    "Go to the personalization panel on your dashboard to show or hide "
                    "Leave Status, Learning Recommendations, and Compliance Reminders."
        )
    
    return ChatbotResponse(
        response="I'm Echo, your assistant. I can help you with leave applications, "
                "compliance policies, learning recommendations, and dashboard personalization. "
                "What would you like to know?"
    )


@router.post("/echo", response_model=ChatbotResponse)
def echo_chatbot(
    request: ChatbotRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    compliance_policies = _get_user_policies(db, current_user)

    if settings.api_key and settings.api_key.strip():
        try:
            from openai import OpenAI
            client = OpenAI(api_key=settings.api_key.strip())
            
            # Use RAG to retrieve most relevant policies based on query
            # Only use RAG for policy-related queries to save API calls
            query_lower = request.message.lower()
            is_policy_query = any(keyword in query_lower for keyword in [
                'policy', 'policies', 'compliance', 'rule', 'rules', 'hr compliance',
                'ai policy', 'it security', 'financial', 'conduct'
            ])
            
            if is_policy_query and compliance_policies:
                # Retrieve top 3 most relevant policies using RAG
                relevant_policies = _retrieve_relevant_policies(
                    request.message,
                    compliance_policies,
                    client,
                    top_k=3
                )
                # Build context only from relevant policies
                policy_context = _build_policy_context(relevant_policies)
            else:
                # For non-policy queries, use all policies or just a few
                policy_context = _build_policy_context(compliance_policies[:5])
            
            # Build role-specific context
            role_context = ""
            if current_user.role == "employee":
                role_context = "The user is an employee. Focus on their assigned policies, leave applications, and learning opportunities."
            elif current_user.role == "manager":
                role_context = "The user is a manager. They can view team policies, approve leaves, and manage their team."
            elif current_user.role == "hr":
                role_context = "The user is an HR admin. They have full access to all policies and administrative functions."
            
            system_prompt = (
                f"You are Echo, the WorkHub employee portal assistant.\n"
                f"User: {current_user.name}\n"
                f"Role: {current_user.role}\n"
                f"Department: {current_user.department}\n\n"
                f"{role_context}\n\n"
                f"IMPORTANT: You MUST ONLY answer policy questions using the exact policy information provided below. "
                f"DO NOT make up, guess, or hallucinate any policy details. If information is not in the provided policies, "
                f"say 'I don't have that specific information in the policies available to me. Please check the Compliance & Policies section on your dashboard.'\n\n"
                f"Available Compliance Policies:\n{policy_context}\n\n"
                f"You can also help with: leave applications (how to apply, where to go), "
                f"learning/courses and recommendations, and dashboard personalization. "
                f"Keep answers brief, accurate, and based only on the provided information. "
                f"When answering policy questions, cite specific rules by number when relevant."
            )
            
            completion = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": request.message},
                ],
                max_tokens=512,  # Increased for detailed policy answers
                temperature=0.3,  # Lower temperature for more factual, less creative responses
            )
            if completion.choices and len(completion.choices) > 0:
                content = (completion.choices[0].message.content or "").strip()
                if content:
                    return ChatbotResponse(response=content)
        except Exception as e:
            # Log error but fall through to rule-based response
            import logging
            logging.error(f"Chatbot LLM error: {e}")
            pass
    
    return _rule_based_response(request, current_user, compliance_policies=compliance_policies)
