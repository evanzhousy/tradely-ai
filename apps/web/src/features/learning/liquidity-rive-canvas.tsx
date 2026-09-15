import LessonRiveCanvas, { type LessonRiveValues } from "./lesson-rive-canvas";
import assetUrl from "./rive/liquidity/liquidity.riv?url&inline";

export type LiquidityCanvasValues = LessonRiveValues;

export default function LiquidityRiveCanvas(props: {
	values: LiquidityCanvasValues;
	playing: boolean;
	onFailure: () => void;
}) {
	return (
		<LessonRiveCanvas
			{...props}
			src={assetUrl}
			name="Liquidity"
			className="liquidity-rive-canvas"
		/>
	);
}
