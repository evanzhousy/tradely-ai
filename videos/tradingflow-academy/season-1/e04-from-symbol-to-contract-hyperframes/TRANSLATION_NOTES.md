# Translation notes

The S1E04 Remotion prototype was ported to a native HyperFrames composition with the following intentional changes:

- The Remotion caption rail is omitted from the HyperFrames picture master. Captions will remain editable and will be authored in ChatCut from the final HeyGen word timings.
- Remotion audio layers are omitted from the HyperFrames picture master. Narration, BGM, SFX, ducking, and loudness control move to the ChatCut timeline.
- Remotion `spring()` on the final brand lockup is approximated with a smooth `power3.out` GSAP settle. The TradingFlow Academy visual language is analytical rather than playful, so the tiny overshoot was intentionally removed.
- The expiry filter uses a deterministic character reveal and GSAP card collapse. It preserves the `type-and-filter` teaching grammar without depending on React frame calculations.
- Static assets formerly addressed through `staticFile()` were copied into `assets/` and use relative HyperFrames paths.

The original Remotion project remains next to this project as a frozen comparison source.
