import { JSXElement, Show } from "solid-js";

import { getLoginPageInputsEnabled } from "../../../states/login";
import { Page } from "../../common/Page";
import { RollLogin } from "./RollLogin";

export function LoginPage(): JSXElement {
  return (
    <Page id="login">
      <Show when={!getLoginPageInputsEnabled()}>
        <div class="fixed top-1/2 left-1/2 z-1 -translate-x-1/2 -translate-y-1/2 text-3xl text-main transition-opacity duration-250">
          <i class="fas fa-fw fa-spin fa-circle-notch"></i>
        </div>
      </Show>
      <div class="flex h-full flex-col items-center justify-around gap-4">
        <RollLogin />
      </div>
    </Page>
  );
}
