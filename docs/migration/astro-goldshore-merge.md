# Astro → Goldshore-AI Hardened Migration Engine

This migration system performs:

• Hash-based deterministic merges  
• Structured JSON deep merge  
• GitHub workflow deduplication  
• Asset fingerprinting + canonicalization  
• Conflict emission  
• PR description auto-generation  

End goal:
astro-goldshore → legacy archive  
goldshore-ai → single source of truth  

---

## Usage

### PLAN MODE
python3 scripts/merge/merge_engine.py \
  --target . \
  --legacy ../astro-goldshore \
  --archive legacy/astro-goldshore \
  --mode plan

### APPLY MODE
python3 scripts/merge/merge_engine.py \
  --target . \
  --legacy ../astro-goldshore \
  --archive legacy/astro-goldshore \
  --mode apply

Outputs:
reports/merge/
