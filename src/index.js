/**
 * Example showcasing Line Series feature for coloring line dynamically based on X coordinates
 */

const lcjs = require('@lightningchart/lcjs')
const { lightningChart, emptyFill, PalettedFill, LUT, ColorRGBA, AxisTickStrategies, Themes } = lcjs

const chart = lightningChart({
            resourcesBaseUrl: new URL(document.head.baseURI).origin + new URL(document.head.baseURI).pathname + 'resources/',
        })
    .ChartXY({
        legend: { visible: false },
        theme: (() => {
    const t = Themes[new URLSearchParams(window.location.search).get('theme') || 'darkGold'] || undefined
    const smallView = Math.min(window.innerWidth, window.innerHeight) < 500
    if (!window.__lcjsDebugOverlay) {
        window.__lcjsDebugOverlay = document.createElement('div')
        window.__lcjsDebugOverlay.style.cssText = 'position:fixed;top:0;left:0;background:rgba(0,0,0,0.7);color:#fff;padding:4px 8px;z-index:99999;font:12px monospace;pointer-events:none'
        if (document.body) document.body.appendChild(window.__lcjsDebugOverlay)
        setInterval(() => {
            if (!window.__lcjsDebugOverlay.parentNode && document.body) document.body.appendChild(window.__lcjsDebugOverlay)
            window.__lcjsDebugOverlay.textContent = window.innerWidth + 'x' + window.innerHeight + ' dpr=' + window.devicePixelRatio + ' small=' + (Math.min(window.innerWidth, window.innerHeight) < 500)
        }, 500)
    }
    return t && smallView ? lcjs.scaleTheme(t, 0.5) : t
})(),
    })
    .setTitle('ECG chart with color highlighted heart beats')

const axisX = chart.getDefaultAxisX().setTickStrategy(AxisTickStrategies.Time)

const axisY = chart.getDefaultAxisY().setTitle('mV')

fetch(new URL(document.head.baseURI).origin + new URL(document.head.baseURI).pathname + 'examples/assets/0050/data.json')
    .then((r) => r.json())
    .then((ecgValuesY) => {
        const lineSeries = chart.addLineSeries().appendSamples({ yValues: ecgValuesY })

        // Detect beats from ECG data set, listing the ranges as X coordinates (data point indexes).
        const beats = []
        let yPrev
        let iPeakHigh
        let iPeakLow
        for (let i = 0; i < ecgValuesY.length; i += 1) {
            const y = ecgValuesY[i]
            if (iPeakHigh === undefined) {
                // Check for high peak.
                if (y > 700 && y < yPrev) {
                    // High peak.
                    iPeakHigh = i
                }
            } else if (iPeakLow === undefined) {
                // Check for low peak.
                if (y < -700 && y > yPrev) {
                    iPeakLow = i
                    // Mark beat range as data point indexes.
                    beats.push({ iStart: iPeakHigh - 40, iEnd: iPeakLow + 120 })
                    iPeakHigh = undefined
                    iPeakLow = undefined
                }
            }
            yPrev = y
        }

        // Style line series so that beat X ranges are highlighted with a special color.
        const colorDefault = lineSeries.getStrokeStyle().getFillStyle().getColor()
        const colorNormal = colorDefault
        const colorHighlight = ColorRGBA(0, 255, 0)
        const xPalette = new PalettedFill({
            lookUpProperty: 'x',
            lut: new LUT({
                interpolate: false,
                steps: [
                    { value: 0, color: colorNormal },
                    ...beats
                        .map((beat) => [
                            { value: beat.iStart, color: colorHighlight },
                            { value: beat.iEnd, color: colorNormal },
                        ])
                        .flat(),
                ],
            }),
        })

        lineSeries.setStrokeStyle((stroke) => stroke.setFillStyle(xPalette))
        axisX.setStrokeStyle((stroke) => stroke.setFillStyle(xPalette))
    })
