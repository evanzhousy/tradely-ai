import { Button } from "@tradely/ui/components/button";
import { Field, FieldDescription, FieldLabel } from "@tradely/ui/components/field";
import { Input } from "@tradely/ui/components/input";
import { Textarea } from "@tradely/ui/components/textarea";
import { useEffect, useId, useState } from "react";
import { type LearningQuestion, responseComplete } from "@/domain/learning/types";
import type { Locale } from "@/i18n/messages";

export function ResponseField({ question, value, locale, disabled, onSave, onDraftChange }: { question: LearningQuestion; value: string; locale: Locale; disabled: boolean; onSave: (value: string) => void; onDraftChange: (id: string, dirty: boolean) => void }) {
	const id = useId();
	const [draft, setDraft] = useState(value);
	useEffect(() => setDraft(value), [value]);
	useEffect(() => { onDraftChange(question.id, draft !== value); return () => onDraftChange(question.id, false); }, [draft, value, onDraftChange, question.id]);
	const input = question.input;
	if (!input) return null;
	const valid = responseComplete(question, draft);
	const dirty = draft !== value;
	return <Field data-invalid={!!draft && !valid} data-disabled={disabled}>
		<FieldLabel htmlFor={id}>{question.prompt[locale]}</FieldLabel>
		{input.kind === "number" ? <Input id={id} inputMode="decimal" value={draft} maxLength={40} aria-invalid={!!draft && !valid} aria-describedby={`${id}-help`} disabled={disabled} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && valid && dirty) { event.preventDefault(); onSave(draft); } }} /> : <Textarea id={id} rows={4} value={draft} maxLength={input.maxLength} disabled={disabled} aria-invalid={!!draft && !valid} aria-describedby={`${id}-help`} onChange={event => setDraft(event.target.value)} />}
		<FieldDescription id={`${id}-help`}>{input.kind === "number" ? `${input.unit[locale]} · ${locale === "zh" ? "只填数值，例如 1250 或 -2.5，无需填写单位。" : "Enter a number, e.g. 1250 or -2.5, without its unit."}` : locale === "zh" ? `写下自己的解释（${input.minLength}–${input.maxLength} 字符）。保存后需对照参考答案自评，系统不自动判断文字质量。` : `Write your own explanation (${input.minLength}–${input.maxLength} characters). Saved for comparison with the reference; prose quality is not automatically graded.`}</FieldDescription>
		<Button size="sm" variant="outline" className="self-start" disabled={disabled || !valid || !dirty} onClick={() => onSave(draft)}>{dirty || !value ? locale === "zh" ? "保存回答" : "Save response" : locale === "zh" ? "已保存回答" : "Response saved"}</Button>
		{dirty ? <p className="text-xs" role="status">{locale === "zh" ? "此修改尚未保存。继续前请保存。" : "This edit is not saved. Save it before continuing."}</p> : null}
	</Field>;
}
