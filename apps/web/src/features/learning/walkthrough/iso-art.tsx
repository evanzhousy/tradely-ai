import type { SolidPaths } from "./iso";

/**
 * One isometric solid in the stage's tones (`.wt-iso-*` in walkthrough.css): its paper, the
 * faces turned to the viewer in four shades, its top, the creases and its outline. A lit
 * solid takes the focus colour on its edges: the part the shot is about.
 */
export function IsoSolid({
	paths,
	lit = false,
	flat = false,
}: {
	paths: SolidPaths;
	lit?: boolean;
	flat?: boolean;
}) {
	return (
		<g className="wt-iso" data-lit={lit ? "" : undefined}>
			<path className="wt-iso-fill" d={paths.fill} />
			{!flat &&
				paths.shades.map((d, shade) =>
					d ? (
						<path
							key={shade}
							className="wt-iso-shade"
							data-shade={shade}
							d={d}
						/>
					) : null,
				)}
			{!flat && <path className="wt-iso-top" d={paths.top} />}
			{paths.crease && (
				<path className="wt-iso-line wt-iso-crease" d={paths.crease} />
			)}
			{paths.bevel && (
				<path className="wt-iso-line wt-iso-crease" d={paths.bevel} />
			)}
			<path className="wt-iso-line wt-iso-edge" d={paths.outline} />
		</g>
	);
}
