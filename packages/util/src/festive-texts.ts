/**
 * Navratri / Dussehra stories. Seeded into every visitor's saved custom texts,
 * used as the default custom text (frontend custom-text.ts) and as 1v1 race
 * texts (backend races). Same stories as quotes 7771-7780 in
 * frontend/static/quotes/english.json.
 */
export const festiveTexts: Record<string, string> = {
  "Navratri 1 - The First Lamp":
    'Meera\'s grandmother struck the match just as the sun went down. The tiny flame caught the wick of the brass lamp and the whole room turned gold. "Nine nights," she whispered, placing a red hibiscus at the feet of the goddess. "Nine nights to remember that light always finds its way back." Outside, somewhere down the lane, the first dhol of the season began to beat.',
  "Navratri 2 - Garba Under the Stars":
    "By ten o'clock the ground was a sea of mirrors and color. Arjun had promised himself he would only watch, but the circle swept past, someone pressed two dandiya sticks into his hands, and suddenly he was inside the rhythm. Clack, step, turn, clack. He missed a beat, laughed, caught the next one, and did not stop dancing until the moon was high above the tents.",
  "Navratri 3 - Nine Colors":
    "Every morning of Navratri, Priya checked the color calendar taped to her cupboard door. Yellow, green, grey, orange, white, red, royal blue, pink, and finally purple. Nobody at college planned it, yet everyone matched. By the fifth day the whole canteen looked like a rainbow that had sat down for chai and started arguing about whose samosa was crispier.",
  "Navratri 4 - Durga Rises":
    "The demon Mahishasura laughed when the gods came to fight him, because no god alone could defeat him. So the gods closed their eyes and poured their light into a single form. Out of the blaze stepped Durga, riding a lion, ten arms holding ten weapons. For nine days and nine nights the battle shook the sky. On the tenth morning the buffalo demon fell, and the whole world breathed again.",
  "Navratri 5 - Bathukamma by the Lake":
    "Lakshmi's mother started before sunrise, laying tangedu and gunugu flowers in circles, each ring smaller than the last, until a tower of yellow and pink stood on the brass plate. That evening the women of the colony gathered by the lake, clapping and singing around their flowers. At dusk they set the Bathukamma afloat and watched it drift away, carrying their wishes across the water.",
  "Navratri 6 - The Golu Steps":
    "Ananya's living room had nine wooden steps covered in silk, and every step was a tiny world. Gods on the top, saints just below, then a village fair, a wedding procession, and on the lowest step a plastic cricket team her little brother insisted on adding. Every evening the neighbors came to admire the dolls, sang a song, and left with a packet of sundal and a smile.",
  "Navratri 7 - Ayudha Puja in the Lab":
    "On Ayudha Puja the Recurse lab looked different. The laptops were wiped clean, the soldering iron wore a dot of kumkum, and someone had placed a marigold on top of the old server rack. Nobody pushed code that day. Instead they thanked the tools that had carried them through every late night, every failed build, and every first program that finally printed hello world.",
  "Dussehra 1 - The Bridge to Lanka":
    "Rama stood on the shore and looked across the endless water toward Lanka. Sita was waiting there, and between them lay the whole ocean. The vanaras did not give up. Stone after stone, each one marked with his name, floated on the waves, and a bridge slowly grew across the sea. When the army finally marched over it, Hanuman roared so loudly that even Ravana's golden city trembled.",
  "Dussehra 2 - Ten Heads Fall":
    "The night before Dussehra, the whole colony helped build Ravana. Bamboo for the bones, paper for the skin, and ten painted heads with angry eyebrows. The next evening the crowd went silent as the flaming arrow flew. For one long breath nothing happened. Then the effigy burst into light, crackers popping from every head, and the children cheered as if they had won the war themselves.",
  "Dussehra 3 - The Nine-Day Sprint":
    "On the first night of Navratri, the bug looked like a ten-headed demon. Every fix broke something new. So the team made a promise: one hour every night, no matter what. Some nights they moved forward, some nights they only learned what did not work. On Dussehra morning the tests finally turned green. They did not burn an effigy. They pushed the commit and called it victory.",
};

/** names used by the first version of the texts, replaced by the stories above */
export const previousFestiveTextNames: string[] = [
  "Navratri - nine nights",
  "Navratri - garba night",
  "Navratri - nine forms",
  "Navratri - dandiya raas",
  "Navratri - Durga and Mahishasura",
  "Navratri - Bathukamma",
  "Navratri - across India",
  "Dussehra - effigies",
  "Dussehra - Rama and Ravana",
  "Dussehra - nine-day sprint",
];

/** story loaded into custom mode for everyone who has not set their own text */
export const DEFAULT_FESTIVE_TEXT_NAME = "Navratri 1 - The First Lamp";

/** bump to re-seed after changing the texts */
export const FESTIVE_TEXTS_VERSION = 2;
