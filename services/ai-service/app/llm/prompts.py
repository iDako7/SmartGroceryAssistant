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


def build_item_info_prompt(name_en: str, name_zh: str | None = None, language_preference: str = "en") -> list[dict]:
    # todo this is a simple version; needs improvement later
    item_name = f"{name_en} / {name_zh}" if name_zh else name_en

    lang_instruction = ""
    if language_preference == "en-zh":
        lang_instruction = " Write each field in English followed by Chinese translation."
    elif language_preference == "zh":
        lang_instruction = " Write each field in Chinese."

    return [
        {
            "role": "system",
            "content": "You are a grocery expert helping someone understand food products.",
        },
        {
            "role": "user",
            "content": (
                f'Provide information about this grocery item: "{item_name}".{lang_instruction}\n'
                f"Respond with ONLY valid JSON:\n"
                f'{{"taste": "1-2 sentences about flavor/texture", '
                f'"usage": "1-2 sentences about common uses", '
                f'"picking": "1-2 sentences about how to pick good ones", '
                f'"storage": "1-2 sentences about storage tips", '
                f'"funFact": "1 fun/interesting fact"}}'
            ),
        },
    ]
