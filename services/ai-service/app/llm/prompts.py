def build_translate_prompt(text: str) -> list[dict]:
    # todo this is a simple version; needs improvement later
    return [
        {
            "role": "system",
            "content": "You are a grocery item translator. Translate between English and Chinese Simplified.",
        },
        {
            "role": "user",
            "content": (
                f"Translate this grocery item. If the input is Chinese, provide the English name. "
                f"If the input is English, provide the Chinese Simplified name. "
                f"Always return both languages.\n"
                f'Input: "{text}"\n'
                f'Respond with ONLY valid JSON: {{"name_en": "...", "name_zh": "..."}}'
            ),
        },
    ]
