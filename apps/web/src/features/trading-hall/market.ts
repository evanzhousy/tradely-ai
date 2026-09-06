import * as THREE from "three";

export const MARKET_SCREEN_COUNT = 60;
export const SYMBOLS = [
	"SPY",
	"QQQ",
	"NVDA",
	"AAPL",
	"MSFT",
	"TSLA",
	"AMZN",
	"META",
	"AMD",
	"GOOGL",
	"IWM",
	"DIA",
] as const;
const BASES = [565, 480, 128, 224, 418, 242, 183, 518, 154, 167, 214, 411];
export function simulatedCandle(screen: number, bar: number, tick: number) {
	const base = BASES[screen % BASES.length];
	const phase = bar * 0.43 + screen * 2.13;
	const drift =
		Math.sin(phase * 0.31) * base * 0.008 + Math.sin(phase) * base * 0.0015;
	const open = base + drift;
	const close =
		open +
		Math.sin(phase * 1.73 + (bar === 63 ? tick * 0.71 : 0)) * base * 0.0016;
	const spread = base * (0.0003 + Math.abs(Math.cos(phase)) * 0.0007);
	return {
		open,
		close,
		high: Math.max(open, close) + spread,
		low: Math.min(open, close) - spread,
	};
}
export function quoteAt(screen: number, tick: number) {
	return simulatedCandle(screen, 63, tick).close;
}

/** One atlas serves all sixty Blender screen surfaces in a single draw call. */
export function createMarketDisplays(compact: boolean) {
	const scale = compact ? 0.75 : 1;
	const width = Math.round(384 * scale);
	const height = Math.round(216 * scale);
	const canvas = document.createElement("canvas");
	canvas.width = width * 8;
	canvas.height = height * 8;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Market canvas unavailable");
	const texture = new THREE.CanvasTexture(canvas);
	texture.flipY = false;
	texture.colorSpace = THREE.SRGBColorSpace;
	texture.minFilter = THREE.LinearFilter;
	texture.generateMipmaps = false;
	const tickerCanvas = document.createElement("canvas");
	tickerCanvas.width = 2048;
	tickerCanvas.height = 96;
	const rawTickerContext = tickerCanvas.getContext("2d");
	if (!rawTickerContext) throw new Error("Ticker canvas unavailable");
	const tickerContext = rawTickerContext;
	const tickerTexture = new THREE.CanvasTexture(tickerCanvas);
	tickerTexture.flipY = false;
	tickerTexture.colorSpace = THREE.SRGBColorSpace;
	tickerTexture.wrapS = THREE.RepeatWrapping;
	let previousTick = -1;
	function paintTile(index: number, tick: number) {
		if (!ctx) return;
		ctx.save();
		ctx.translate((index % 8) * width, Math.floor(index / 8) * height);
		ctx.scale(scale, scale);
		ctx.fillStyle = "#060f16";
		ctx.fillRect(0, 0, 384, 216);
		ctx.fillStyle = "#102634";
		ctx.fillRect(0, 0, 384, 23);
		ctx.font = "bold 10px monospace";
		ctx.fillStyle = "#a5c7d6";
		ctx.fillText(
			`${index % 2 ? "XNAS" : "XNYS"} / ${SYMBOLS[index % 12]}`,
			11,
			15,
		);
		ctx.fillStyle = "#c8a85a";
		ctx.font = "8px monospace";
		ctx.fillText("SIMULATED", 310, 15);
		const quote = quoteAt(index, tick);
		ctx.fillStyle = "#63c5aa";
		ctx.font = "bold 19px monospace";
		ctx.fillText(quote.toFixed(2), 12, 48);
		ctx.font = "9px monospace";
		ctx.fillStyle = "#708e9a";
		ctx.fillText("INTRADAY   1m   5m   15m   1h", 12, 66);
		if (index % 4 === 1) {
			ctx.font = "9px monospace";
			for (let r = 0; r < 11; r++) {
				const q = quoteAt(index + r, tick);
				const y = 82 + r * 11;
				ctx.fillStyle = r % 2 ? "#091821" : "#0c1d26";
				ctx.fillRect(8, y - 8, 368, 11);
				ctx.fillStyle = "#b3c6ce";
				ctx.fillText(SYMBOLS[(index + r) % 12], 14, y);
				ctx.fillStyle = r % 3 ? "#55b5a3" : "#d88678";
				ctx.fillText(q.toFixed(2), 95, y);
				ctx.fillText(
					`${r % 3 ? "+" : "-"}${(0.1 + Math.abs(Math.sin(r + tick * 0.4)) * 1.2).toFixed(2)}%`,
					184,
					y,
				);
				ctx.fillStyle = "#8da2ac";
				ctx.fillText(`${(2.4 + r * 1.1).toFixed(1)}M`, 291, y);
			}
		} else {
			const candles = Array.from({ length: 64 }, (_, bar) =>
				simulatedCandle(index, bar, tick),
			);
			const low = Math.min(...candles.map((c) => c.low));
			const high = Math.max(...candles.map((c) => c.high));
			const y = (v: number) => 80 + (1 - (v - low) / (high - low)) * 89;
			ctx.strokeStyle = "#18303a";
			ctx.lineWidth = 0.5;
			for (let row = 0; row < 5; row++) {
				ctx.beginPath();
				ctx.moveTo(10, 80 + row * 24);
				ctx.lineTo(295, 80 + row * 24);
				ctx.stroke();
			}
			for (let col = 0; col < 6; col++) {
				ctx.beginPath();
				ctx.moveTo(12 + col * 55, 77);
				ctx.lineTo(12 + col * 55, 195);
				ctx.stroke();
			}
			candles.forEach((c, i) => {
				const x = 14 + i * 4.3;
				const color = c.close >= c.open ? "#62c9b0" : "#d77d73";
				ctx.strokeStyle = color;
				ctx.fillStyle = color;
				ctx.beginPath();
				ctx.moveTo(x, y(c.high));
				ctx.lineTo(x, y(c.low));
				ctx.stroke();
				ctx.fillRect(
					x - 1.1,
					Math.min(y(c.open), y(c.close)),
					2.5,
					Math.max(1, Math.abs(y(c.open) - y(c.close))),
				);
				ctx.globalAlpha = 0.35;
				ctx.fillRect(
					x - 1.1,
					194 - (8 + Math.abs(Math.sin(i * 5.12)) * 12),
					2.6,
					8 + Math.abs(Math.sin(i * 5.12)) * 12,
				);
				ctx.globalAlpha = 1;
			});
			ctx.font = "8px monospace";
			for (let r = 0; r < 12; r++) {
				ctx.fillStyle = r < 6 ? "#cf817a" : "#65bca5";
				ctx.fillText((quote + (6 - r) * 0.025).toFixed(2), 302, 80 + r * 10);
				ctx.fillStyle = "#91a7ae";
				ctx.fillText(
					String(100 + ((index * 31 + r * 71 + tick * 13) % 900)),
					352,
					80 + r * 10,
				);
			}
		}
		ctx.fillStyle = "#416575";
		ctx.font = "8px monospace";
		ctx.fillText(
			`TRADELY research / demo session  ${String(Math.floor(tick / 120)).padStart(2, "0")}:${String(Math.floor(tick / 2) % 60).padStart(2, "0")}`,
			12,
			209,
		);
		ctx.restore();
	}
	function update(seconds: number) {
		const tick = Math.floor(seconds * 2);
		if (tick !== previousTick) {
			for (let i = 0; i < MARKET_SCREEN_COUNT; i++) paintTile(i, tick);
			texture.needsUpdate = true;
			tickerContext.fillStyle = "#090d0b";
			tickerContext.fillRect(0, 0, 2048, 96);
			tickerContext.font = "bold 23px monospace";
			for (let i = 0; i < 8; i++) {
				const x = i * 256;
				tickerContext.fillStyle = "#e6bf70";
				tickerContext.fillText(SYMBOLS[i], x + 10, 33);
				tickerContext.fillStyle = i % 3 ? "#90ccb6" : "#db9e83";
				tickerContext.fillText(quoteAt(i, tick).toFixed(2), x + 91, 33);
				tickerContext.fillStyle = "#8a794f";
				tickerContext.font = "15px monospace";
				tickerContext.fillText("SIMULATED MARKET", x + 10, 69);
				tickerContext.font = "bold 23px monospace";
			}
			tickerTexture.needsUpdate = true;
			previousTick = tick;
		}
		tickerTexture.offset.x = seconds * 0.016;
		return tick;
	}
	update(0);
	return {
		texture,
		tickerTexture,
		update,
		dispose() {
			texture.dispose();
			tickerTexture.dispose();
			canvas.width = 1;
			canvas.height = 1;
			tickerCanvas.width = 1;
			tickerCanvas.height = 1;
		},
	};
}
