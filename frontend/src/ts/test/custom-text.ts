import { CustomTextLimitMode, CustomTextMode } from "@monkeytype/schemas/util";
import { LocalStorageWithSchema } from "../utils/local-storage-with-schema";
import { z } from "zod";
import {
  CustomTextSettings,
  CustomTextSettingsSchema,
} from "@monkeytype/schemas/results";
import {
  DEFAULT_FESTIVE_TEXT_NAME,
  festiveTexts,
  FESTIVE_TEXTS_VERSION,
  previousFestiveTextNames,
} from "@monkeytype/util/festive-texts";

const CustomTextObjectSchema = z.record(z.string(), z.string());
type CustomTextObject = z.infer<typeof CustomTextObjectSchema>;

const CustomTextLongObjectSchema = z.record(
  z.string(),
  z.object({ text: z.string(), progress: z.number() }),
);
type CustomTextLongObject = z.infer<typeof CustomTextLongObjectSchema>;

const customTextLS = new LocalStorageWithSchema({
  key: "customText",
  schema: CustomTextObjectSchema,
  fallback: {},
});
//todo maybe add migrations here?
const customTextLongLS = new LocalStorageWithSchema({
  key: "customTextLong",
  schema: CustomTextLongObjectSchema,
  fallback: {},
});

type CustomTextLimit = z.infer<typeof CustomTextSettingsSchema>["limit"];

const OLD_DEFAULT_TEXT = "The quick brown fox jumps over the lazy dog";
const defaultFestiveWords = (
  festiveTexts[DEFAULT_FESTIVE_TEXT_NAME] ?? OLD_DEFAULT_TEXT
).split(" ");

const defaultCustomTextSettings: CustomTextSettings = {
  text: defaultFestiveWords,
  mode: "repeat",
  limit: { value: defaultFestiveWords.length, mode: "word" },
  pipeDelimiter: false,
};

const customTextSettings = new LocalStorageWithSchema({
  key: "customTextSettings",
  schema: CustomTextSettingsSchema,
  fallback: defaultCustomTextSettings,
  migrate: (oldData, _zodIssues) => {
    const fallback = structuredClone(defaultCustomTextSettings);

    if (typeof oldData !== "object" || oldData === null) {
      return fallback;
    }
    const migratedData = fallback;
    if (
      "text" in oldData &&
      z.array(z.string()).safeParse(migratedData.text).success
    ) {
      migratedData.text = oldData["text"] as string[];
    }
    return migratedData;
  },
});

export function getText(): string[] {
  return customTextSettings.get().text;
}

export function setText(txt: string[]): void {
  const currentSettings = customTextSettings.get();
  customTextSettings.set({
    ...currentSettings,
    text: txt,
    limit: { value: txt.length, mode: currentSettings.limit.mode },
  });
}

export function getMode(): CustomTextMode {
  const currentSettings = customTextSettings.get();
  return currentSettings.mode;
}

export function setMode(val: CustomTextMode): void {
  const currentSettings = customTextSettings.get();
  customTextSettings.set({
    ...currentSettings,
    mode: val,
    limit: {
      value: currentSettings.text.length,
      mode: currentSettings.limit.mode,
    },
  });
}

export function getLimit(): CustomTextLimit {
  return customTextSettings.get().limit;
}

export function getLimitValue(): number {
  return customTextSettings.get().limit.value;
}

export function getLimitMode(): CustomTextLimitMode {
  return customTextSettings.get().limit.mode;
}

export function setLimitValue(val: number): void {
  const currentSettings = customTextSettings.get();
  customTextSettings.set({
    ...currentSettings,
    limit: { value: val, mode: currentSettings.limit.mode },
  });
}

export function setLimitMode(val: CustomTextLimitMode): void {
  const currentSettings = customTextSettings.get();
  customTextSettings.set({
    ...currentSettings,
    limit: { value: currentSettings.limit.value, mode: val },
  });
}

export function getPipeDelimiter(): boolean {
  return customTextSettings.get().pipeDelimiter;
}

export function setPipeDelimiter(val: boolean): void {
  const currentSettings = customTextSettings.get();
  customTextSettings.set({
    ...currentSettings,
    pipeDelimiter: val,
  });
}

export function getData(): CustomTextSettings {
  return customTextSettings.get();
}

export function getCustomText(name: string, long = false): string[] {
  if (long) {
    const customTextLong = getLocalStorageLong();
    const customText = customTextLong[name];
    if (customText === undefined) {
      throw new Error(`Custom text ${name} not found`);
    }
    return customText.text.split(/ +/);
  } else {
    const customText = getLocalStorage()[name];
    if (customText === undefined) {
      throw new Error(`Custom text ${name} not found`);
    }
    return customText.split(/ +/);
  }
}

export function setCustomText(
  name: string,
  text: string | string[],
  long = false,
): boolean {
  if (long) {
    const customText = getLocalStorageLong();

    customText[name] = {
      text: "",
      progress: 0,
    };

    const textByName = customText[name];
    if (textByName === undefined) {
      throw new Error("Custom text not found");
    }

    if (typeof text === "string") {
      textByName.text = text;
    } else {
      textByName.text = text.join(" ");
    }

    return setLocalStorageLong(customText);
  } else {
    const customText = getLocalStorage();

    if (typeof text === "string") {
      customText[name] = text;
    } else {
      customText[name] = text.join(" ");
    }

    return setLocalStorage(customText);
  }
}

export function deleteCustomText(name: string, long: boolean): void {
  const customText = long ? getLocalStorageLong() : getLocalStorage();

  // oxlint-disable-next-line no-dynamic-delete
  delete customText[name];

  if (long) {
    setLocalStorageLong(customText as CustomTextLongObject);
  } else {
    setLocalStorage(customText as CustomTextObject);
  }
}

export function getCustomTextLongProgress(name: string): number {
  const customText = getLocalStorageLong()[name];
  if (customText === undefined) throw new Error("Custom text not found");

  return customText.progress ?? 0;
}

export function setCustomTextLongProgress(
  name: string,
  progress: number,
): void {
  const customTexts = getLocalStorageLong();
  const customText = customTexts[name];
  if (customText === undefined) throw new Error("Custom text not found");

  customText.progress = progress;
  setLocalStorageLong(customTexts);
}

function getLocalStorage(): CustomTextObject {
  return customTextLS.get();
}

function getLocalStorageLong(): CustomTextLongObject {
  return customTextLongLS.get();
}

function setLocalStorage(data: CustomTextObject): boolean {
  return customTextLS.set(data);
}

function setLocalStorageLong(data: CustomTextLongObject): boolean {
  return customTextLongLS.set(data);
}

export function getCustomTextNames(long = false): string[] {
  if (long) {
    return Object.keys(getLocalStorageLong());
  } else {
    return Object.keys(getLocalStorage());
  }
}

/**
 * add the built-in festive stories to saved texts once per version (texts the
 * user deleted stay deleted), replace the first version of the texts, and make
 * the default story the custom text for anyone still on the stock text
 */
function seedFestiveTexts(): void {
  const key = "festiveTextsSeeded";
  try {
    if (window.localStorage.getItem(key) === `${FESTIVE_TEXTS_VERSION}`) return;
    const saved = getLocalStorage();
    for (const name of previousFestiveTextNames) {
      // oxlint-disable-next-line no-dynamic-delete
      delete saved[name];
    }
    for (const [name, text] of Object.entries(festiveTexts)) {
      saved[name] ??= text;
    }
    if (getText().join(" ") === OLD_DEFAULT_TEXT) {
      setText(defaultFestiveWords);
    }
    if (setLocalStorage(saved)) {
      window.localStorage.setItem(key, `${FESTIVE_TEXTS_VERSION}`);
    }
  } catch (e) {
    console.error("Failed to seed festive texts", e);
  }
}

/**
 * show a different festive story on every visit, unless the user picked
 * their own custom text
 */
function rotateFestiveText(): void {
  try {
    const stories = Object.values(festiveTexts);
    const current = getText().join(" ");
    if (!stories.includes(current)) return;
    const others = stories.filter((story) => story !== current);
    const next = others[Math.floor(Math.random() * others.length)];
    if (next !== undefined) setText(next.split(" "));
  } catch (e) {
    console.error("Failed to rotate festive text", e);
  }
}

seedFestiveTexts();
rotateFestiveText();
