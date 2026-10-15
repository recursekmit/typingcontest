import { For, JSXElement } from "solid-js";

import { Button } from "../common/Button";
import { Page } from "../common/Page";
import { CommandlineHotkey } from "../hotkeys/CommandlineHotkey";
import { QuickRestartHotkey } from "../hotkeys/QuickRestartHotkey";

const CODENOVATE_STATS = [
  ["376", "teams registered"],
  ["61", "finalist teams"],
  ["239", "on-site builders"],
  ["58K+", "unstop impressions"],
] as const;

const EVENTS = [
  ["oct 2024", "play", "CodeCharades", "Technical vocabulary meets charades."],
  [
    "mar 2025",
    "play",
    "Prompt Quest",
    "Creative thinking and precise prompts.",
  ],
  [
    "sep 2025",
    "community",
    "CIG Launch",
    "Three interest groups, 65 members on day one.",
  ],
  [
    "sep 2025",
    "community",
    "Navraas: Mystery Raas",
    "A mythology-themed social deduction game.",
  ],
  [
    "nov 2025",
    "flagship",
    "Codenovate 2.0",
    "KMIT's national 24-hour hackathon.",
  ],
  [
    "jan 2026",
    "workshop",
    "FS Guidance Session",
    "Placement and Grand Test strategy with seniors.",
  ],
  [
    "mar 2026",
    "workshop",
    "DBS: Placements & Beyond",
    "Industry speakers on recruitment and culture.",
  ],
  [
    "apr 2026",
    "workshop",
    "ReBoot I",
    "A full day of LLMs, RAG and hands-on work.",
  ],
  [
    "apr 2026",
    "play",
    "KBC x Subway Surfers",
    "A code quiz hot seat and an IRL endless run.",
  ],
  [
    "sep 2026",
    "play",
    "Break the Bot",
    "Prompt injection across three levels.",
  ],
] as const;

const GROUPS = [
  ["web development", "Git, GitHub, deployment and hackathon-ready builds."],
  ["ai", "From ML basics to neural networks."],
  [
    "dsa / competitive programming",
    "Arrays to advanced patterns, easy to hard.",
  ],
  ["cybersecurity", "Network security, cryptography, ethical hacking."],
  ["devops", "CI/CD, containers and infrastructure as code."],
] as const;

function Kicker(props: { num: string; text: string }): JSXElement {
  return (
    <p class="recurse-kicker">
      <span>{props.num}</span> {props.text}
    </p>
  );
}

export function AboutPage(): JSXElement {
  return (
    <Page id="about">
      <div class="content-grid grid gap-16" data-ui-element="recurseAbout">
        <section>
          <p class="recurse-kicker">&gt; recurse.about --type</p>
          <h1 class="recurse-display">
            recurse<span>type.</span>
          </h1>
          <p class="recurse-lead">
            The typing test by Recurse, the technical club of Keshav Memorial
            Institute of Technology, Hyderabad. Built by the terminally curious.
          </p>
        </section>

        <section class="recurse-split">
          <div>
            <Kicker num="01" text="what is recurse type" />
            <h2 class="recurse-heading">
              type fast.<span>type clean.</span>
            </h2>
          </div>
          <div class="recurse-copy">
            <p>
              Recurse Type is a minimal, customizable typing test. Pick a mode,
              start typing, and get instant feedback on speed, accuracy and
              consistency, letter by letter.
            </p>
            <p>
              Time, words, quote, zen and custom modes. Dozens of themes,
              languages, sounds, caret styles and a full command line, so you
              never need to touch your mouse.
            </p>
          </div>
        </section>

        <section class="recurse-split">
          <div>
            <Kicker num="02" text="why recurse exists" />
            <h2 class="recurse-heading">
              the curriculum is<span>only the start.</span>
            </h2>
          </div>
          <div class="recurse-copy">
            <p>
              Recurse gives KMIT students the room, resources and people to
              pursue computer science and electronics beyond the classroom.
              Learn from peers, ship ambitious ideas, compete at a higher level
              and find the people who care about the same obscure problem you
              do.
            </p>
            <div class="recurse-disciplines">
              <article>
                <span>01a</span>
                <h3>compute</h3>
                <p>Programming · AI/ML · Web · Security · Competitive coding</p>
              </article>
              <article>
                <span>01b</span>
                <h3>engineer</h3>
                <p>Electronics · IoT · Circuits · Embedded · Hardware</p>
              </article>
            </div>
          </div>
        </section>

        <section>
          <Kicker num="03" text="flagship · national hackathon" />
          <h2 class="recurse-heading">
            codenovate.<span>one problem. a thousand ways in.</span>
          </h2>
          <p class="recurse-lead">
            The Recurse national 24-hour hackathon, open to B.Tech students
            across India: collaborative teams, eight problem statements and real
            execution under pressure.
          </p>
          <div class="recurse-stats">
            <For each={CODENOVATE_STATS}>
              {([value, label]) => (
                <article>
                  <strong>{value}</strong>
                  <span>{label}</span>
                </article>
              )}
            </For>
          </div>
          <p class="recurse-note">
            Codenovate 2.0 · November 2025 · ₹75,000 total prize pool
          </p>
        </section>

        <section>
          <Kicker num="04" text="events --log --chronological" />
          <h2 class="recurse-heading">
            every commit<span>since we started.</span>
          </h2>
          <ol class="recurse-log">
            <For each={EVENTS}>
              {([date, tag, name, blurb], i) => (
                <li>
                  <span class="recurse-log__num">
                    {String(i() + 1).padStart(3, "0")}
                  </span>
                  <span class="recurse-log__date">{date}</span>
                  <span class="recurse-log__tag">{tag}</span>
                  <h3>{name}</h3>
                  <p>{blurb}</p>
                </li>
              )}
            </For>
          </ol>
        </section>

        <section class="recurse-split">
          <div>
            <Kicker num="05" text="groups.connect()" />
            <h2 class="recurse-heading">
              obsess over<span>something together.</span>
            </h2>
            <p class="recurse-note">
              65 members joined at the September 2025 introductory meet.
            </p>
          </div>
          <div class="recurse-groups">
            <For each={GROUPS}>
              {([name, blurb], i) => (
                <article>
                  <span>group_{String(i() + 1).padStart(2, "0")}</span>
                  <h3>{name}</h3>
                  <p>{blurb}</p>
                </article>
              )}
            </For>
          </div>
        </section>

        <section class="recurse-split">
          <div>
            <Kicker num="06" text="how it works" />
            <h2 class="recurse-heading">
              the numbers<span>explained.</span>
            </h2>
          </div>
          <div class="recurse-copy">
            <p>
              Restart any time with <QuickRestartHotkey />. Open the command
              line with <CommandlineHotkey /> to change any setting from the
              keyboard. Tests use the 200 most common English words by default;
              switch to 1k words or another language in settings.
            </p>
            <dl class="recurse-defs">
              <dt>wpm</dt>
              <dd>
                Characters in correctly typed words (spaces included), divided
                by 5 and scaled to one minute.
              </dd>
              <dt>raw</dt>
              <dd>Same as wpm, but incorrect words count too.</dd>
              <dt>acc</dt>
              <dd>Share of key presses that were correct.</dd>
              <dt>characters</dt>
              <dd>Correct / incorrect / extra / missed, counted at the end.</dd>
              <dt>consistency</dt>
              <dd>
                How steady your raw speed was across the test. Closer to 100% is
                steadier.
              </dd>
            </dl>
          </div>
        </section>

        <section>
          <Kicker num="07" text="next_member --you" />
          <h2 class="recurse-heading">
            don&apos;t just<span>watch the loop.</span>
          </h2>
          <p class="recurse-lead">
            Bring the curiosity. Recurse brings the people, the problems and a
            reason to build something bigger. Found a bug or want a feature?
            Reach the team here.
          </p>
          <div class="mt-6 grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button
              text="instagram"
              fa={{ icon: "fa-instagram", variant: "brand" }}
              href="https://www.instagram.com/recurse.official/"
              class="w-full p-6"
            />
            <Button
              text="email"
              fa={{ icon: "fa-envelope" }}
              href="mailto:recurse@kmit.in"
              class="w-full p-6"
            />
            <Button
              text="recurse.qzz.io"
              fa={{ icon: "fa-globe" }}
              href="https://recurse.qzz.io"
              class="w-full p-6"
            />
            <Button
              text="github"
              fa={{ icon: "fa-github", variant: "brand" }}
              href="https://github.com/aditya36900/monkeytype"
              class="w-full p-6"
            />
          </div>
        </section>

        <section class="recurse-credit">
          <p>© Recurse / KMIT · code. build. break. repeat.</p>
          <p>
            Open source under GPL-3.0, built on the open-source Monkeytype
            typing engine.
          </p>
        </section>
      </div>
    </Page>
  );
}
