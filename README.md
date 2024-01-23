# Bedun（ᠪᡝᡩᡠᠨ）

ᠪᡝᡩᡠᠨ (Bedun) means sturdy or solidly made in Manchu, and it's my hope that this webapp can be a reliable tool for aspiring Manjurists like the name suggests.

I am starting to study Manchu so naturally I have been using [Buleku](https://buleku.org/home), an awesome dictionary app made by the folks over at [Manc.hu](https://manc.hu/en). However, one thing I found a little disappointing was the fact that Buleku only uses romanized Manchu. While I completely understand this from a logistical perspective, the Manchu script is one of the things that I find most exciting about the prospect of studying the language, so it got me thinking how nice it would be to have a site that has Manchu script too.

As such, I cobbled together Bedun which, to my knowledge, is the first tool of its kind. You can search for words using Manchu script, Romanized Manchu, or English to see the entry from "A Comprehensive Manchu-English Dictionary" (plus the Manchu script for the word, which I added). After that, if you want to see more, you can simply click the link next to "Check Buleku" and it will take you over to the entry in Buleku. You can also click the `Show Vertical` to see the Manchu script as it should be written, vertically. There's also a settings panel at the top where you can pick which font you want thanks to Panlex, which I discovered through [this awesome article](https://www.manchustudiesgroup.org/typing-manchu/).


Oh also the `.txt` file of Jerry Norman's dictionary comes from [this repo](https://github.com/purobaburi/manchu-resources) which contains a lot of good stuff. You can find my processed version (which adds Manchu script) saved as `processed_manchu.json`。 Please feel free to use it (and any other part of this project) in any capacity, as it is my hope that more and more accessible resources will lead to better preservation of this great language.

Please note that this is far from authoritative or perfect. I have already identified multiple small bugs (see issues 😂) and any issues/oddities with the original file were also inherited, e.g. it removed any Chinese in Norman's definitions.
