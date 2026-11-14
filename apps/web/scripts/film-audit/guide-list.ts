// One line a guide for film-audit.sh guide-cards: slug, the first related lesson (whose film the
// card shows) and the title, tab-separated.
import { guides } from "../../src/content/guides";

for (const guide of guides)
	console.log([guide.slug, guide.lessonIds[0], guide.title].join("\t"));
