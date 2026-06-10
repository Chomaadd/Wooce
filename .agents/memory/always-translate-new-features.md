---
name: Always add EN translation when building new features
description: Mad's rule — every new feature must include its English translation in i18n.ts immediately, not as a separate follow-up step.
---

## Rule

Whenever a new feature is added to the WOOCE Novel platform, **immediately** add the corresponding English (`en`) translation keys in `client/src/lib/i18n.ts` alongside the Indonesian (`id`) keys — in the same task, same code edit, never deferred.

**Why:** Mad explicitly asked for this to avoid double work. Translations added late get missed or require a separate session just to translate UI strings. Doing it upfront is zero extra effort during development.

**How to apply:**
- Any new UI string that uses `t("some.key")` must have BOTH `en` and `id` entries in `translations` in `i18n.ts`.
- Check the existing key naming convention in `i18n.ts` (dot-namespaced, e.g. `"coins.history.title"`) and follow it.
- If the feature adds new page titles, button labels, status messages, error texts, or empty states — ALL of them need both language entries.
- Never ship a new feature with only the Indonesian (`id`) translations.
