# Bedun (ᠪᡝᡩᡠᠨ)

## Introduction

The Manchu language (ᠮᠠᠨᠵᡠ ᡤᡳᠰᡠᠨ) is a critically endangered Tungusic language native to Northeast China and traditionally spoken by the Manchu ethnic group. According to the [Endangered Languages Project](https://www.endangeredlanguages.com/lang/1205?hl=en), there's less than 20 estimated native speakers of the language still alive. However, with a virtual treasure trove of sources from the Qing Dynasty that have yet to be translated, to lose the Manchu language would be a travesty. Bedun is my attempt to contribute to the preservation effort. Bedun means "sturdy" or "solidly made" in Manchu, and it's my hope that this web application can be a reliable tool for aspiring Manjurists like the name suggests.

Bedun is a simple, open source Manchu dictionary and practice tool. It lets you search in English, Romanized Manchu, or Manchu script, view results, and practice the alphabet.


## Features


### Multifaceted Word Search

With Bedun, you can explore Manchu vocabulary in three ways:

- **Manchu Script**: Input a word in the Manchu script, and Bedun will promptly display its meaning and Romanization.
- **Romanized Manchu**: Enter the Romanized version of a word, and Bedun will provide you with its corresponding Manchu script and English translation.
- **English**: Search for Manchu words by inputting their English translations.


### Buleku

Links to [Buleku](https://buleku.org/home) are included for quick cross-reference. Buleku focuses on Romanized Manchu; Bedun also shows Manchu script.


### Vertical Manchu Script

Click "Vertical" on a result to open a larger view. Most browsers render vertical-rl. Safari renders horizontally.

### Fonts and Theme

You can choose from several Manchu fonts and switch between light and dark mode. Fonts courtesy of resources linked by the [Manchu Studies Group](https://www.manchustudiesgroup.org/typing-manchu/).

### Smarter Ranking & Highlighting

Search results rank by relevance (exact, starts-with, whole-word, fuzzy). Matches are highlighted. You can press Enter to search and Esc to clear.

### Learn

The Learn tab shows an alphabet grid (letters and digraphs) and a practice input. Type Romanized Manchu to see live script. Click any tile to insert its romanized key. There's also a link to an alphabet PDF.

### Live Transliteration Preview

When searching by Romanized Manchu, a small preview shows the script as you type.

### Copy and Export

- Each card has a copy button for the Manchu script
- "Copy Results" copies a CSV: romanized, english, manchu

<!-- Word Lists feature removed for now. -->

## Getting Started

1. Go to [bedun.org](https://bedun.org).
2. Explore Manchu words and their meanings using your preferred search method.
3. Click "Open in Buleku" on any card to view details.
4. Enhance your understanding of Manchu script with the vertical overlay (Safari renders horizontal).

### Local development

Browsers block `fetch()` from `file://`. Run a local web server from the project root, then open the shown URL (e.g., `http://localhost:5173`).

```bash
python3 -m http.server 5173
```


## Contributing

Issues and pull requests are welcome. Feel free to fork and reuse parts of the project.

## Disclaimer

It is essential to acknowledge that Bedun is a work in progress and far from being authoritative or perfect. Please feel free to report any bugs or request any new features under `Issues`.

---
**Please Note** that Bedun is not affiliated with Buleku or Manc.hu. All referenced trademarks and resources are the property of their respective owners. Bedun is a student project created for educational purposes, and it is not intended for commercial use. It is developed with the aim of assisting individuals in their language learning and research endeavors related to the Manchu language. The project's primary goal is to contribute to the preservation and accessibility of the Manchu language and its cultural heritage.
