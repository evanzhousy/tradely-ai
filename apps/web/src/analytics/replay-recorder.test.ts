// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import "posthog-js/dist/posthog-recorder";
import { replayPrivacyOptions } from "./replay-privacy";

describe("real recorder privacy", () => {
	let stop: (() => void) | undefined;
	afterEach(() => {
		stop?.();
		document.body.innerHTML = "";
	});

	it("masks real snapshot text and attributes while blocking lesson and media subtrees", async () => {
		const record = (
			window as unknown as Window & {
				__PosthogExtensions__: {
					rrweb: {
						record: typeof import("posthog-js/dist/posthog-recorder")["default"];
					};
				};
			}
		).__PosthogExtensions__.rrweb.record;
		document.body.innerHTML = `
			<div class="layout"><p>sensitive-text</p>
			<input value="sensitive-input" placeholder="sensitive-placeholder" />
			<a href="/pricing?token=sensitive-link" title="sensitive-title">Account</a>
			<div id="interactive-practice"><p>sensitive-lesson</p></div>
			<video src="/private?token=sensitive-media"></video></div>`;
		const events: unknown[] = [];
		stop = record({
			emit: (event) => events.push(event),
			maskAllInputs: true,
			maskTextSelector: "*",
			blockSelector: replayPrivacyOptions.blockSelector ?? undefined,
			maskAttributeFn: replayPrivacyOptions.maskAttributeFn ?? undefined,
			slimDOMOptions: true,
		});
		const input = document.querySelector("input") as HTMLInputElement;
		input.value = "sensitive-change";
		input.dispatchEvent(new Event("input", { bubbles: true }));
		input.setAttribute("title", "sensitive-mutation");
		await new Promise((resolve) => setTimeout(resolve, 30));
		expect(events.length).toBeGreaterThan(1);
		const payload = JSON.stringify(events);
		expect(payload).not.toContain("sensitive-");
		expect(payload).toContain("layout");
	});
});
