import { Button } from "@tradely/ui/components/button";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@tradely/ui/components/table";
import type { LearningStepView, SourceWork } from "@/domain/learning/types";
import type { Locale } from "@/i18n/messages";

export function Worksheet({ data, locale }: { data: NonNullable<LearningStepView["worksheet"]>; locale: Locale }) {
	const chart = data.chart;
	const max = chart ? Math.max(1, ...data.rows.map(row => Number(row[chart.valueColumn]) || 0)) : 1;
	return <figure className="flex flex-col gap-3">
		<figcaption className="text-sm">{data.caption[locale]}</figcaption>
		{chart ? <div className="flex flex-col gap-3 rounded-xl bg-muted/30 p-4" role="img" aria-label={`${data.caption[locale]}; ${chart.unit[locale]}; ${data.rows.map(row => `${row[chart.labelColumn]}: ${row[chart.valueColumn]}`).join(", ")}`}>
			<p className="text-muted-foreground text-xs">{chart.unit[locale]} · {locale === "zh" ? "横轴从 0 起，右端" : "Axis starts at 0; maximum"} {max}</p>
			{data.rows.map(row => { const value=Number(row[chart.valueColumn]); const known=Number.isFinite(value) && row[chart.valueColumn].trim()!==""; return <div key={row.join("-")} className="grid grid-cols-[4rem_minmax(0,1fr)_4rem] items-center gap-3 text-sm"><span>{row[chart.labelColumn]}</span><div className="h-5 rounded bg-muted">{known ? <div className="h-full rounded bg-primary" style={{ width: `${Math.max(0,value)/max*100}%` }} /> : <span className="px-2 text-xs">{locale === "zh" ? "缺失" : "Missing"}</span>}</div><span className="font-mono">{known ? value : "—"}</span></div>; })}
			<p className="text-xs">{data.columns[chart.labelColumn][locale]} · {locale === "zh" ? "缺失不代表零。" : "Missing is not zero."}</p>
		</div> : null}
		<Table><thead><TableRow>{data.columns.map(column => <TableHead key={column.en}>{column[locale]}</TableHead>)}</TableRow></thead><TableBody>{data.rows.map((row,index) => <TableRow key={row.join("-")+index}>{row.map((cell,i) => <TableCell key={data.columns[i]?.en ?? i}>{cell}</TableCell>)}</TableRow>)}</TableBody></Table>
	</figure>;
}

export function workMarkdown(work: SourceWork, locale: Locale) {
	const parts = [`# ${work.lessonId}`, `${locale === "zh" ? "练习" : "Attempt"}: ${work.attemptId} · v${work.scenarioVersion}`, work.submittedAt,
		locale === "zh" ? "学习者作品。文字质量需自评或人工复核，不代表经认证掌握。" : "Learner work. Prose requires self or reviewer assessment; this is not a mastery certificate."];
	if (work.evidence) {
		parts.push(work.evidence.caption[locale], `| ${work.evidence.columns.map(c=>c[locale]).join(" | ")} |`, `| ${work.evidence.columns.map(()=>"---").join(" | ")} |`, ...work.evidence.rows.map(row=>`| ${row.join(" | ")} |`));
	}
	for (const field of work.fields) parts.push(`## ${field.label[locale]}`, field.localizedValue?.[locale] ?? field.value);
	return parts.join("\n\n");
}

export function WorkDocument({ work, locale, source = false }: { work: SourceWork; locale: Locale; source?: boolean }) {
	const text = (en: string, zh: string) => locale === "zh" ? zh : en;
	const download = () => {
		const url=URL.createObjectURL(new Blob([workMarkdown(work,locale)],{type:"text/markdown;charset=utf-8"}));
		const anchor=document.createElement("a");anchor.href=url;anchor.download=`${work.lessonId}-work.md`;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
	};
	return <section className="flex flex-col gap-4 rounded-xl border border-border p-4" aria-label={text(source ? "Your source work" : "Your saved work",source ? "你的来源作品" : "你保存的作品")}>
		<div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold">{text(source ? "Continue from your submitted work" : "Your research record",source ? "接续已提交作品" : "你的研究记录")}</h3><Button variant="outline" size="sm" onClick={download}>{text("Download Markdown", "下载 Markdown")}</Button></div>
		<p className="break-all text-muted-foreground text-xs">{work.lessonId} · v{work.scenarioVersion} · {work.submittedAt || text("Local preview", "本地预览")}</p>
		<p className="text-sm">{text("Your text is preserved for self or reviewer assessment. Saving it does not certify its reasoning.", "文字被保留用于自评或人工复核，保存不代表推理已获认证。")}</p>
		{work.evidence ? <Worksheet data={work.evidence} locale={locale} /> : null}
		{work.fields.map((field,index)=><div key={`${field.label.en}-${index}`} className="flex flex-col gap-1"><h4 className="font-medium text-sm">{field.label[locale]}</h4><p className="whitespace-pre-wrap break-words text-sm">{field.localizedValue?.[locale] ?? field.value}</p></div>)}
	</section>;
}
