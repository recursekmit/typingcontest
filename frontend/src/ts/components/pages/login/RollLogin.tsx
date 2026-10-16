import {
  PasswordSchema,
  RollLoginNameSchema,
  RollNumberSchema,
  RollPasswordSchema,
  UserEmailSchema,
} from "@monkeytype/schemas/users";
import { createForm } from "@tanstack/solid-form";
import { createSignal, JSXElement, Show } from "solid-js";

import { signInWithRollNumber, signUpWithRollNumber } from "../../../auth";
import {
  disableLoginPageInputs,
  enableLoginPageInputs,
  getLoginPageInputsEnabled,
} from "../../../states/login";
import {
  showErrorNotification,
  showNoticeNotification,
} from "../../../states/notifications";
import { Button } from "../../common/Button";
import { H3 } from "../../common/Headers";
import { InputField } from "../../ui/form/InputField";
import { SubmitButton } from "../../ui/form/SubmitButton";
import { allFieldsMandatory, fromSchema } from "../../ui/form/utils";

async function withInputsDisabled(fn: () => Promise<void>): Promise<void> {
  disableLoginPageInputs();
  try {
    await fn();
  } finally {
    enableLoginPageInputs();
  }
}

function SignInForm(): JSXElement {
  const form = createForm(() => ({
    defaultValues: {
      rollNumber: "",
      password: "",
    },
    onSubmit: async ({ value }) =>
      withInputsDisabled(async () => {
        const result = await signInWithRollNumber(
          value.rollNumber,
          value.password,
        );
        if (!result.success) {
          showErrorNotification(`Failed to sign in: ${result.message}`);
        }
      }),
    onSubmitInvalid: () => {
      showNoticeNotification("Please enter your roll number and password");
    },
    validators: {
      onChange: allFieldsMandatory(),
    },
  }));

  return (
    <form
      class="grid w-full gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <form.Field
        name="rollNumber"
        validators={{
          onChange: fromSchema(RollNumberSchema),
        }}
        children={(field) => (
          <InputField
            field={field}
            placeholder="roll number (e.g. 23BD1A0501)"
            autocomplete="username"
            maxLength={10}
            disabled={!getLoginPageInputsEnabled()}
          />
        )}
      />
      <form.Field
        name="password"
        validators={{
          onChange: fromSchema(PasswordSchema),
        }}
        children={(field) => (
          <InputField
            field={field}
            placeholder="password"
            autocomplete="current-password"
            type="password"
            disabled={!getLoginPageInputsEnabled()}
          />
        )}
      />
      <SubmitButton
        form={form}
        fa={{ icon: "fa-sign-in-alt" }}
        text="sign in"
        disabled={!getLoginPageInputsEnabled()}
      />
    </form>
  );
}

function SignUpForm(): JSXElement {
  const form = createForm(() => ({
    defaultValues: {
      rollNumber: "",
      name: "",
      email: "",
      password: "",
      passwordVerify: "",
    },
    onSubmit: async ({ value }) =>
      withInputsDisabled(async () => {
        const result = await signUpWithRollNumber(value);
        if (!result.success) {
          showErrorNotification(`Failed to sign up: ${result.message}`);
        }
      }),
    onSubmitInvalid: () => {
      showNoticeNotification("Please fill in all fields correctly");
    },
    validators: {
      onChange: allFieldsMandatory(),
    },
  }));

  return (
    <form
      class="grid w-full gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <form.Field
        name="rollNumber"
        validators={{
          onChange: fromSchema(RollNumberSchema),
        }}
        children={(field) => (
          <InputField
            field={field}
            placeholder="roll number (e.g. 23BD1A0501)"
            autocomplete="username"
            maxLength={10}
            disabled={!getLoginPageInputsEnabled()}
          />
        )}
      />
      <form.Field
        name="name"
        validators={{
          onChange: fromSchema(RollLoginNameSchema),
        }}
        children={(field) => (
          <InputField
            field={field}
            placeholder="your name"
            autocomplete="name"
            maxLength={40}
            disabled={!getLoginPageInputsEnabled()}
          />
        )}
      />
      <form.Field
        name="email"
        validators={{
          onChange: fromSchema(UserEmailSchema),
        }}
        children={(field) => (
          <InputField
            field={field}
            placeholder="email"
            autocomplete="email"
            type="email"
            disabled={!getLoginPageInputsEnabled()}
          />
        )}
      />
      <form.Field
        name="password"
        validators={{
          onChange: fromSchema(RollPasswordSchema),
        }}
        children={(field) => (
          <InputField
            field={field}
            placeholder="password (8+ characters)"
            autocomplete="new-password"
            type="password"
            disabled={!getLoginPageInputsEnabled()}
          />
        )}
      />
      <form.Field
        name="passwordVerify"
        validators={{
          onChangeListenTo: ["password"],
          onChange: (field) =>
            field.value === field.fieldApi.form.getFieldValue("password")
              ? undefined
              : "passwords do not match",
        }}
        children={(field) => (
          <InputField
            field={field}
            placeholder="verify password"
            autocomplete="new-password"
            type="password"
            disabled={!getLoginPageInputsEnabled()}
          />
        )}
      />
      <p class="text-xs text-sub">
        Your name is saved the first time you sign up and shows on the
        leaderboard.
      </p>
      <SubmitButton
        form={form}
        fa={{ icon: "fa-user-plus" }}
        text="sign up"
        disabled={!getLoginPageInputsEnabled()}
      />
    </form>
  );
}

export function RollLogin(): JSXElement {
  const [isSignUp, setIsSignUp] = createSignal(false);

  return (
    <div class="grid w-full grid-cols-1 justify-center gap-2 sm:w-80">
      <H3
        text={isSignUp() ? "sign up" : "login"}
        fa={{
          icon: isSignUp() ? "fa-user-plus" : "fa-sign-in-alt",
        }}
        class="p-0"
      />
      <Show when={isSignUp()} fallback={<SignInForm />}>
        <SignUpForm />
      </Show>
      <Button
        variant="text"
        class="text-xs"
        text={
          isSignUp()
            ? "already have an account? sign in"
            : "first time here? sign up"
        }
        disabled={!getLoginPageInputsEnabled()}
        onClick={() => setIsSignUp((v) => !v)}
      />
    </div>
  );
}
