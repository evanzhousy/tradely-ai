import LessonRiveCanvas, { type LessonRiveValues } from "./lesson-rive-canvas";
import assetUrl from "./rive/settlement/settlement.riv?url&inline";

export default function SettlementRiveCanvas(props: {
	values: LessonRiveValues;
	playing: boolean;
	onFailure: () => void;
}) {
	return (
		<LessonRiveCanvas
			{...props}
			src={assetUrl}
			name="Settlement"
			className="settlement-rive-canvas"
		/>
	);
}
