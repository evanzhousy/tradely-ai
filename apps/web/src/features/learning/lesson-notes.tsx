import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Long-form reference rendering loads when the learner opens the notes. */
export function LessonNotes({ body }: { body: string }) {
	return (
		<article className="lesson-prose max-w-[72ch]">
			<ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
		</article>
	);
}
