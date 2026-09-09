// @vitest-environment jsdom
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	social: vi.fn(),
	sendCode: vi.fn(),
	search: {
		returnTo: "/learn/audited-boundary?tab=practice#notes",
		oauthError: undefined as string | undefined,
	},
}));
vi.mock("@tanstack/react-router", () => ({
	createFileRoute: () => () => ({ useSearch: () => mocks.search }),
}));
vi.mock("@/auth/client", () => ({
	authIsConfigured: true,
	useAuth: () => ({ isLoaded: true, isSignedIn: false }),
	authClient: {
		signIn: { social: mocks.social },
		emailOtp: { sendVerificationOtp: mocks.sendCode },
	},
}));

import { LocaleProvider } from "@/i18n/provider";
import { SignInPage } from "@/routes/auth.sign-in";

describe("Google and email sign-in choices", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.clear();
		mocks.search.oauthError = undefined;
		mocks.social.mockResolvedValue({ data: { redirect: true }, error: null });
		mocks.sendCode.mockResolvedValue({ error: null });
	});
	afterEach(cleanup);
	const show = () =>
		render(
			<LocaleProvider>
				<SignInPage />
			</LocaleProvider>,
		);

	it("starts Google without an email and uses a same-origin server callback", async () => {
		show();
		fireEvent.click(
			screen.getByRole("button", { name: "Continue with Google" }),
		);
		await waitFor(() => expect(mocks.social).toHaveBeenCalledOnce());
		const options = mocks.social.mock.calls[0][0];
		const callback = new URL(options.callbackURL);
		expect(options.provider).toBe("google");
		expect(options.errorCallbackURL).toBe(options.callbackURL);
		expect(options.newUserCallbackURL).toBe(options.callbackURL);
		expect(callback.origin).toBe(window.location.origin);
		expect(callback.pathname).toBe("/auth/callback");
		expect(callback.searchParams.get("returnTo")).toBe(mocks.search.returnTo);
		expect(mocks.sendCode).not.toHaveBeenCalled();
	});

	it("blocks conflicting sign-in requests and safely recovers from provider failure", async () => {
		let reject!: (reason: Error) => void;
		mocks.social.mockImplementation(
			() =>
				new Promise((_, fail) => {
					reject = fail;
				}),
		);
		show();
		fireEvent.click(
			screen.getByRole("button", { name: "Continue with Google" }),
		);
		expect(
			(
				screen.getByRole("button", {
					name: "Send sign-in code",
				}) as HTMLButtonElement
			).disabled,
		).toBe(true);
		reject(new Error("provider secret=should-not-render"));
		const alert = await screen.findByRole("alert");
		expect(alert.textContent).toContain("Google sign-in wasn’t completed");
		expect(document.body.textContent).not.toContain("should-not-render");
		expect(
			(
				screen.getByRole("button", {
					name: "Continue with Google",
				}) as HTMLButtonElement
			).disabled,
		).toBe(false);
	});

	it("shows a retry message after cancellation and keeps email login available", async () => {
		mocks.search.oauthError = "google";
		show();
		expect(screen.getByRole("alert").textContent).toContain(
			"Google sign-in wasn’t completed",
		);
		fireEvent.change(screen.getByLabelText("Email address"), {
			target: { value: "learner@example.com" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Send sign-in code" }));
		await screen.findByLabelText("6-digit code");
		expect(mocks.sendCode).toHaveBeenCalledWith({
			email: "learner@example.com",
			type: "sign-in",
		});
		expect(screen.queryByRole("alert")).toBeNull();
		expect(mocks.social).not.toHaveBeenCalled();
	});
});
