(function registerTradingFlowCharts() {
  if (window.TradingFlowCharts) return;

  const palette = {
    ink: "#1f2be0",
    candleUp: "#ffffff",
    candleDown: "#6366f1",
    candleBorderUp: "#4338ca",
    candleBorderDown: "#312e81",
    wickUp: "#4338ca",
    wickDown: "#312e81",
    priceLine: "#4338ca",
    grid: "rgba(31, 43, 224, 0.12)",
    scaleBorder: "rgba(31, 43, 224, 0.34)",
    areaLine: "rgba(79, 70, 229, 0.22)",
    areaTop: "rgba(99, 102, 241, 0.12)",
    areaBottom: "rgba(224, 231, 255, 0.02)",
  };

  function formatTradingDay(time) {
    let month;
    let day;

    if (typeof time === "string") {
      const parts = time.split("-");
      month = Number(parts[1]);
      day = Number(parts[2]);
    } else if (time && typeof time === "object") {
      month = Number(time.month);
      day = Number(time.day);
    }

    if (!month || !day) return "";

    const monthNames = ["", "JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    return `${monthNames[month]} ${String(day).padStart(2, "0")}`;
  }

  function createCandlestick(config) {
    const library = window.LightweightCharts;
    const container = document.getElementById(config.containerId);

    if (!library || !container) {
      throw new Error(`Lightweight Charts unavailable for ${config.containerId}`);
    }

    const width = container.clientWidth || config.fallbackWidth;
    const height = container.clientHeight || config.fallbackHeight;
    const chart = library.createChart(container, {
      width,
      height,
      layout: {
        background: { type: library.ColorType.Solid, color: "rgba(255, 255, 255, 0.82)" },
        textColor: palette.ink,
        fontFamily: '"DM Mono", monospace',
        fontSize: config.fontSize || 11,
        attributionLogo: true,
      },
      grid: {
        vertLines: { color: palette.grid },
        horzLines: { color: palette.grid },
      },
      rightPriceScale: {
        visible: true,
        borderVisible: true,
        borderColor: palette.scaleBorder,
        entireTextOnly: true,
        minimumWidth: config.priceScaleWidth || 70,
        tickMarkDensity: 2.2,
        scaleMargins: {
          top: config.marker ? 0.2 : 0.14,
          bottom: 0.14,
        },
      },
      leftPriceScale: { visible: false },
      timeScale: {
        visible: true,
        timeVisible: false,
        secondsVisible: false,
        borderVisible: true,
        borderColor: palette.scaleBorder,
        ticksVisible: false,
        allowBoldLabels: false,
        uniformDistribution: true,
        lockVisibleTimeRangeOnResize: true,
        shiftVisibleRangeOnNewBar: false,
        tickMarkMaxCharacterLength: 6,
        tickMarkFormatter: formatTradingDay,
      },
      crosshair: {
        vertLine: { visible: false, labelVisible: false },
        horzLine: { visible: false, labelVisible: false },
      },
      handleScroll: false,
      handleScale: false,
      kineticScroll: {
        mouse: false,
        touch: false,
      },
    });

    const areaSeries = chart.addSeries(library.AreaSeries, {
      lineColor: palette.areaLine,
      lineWidth: 1,
      topColor: palette.areaTop,
      bottomColor: palette.areaBottom,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });
    areaSeries.setData(config.data.map((bar) => ({ time: bar.time, value: bar.close })));

    const candleSeries = chart.addSeries(library.CandlestickSeries, {
      upColor: palette.candleUp,
      downColor: palette.candleDown,
      borderVisible: true,
      borderUpColor: palette.candleBorderUp,
      borderDownColor: palette.candleBorderDown,
      wickUpColor: palette.wickUp,
      wickDownColor: palette.wickDown,
      priceLineVisible: false,
      lastValueVisible: false,
      priceFormat: {
        type: "price",
        precision: config.precision,
        minMove: config.minMove,
      },
    });
    candleSeries.setData(config.data);

    candleSeries.createPriceLine({
      price: config.lastPrice,
      color: palette.priceLine,
      lineWidth: 1,
      lineStyle: library.LineStyle.Dashed,
      lineVisible: true,
      axisLabelVisible: true,
      title: "CLOSE",
    });

    if (config.marker) {
      library.createSeriesMarkers(
        candleSeries,
        [
          {
            time: config.marker.time,
            position: config.marker.position || "aboveBar",
            color: palette.priceLine,
            shape: config.marker.shape || "arrowDown",
            text: config.marker.text,
          },
        ],
        { autoScale: false },
      );
    }

    chart.timeScale().setVisibleLogicalRange({
      from: -3,
      to: 7,
    });
    chart.resize(width, height, true);

    window.__tradingFlowLightweightCharts = window.__tradingFlowLightweightCharts || [];
    window.__tradingFlowLightweightCharts.push({ chart, candleSeries, areaSeries });
    return { chart, candleSeries, areaSeries };
  }

  window.TradingFlowCharts = {
    createCandlestick,
    palette,
  };
})();
