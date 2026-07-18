import logging

import tiktoken

from ..config import get_api_keys, get_llm_client_and_model
from ..schemas import WorkflowDsl

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """
You are an expert SRE (Site Reliability Engineer) and operations architect.
Your task is to analyze a raw, noisy incident transcript (which may contain Slack war room
logs, terminal command histories, logs, and discussion) and extract a highly structured,
executable Standard Operating Procedure (SOP) represented in our Workflow DSL.

Follow these strict design guidelines:
1. IDENTIFY THE SUCCESSFUL SEQUENCE:
   - Identify the actual, successful troubleshooting steps that resolved the issue.
   - Ignore trial-and-error commands that failed, unless they serve as a critical context
     warning (e.g. "Do not run command X as it causes Y").
   
2. IDENTIFY AND PARAMETERIZE VARIABLES:
   - Identify variables in commands that should be parameterized (such as IP addresses,
     hostnames, usernames, namespaces, databases, ports, and service names).
   - In the command string or content, replace the variable values with placeholder variables
     inside double curly braces: `{{VARIABLE_NAME}}`.
   - Define each variable in the global `variables` list of the DSL.
   - Variable names MUST contain ONLY uppercase alphanumeric characters and underscores,
     and start with an uppercase letter: e.g. `NAMESPACE`, `TARGET_HOST`, `PORT`.
     (Regex pattern: `^[A-Z][A-Z0-9_]*$`).
   - Do NOT include curly braces in the variable name attribute inside the `variables` list.
   - Provide a user-friendly `label` and a realistic `defaultValue` for every variable.
   - Ensure all variable names in the global variables list are completely unique.

3. MAP STEP TYPES APPROPRIATELY:
   - `command`: A terminal command string that the user copies and executes. Put the
     command string in `payload.commandString`.
   - `warning`: A warning message containing critical checks, safety precautions, or
     instructions. Use `payload.warningLevel` (must be either "info", "warning", or
     "critical").
   - `verification`: A step to verify the outcome of a preceding action.
   - `checkbox`: A simple checklist item for manual verifications.
   - `input`: An input query or request step.

4. POPULATE DSL FIELDS PRECISELY:
   - The DSL must be valid under the following schemas:
     - `version`: A version string like "1.0.0".
     - `metadata`: Contains `title`, `description`, `targetEnvironment` (e.g. "production",
       "staging"), and `estimatedDuration` in minutes.
     - `variables`: A unique list of variables with `name`, `label`, `type` ("string",
       "number", "boolean"), `defaultValue`, and optional `validationRegex`.
     - `steps`: A list of steps. Each step must contain `id` (only alphanumeric, dashes,
       and underscores: `^[a-zA-Z0-9_-]+$`), `type`, `title`, `content` (description
       of what this step does), and optional `payload` dict.

5. ACCURACY AND CONSTRAINTS:
   - Never invent or hallucinate commands that were not present or directly implied in
     the transcript.
   - Translate all instructions and extracted context into professional, clear
     operational steps.
"""


def count_tokens(text: str, model_encoding: str = "cl100k_base") -> int:
    """
    Returns the number of tokens in a text string using tiktoken.
    """
    try:
        encoding = tiktoken.get_encoding(model_encoding)
        return len(encoding.encode(text))
    except Exception as e:
        logger.error(f"Error counting tokens: {e}")
        # Simple fallback character count ratio approximation
        return len(text) // 4


def truncate_transcript(text: str, max_tokens: int = 60000) -> str:
    """
    Safely truncates the middle of a transcript if it exceeds the maximum token limit.
    Preserves the start (context) and end (resolution) of the logs.
    """
    num_tokens = count_tokens(text)
    if num_tokens <= max_tokens:
        return text

    logger.info(f"Transcript has {num_tokens} tokens, truncating to fit within {max_tokens} limit.")

    # Split by line to keep formatting intact
    lines = text.splitlines()
    if not lines:
        return text

    # Middle-out truncation
    # Keep adding lines from start and end until we hit token threshold
    start_lines = []
    end_lines = []

    start_idx = 0
    end_idx = len(lines) - 1

    current_tokens = 0
    # Reserve some buffer tokens (approx 200 tokens)
    budget = max_tokens - 200

    while start_idx <= end_idx:
        # Check start line
        start_line = lines[start_idx]
        start_tokens = count_tokens(start_line)

        # Check end line if index is different
        end_line = lines[end_idx] if start_idx != end_idx else ""
        end_tokens = count_tokens(end_line)

        if current_tokens + start_tokens + end_tokens > budget:
            break

        start_lines.append(start_line)
        start_idx += 1
        current_tokens += start_tokens

        if start_idx <= end_idx and end_line:
            end_lines.insert(0, end_line)
            end_idx -= 1
            current_tokens += end_tokens

    truncated_msg = "[... REDUNDANT LOG LINES TRUNCATED FOR CONTEXT WINDOW OPTIMIZATION ...]"
    return "\n".join(start_lines + [truncated_msg] + end_lines)


def extract_sop_from_transcript(transcript: str, api_key: str) -> WorkflowDsl:
    """
    Invokes OpenAI Chat Completions API with JSON mode to parse SOP from raw logs.
    """
    if not api_key:
        raise ValueError("OpenAI API Key is required but was not provided.")

    # 1. Truncate transcript to fit context window budget
    safe_transcript = truncate_transcript(transcript, max_tokens=60000)

    import json

    schema_dump = json.dumps(WorkflowDsl.model_json_schema())
    detailed_system_prompt = (
        SYSTEM_PROMPT + "\n\nYou MUST respond with a JSON object that strictly conforms "
        f"to this JSON Schema:\n{schema_dump}"
    )

    # 2. Call OpenAI Chat Completions with response_format={"type": "json_object"}
    # using fallback rotation
    keys = get_api_keys(api_key)
    if not keys:
        raise ValueError("No valid API keys found in the provided configuration.")

    last_error = None
    for key in keys:
        try:
            client, model_name = get_llm_client_and_model(key)
            completion = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": detailed_system_prompt},
                    {"role": "user", "content": safe_transcript},
                ],
                response_format={"type": "json_object"},
                temperature=0.1,
            )

            content = completion.choices[0].message.content
            if not content:
                raise RuntimeError("OpenAI returned an empty completion response.")

            parsed_dsl = WorkflowDsl.model_validate_json(content)
            return parsed_dsl

        except Exception as e:
            logger.warning(f"LLM SOP extraction failed with key starting with {key[:10]}...: {e}")
            last_error = e

    logger.exception("All API keys failed during LLM SOP extraction parsing")
    raise RuntimeError(
        f"LLM compilation failed (all keys exhausted): {str(last_error)}"
    ) from last_error
